from fastapi import APIRouter, HTTPException, Query, Body
from typing import List, Dict, Any, Optional
from app.services.store import store
from app.ml.explainability import analyze_explainability
from app.services.notes_triage import triage_officer_note
from app.services.referral import get_recommended_doctors, book_doctor_referral
from app.schemas.domain import (
    RiskAnalysisResponse, NoteTriageRequest, NoteTriageResponse,
    DoctorInfo, DoctorBookingRequest, DoctorBookingResponse, OutcomeLogRequest
)

router = APIRouter(prefix="/api/welfare", tags=["welfare"])

@router.get("/cases")
def list_welfare_cases(
    unit_id: Optional[str] = None,
    risk_band: Optional[str] = None,
    trajectory: Optional[str] = None,
    search: Optional[str] = None
):
    raw_df = store.raw_df
    latest_df = raw_df[raw_df["week_index"] == 5]
    
    cases = []
    for _, row in latest_df.iterrows():
        p_id = row["person_id"]
        historical = store.get_historical_records(p_id)
        
        score, band = store.model.predict_risk(row.to_dict())
        
        # Trajectory
        h_scores = [store.model.predict_risk(h)[0] for h in historical]
        diff = h_scores[-1] - h_scores[0] if len(h_scores) >= 2 else 0.0
        if diff > 5.0:
            traj = "Rising"
        elif diff < -5.0:
            traj = "Decreasing"
        else:
            traj = "Stable"
            
        elevating, _, _ = analyze_explainability(store.model, row.to_dict())
        top_factors = [f"{e['feature_label']} ({e['value_display']})" for e in elevating[:2]]
        
        # Check notes/outcome status
        p_notes = [n for n in store.notes if n["person_id"] == p_id]
        p_outcome = next((o for o in store.outcomes if o["person_id"] == p_id), None)
        
        case_obj = {
            "person_id": p_id,
            "name": row["name"],
            "rank": row["rank"],
            "unit_id": row["unit_id"],
            "unit_name": row["unit_name"],
            "risk_score": score,
            "risk_band": band,
            "trajectory": traj,
            "duty_hours_weekly": row["duty_hours_weekly"],
            "night_shifts_monthly": row["night_shifts_monthly"],
            "days_since_last_leave": row["days_since_last_leave"],
            "top_factors_summary": top_factors,
            "has_notes": len(p_notes) > 0,
            "latest_priority": p_notes[0]["follow_up_priority"] if p_notes else "Not Triaged",
            "outcome_status": p_outcome["outcome"] if p_outcome else "Pending Review",
            "has_voluntary_input": bool(row["has_voluntary_input"])
        }
        
        # Filtering
        if unit_id and unit_id != "ALL" and case_obj["unit_id"] != unit_id:
            continue
        if risk_band and risk_band != "ALL" and case_obj["risk_band"] != risk_band:
            continue
        if trajectory and trajectory != "ALL" and case_obj["trajectory"] != trajectory:
            continue
        if search:
            q = search.lower()
            if q not in case_obj["name"].lower() and q not in case_obj["person_id"].lower() and q not in case_obj["rank"].lower():
                continue
                
        cases.append(case_obj)
        
    # Sort cases: highest risk score first
    cases = sorted(cases, key=lambda x: x["risk_score"], reverse=True)
    return cases

@router.get("/cases/{person_id}")
def get_case_detail(person_id: str):
    latest_rec = store.get_latest_person_record(person_id)
    if not latest_rec:
        raise HTTPException(status_code=404, detail=f"Personnel {person_id} not found.")
        
    historical_recs = store.get_historical_records(person_id)
    score, band = store.model.predict_risk(latest_rec)
    elevating, mitigating, recommendations = analyze_explainability(store.model, latest_rec)
    
    history = []
    scores = []
    for r in historical_recs:
        s, _ = store.model.predict_risk(r)
        scores.append(s)
        history.append({"week": r["week"], "score": s})
        
    diff = scores[-1] - scores[0] if len(scores) >= 2 else 0.0
    trajectory = "Rising" if diff > 5.0 else ("Decreasing" if diff < -5.0 else "Stable")
    
    # Existing triage notes & doctor referrals for this person
    person_notes = [n for n in store.notes if n["person_id"] == person_id]
    person_referrals = [r for r in store.referrals if r["person_id"] == person_id]
    person_outcome = next((o for o in store.outcomes if o["person_id"] == person_id), None)
    
    doctors, matched_doc_id = get_recommended_doctors(person_id)
    
    return {
        "person_id": latest_rec["person_id"],
        "name": latest_rec["name"],
        "rank": latest_rec["rank"],
        "unit_id": latest_rec["unit_id"],
        "unit_name": latest_rec["unit_name"],
        "risk_score": score,
        "risk_band": band,
        "trajectory": trajectory,
        "historical_scores": history,
        "work_patterns": {
            "duty_hours_weekly": latest_rec["duty_hours_weekly"],
            "night_shifts_monthly": latest_rec["night_shifts_monthly"],
            "leave_utilization_pct": latest_rec["leave_utilization_pct"],
            "deployment_length_months": latest_rec["deployment_length_months"],
            "days_since_last_leave": latest_rec["days_since_last_leave"],
            "workload_intensity_index": latest_rec["workload_intensity_index"]
        },
        "voluntary_wellness": {
            "has_voluntary_input": bool(latest_rec["has_voluntary_input"]),
            "sleep_quality": latest_rec["sleep_quality"] if latest_rec["has_voluntary_input"] else None,
            "stress_level": latest_rec["stress_level"] if latest_rec["has_voluntary_input"] else None,
            "mood_score": latest_rec["mood_score"] if latest_rec["has_voluntary_input"] else None
        },
        "top_elevating_factors": elevating,
        "top_mitigating_factors": mitigating,
        "actionable_recommendations": recommendations,
        "triage_notes": person_notes,
        "referrals": person_referrals,
        "consultation_outcome": person_outcome,
        "recommended_doctors": doctors,
        "matched_doctor_id": matched_doc_id
    }

@router.post("/triage-note", response_model=NoteTriageResponse)
def submit_and_triage_note(body: NoteTriageRequest):
    try:
        return triage_officer_note(
            person_id=body.person_id,
            officer_id=body.officer_id,
            officer_name=body.officer_name,
            note_text=body.free_text_note
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/referrals", response_model=DoctorBookingResponse)
def create_doctor_referral(body: DoctorBookingRequest):
    try:
        return book_doctor_referral(
            person_id=body.person_id,
            doctor_id=body.doctor_id,
            slot_time=body.slot_time,
            officer_id=body.officer_id,
            consent_acknowledged=body.consent_acknowledged
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/outcomes")
def log_consultation_outcome(body: OutcomeLogRequest):
    person_rec = store.get_latest_person_record(body.person_id)
    if not person_rec:
        raise HTTPException(status_code=404, detail=f"Personnel {body.person_id} not found.")
        
    outcome_entry = {
        "person_id": body.person_id,
        "officer_id": body.officer_id,
        "outcome": body.outcome,
        "notes": body.outcome_notes,
        "timestamp": store.audit_logs[0]["timestamp"] if store.audit_logs else "2026-09-02T21:00:00Z"
    }
    
    # Upsert outcome
    store.outcomes = [o for o in store.outcomes if o["person_id"] != body.person_id]
    store.outcomes.insert(0, outcome_entry)
    
    # Audit log
    store.add_audit_log(
        actor_id=body.officer_id,
        actor_name="Welfare Officer",
        actor_role="welfare_officer",
        action_type="CONSULTATION_OUTCOME_LOGGED",
        target_person_id=body.person_id,
        details=f"Logged outcome '{body.outcome}' for personnel {body.person_id}. Note: {body.outcome_notes}"
    )
    
    return {"status": "Success", "outcome": body.outcome}
