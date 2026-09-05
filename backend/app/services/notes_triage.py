import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Tuple
from app.services.store import store
from app.ml.explainability import analyze_explainability
from app.schemas.domain import NoteTriageResponse

CATEGORY_KEYWORDS = {
    "Exhaustion & Fatigue": ["exhausted", "exhaustion", "tired", "sleep", "fatigue", "drowsy", "insomnia", "out of energy", "restless", "yawning", "lethargic"],
    "Family & Personal Stress": ["family", "wife", "husband", "child", "children", "home", "parent", "financial", "loan", "domestic", "distance", "marital"],
    "Social Isolation & Mood": ["withdrawn", "quiet", "silent", "isolated", "alone", "avoids", "irritated", "argumentative", "distant", "low mood", "gloomy"],
    "Physical Strain": ["pain", "back", "joint", "physical", "injured", "headache", "dizziness", "exertion", "strained", "body ache"],
    "Shift Overload & Burnout": ["overtime", "extra shift", "double duty", "no break", "consecutive", "relentless", "stretched", "overworked", "burden"]
}

CATEGORY_FACTOR_MAP = {
    "Exhaustion & Fatigue": ["night_shifts_monthly", "sleep_quality_imputed", "duty_hours_weekly"],
    "Family & Personal Stress": ["days_since_last_leave", "leave_utilization_pct"],
    "Social Isolation & Mood": ["mood_score_imputed", "stress_level_imputed"],
    "Physical Strain": ["workload_intensity_index", "duty_hours_weekly"],
    "Shift Overload & Burnout": ["duty_hours_weekly", "night_shifts_monthly", "workload_intensity_index"]
}

def triage_officer_note(person_id: str, officer_id: str, officer_name: str, note_text: str) -> NoteTriageResponse:
    person_rec = store.get_latest_person_record(person_id)
    if not person_rec:
        raise ValueError(f"Personnel {person_id} not found.")
        
    score, band = store.model.predict_risk(person_rec)
    elevating_factors, _, _ = analyze_explainability(store.model, person_rec)
    top_factor_names = [f["feature_name"] for f in elevating_factors[:4]]
    
    # 1. Category extraction via keyword matching
    note_lower = note_text.lower()
    extracted_categories = []
    
    for category, keywords in CATEGORY_KEYWORDS.items():
        for kw in keywords:
            if kw in note_lower:
                extracted_categories.append(category)
                break
                
    if not extracted_categories:
        extracted_categories = ["General Welfare Observation"]
        
    # 2. Cross-referencing against model top risk factors
    corroborated_factors = []
    new_surfaced_factors = []
    
    for cat in extracted_categories:
        mapped_feats = CATEGORY_FACTOR_MAP.get(cat, [])
        is_corroborated = any(f in top_factor_names for f in mapped_feats)
        if is_corroborated:
            corroborated_factors.append(cat)
        else:
            if cat != "General Welfare Observation":
                new_surfaced_factors.append(cat)
                
    # Determine corroboration status
    if corroborated_factors and new_surfaced_factors:
        corroboration_status = "Corroborated Signal + New Qualitative Insight"
    elif corroborated_factors:
        corroboration_status = "Corroborated Signal"
    elif new_surfaced_factors:
        corroboration_status = "New Unrecorded Signal"
    else:
        corroboration_status = "Baseline Observation"
        
    # 3. Follow-up Priority Calculation
    if band in ["High", "Critical"] or len(new_surfaced_factors) >= 1 or len(corroborated_factors) >= 2:
        follow_up_priority = "Urgent"
        rationale = "High/Critical risk score or newly surfaced qualitative stressor requires timely non-disciplinary officer conversation within 24-48 hours."
    elif band == "Moderate" or len(corroborated_factors) == 1:
        follow_up_priority = "Soon"
        rationale = "Moderate risk trajectory or single corroborated factor. Recommend supportive check-in during upcoming routine duty review."
    else:
        follow_up_priority = "Routine"
        rationale = "Low risk indicators and baseline observation. Continue standard unit welfare monitoring."
        
    note_id = f"NOTE_{uuid.uuid4().hex[:8].upper()}"
    timestamp_str = datetime.now(timezone.utc).isoformat()
    
    res = NoteTriageResponse(
        note_id=note_id,
        person_id=person_id,
        created_at=timestamp_str,
        extracted_categories=extracted_categories,
        corroboration_status=corroboration_status,
        corroborated_factors=corroborated_factors,
        new_surfaced_factors=new_surfaced_factors,
        follow_up_priority=follow_up_priority,
        priority_rationale=rationale,
        officer_note=note_text
    )
    
    # Store in DataStore runtime memory
    store.notes.insert(0, res.model_dump())
    
    # Log audit entry
    store.add_audit_log(
        actor_id=officer_id,
        actor_name=officer_name,
        actor_role="welfare_officer",
        action_type="OFFICER_NOTE_TRIAGED",
        target_person_id=person_id,
        details=f"Triaged note for {person_rec['name']} ({person_id}). Priority: {follow_up_priority}. Categories: {', '.join(extracted_categories)}."
    )
    
    return res
