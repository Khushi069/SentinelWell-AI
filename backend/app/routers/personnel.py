from fastapi import APIRouter, HTTPException, Query
from typing import List, Dict, Any
from app.services.store import store
from app.ml.explainability import analyze_explainability
from app.schemas.domain import RiskAnalysisResponse, VoluntaryCheckinRequest, FactorContribution

router = APIRouter(prefix="/api/personnel", tags=["personnel"])

@router.get("/me", response_model=RiskAnalysisResponse)
def get_my_wellness_profile(person_id: str = Query("PERS_1001", description="Personnel ID")):
    latest_rec = store.get_latest_person_record(person_id)
    if not latest_rec:
        raise HTTPException(status_code=404, detail=f"Personnel profile {person_id} not found.")
        
    historical_recs = store.get_historical_records(person_id)
    
    score, band = store.model.predict_risk(latest_rec)
    elevating, mitigating, recommendations = analyze_explainability(store.model, latest_rec)
    
    # Format 6-week trajectory history
    history = []
    scores = []
    for r in historical_recs:
        s, _ = store.model.predict_risk(r)
        scores.append(s)
        history.append({"week": r["week"], "score": s})
        
    # Trajectory calculation
    if len(scores) >= 2:
        diff = scores[-1] - scores[0]
        if diff > 5.0:
            trajectory = "Rising"
        elif diff < -5.0:
            trajectory = "Decreasing"
        else:
            trajectory = "Stable"
    else:
        trajectory = "Stable"
        
    return RiskAnalysisResponse(
        person_id=latest_rec["person_id"],
        person_name=latest_rec["name"],
        rank=latest_rec["rank"],
        unit_id=latest_rec["unit_id"],
        unit_name=latest_rec["unit_name"],
        risk_score=score,
        risk_band=band,
        trajectory=trajectory,
        historical_scores=history,
        top_elevating_factors=[FactorContribution(**e) for e in elevating[:3]],
        top_mitigating_factors=[FactorContribution(**m) for m in mitigating[:3]],
        actionable_recommendations=recommendations,
        last_checkin_date="Current Week" if latest_rec["has_voluntary_input"] else None,
        has_voluntary_checkin=bool(latest_rec["has_voluntary_input"])
    )

@router.post("/checkin", response_model=RiskAnalysisResponse)
def submit_voluntary_checkin(body: VoluntaryCheckinRequest):
    try:
        store.update_voluntary_checkin(
            person_id=body.person_id,
            sleep_quality=body.sleep_quality,
            stress_level=body.stress_level,
            mood_score=body.mood_score
        )
        return get_my_wellness_profile(person_id=body.person_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
