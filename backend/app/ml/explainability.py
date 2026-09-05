import numpy as np
import pandas as pd
from typing import Dict, Any, List, Tuple
from app.ml.model import FEATURE_COLUMNS, FEATURE_LABELS, InterpretableRiskModel

RECOMMENDATION_RULES = {
    "duty_hours_weekly": "Review duty schedule to reduce weekly hours and ensure mandatory 24-48h rest intervals.",
    "night_shifts_monthly": "Rotate off night-shift duty roster; limit consecutive night shifts to max 3.",
    "leave_utilization_pct": "Encourage and approve pending leave applications to address leave deficit.",
    "days_since_last_leave": "Prioritize operational leave grant; individual has exceeded 120+ days without leave.",
    "deployment_length_months": "Assess rotation schedule for extended deployment duration.",
    "workload_intensity_index": "Rebalance tactical workload and share duty allocation across unit peers.",
    "sleep_quality_imputed": "Offer guidance on sleep hygiene and ensure quiet rest environment during non-duty hours.",
    "stress_level_imputed": "Arrange an informal, non-clinical supportive check-in with the Welfare Officer.",
    "mood_score_imputed": "Provide peer support access and review recent duty assignment pressure."
}

def analyze_explainability(model: InterpretableRiskModel, person_record: Dict[str, Any]) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], List[str]]:
    """
    Computes exact linear feature contributions: contribution_j = coef_j * (x_j - mean_j) / std_j
    Ranks top elevating risk factors and top mitigating factors.
    Returns non-clinical actionable recommendations.
    """
    df = pd.DataFrame([person_record])
    df_clean = model.preprocess_df(df, fit_medians=False)
    X = df_clean[FEATURE_COLUMNS]
    X_scaled = model.scaler.transform(X)[0]
    coefs = model.model.coef_[0]
    
    contributions = []
    
    for idx, feature in enumerate(FEATURE_COLUMNS):
        if feature == "is_voluntary_missing":
            continue  # Don't show missingness flag as an elevating factor to user/officer
            
        feat_val = df_clean[feature].iloc[0]
        coef = coefs[idx]
        scaled_val = X_scaled[idx]
        contrib = float(coef * scaled_val * 15.0)  # Scale to human-perceptible points (~0-30 scale)
        
        # Display formatting
        if "duty_hours" in feature:
            display = f"{feat_val:.1f} hrs/wk"
        elif "night_shifts" in feature:
            display = f"{int(feat_val)} shifts"
        elif "leave_utilization" in feature:
            display = f"{feat_val:.1f}%"
        elif "days_since" in feature:
            display = f"{int(feat_val)} days"
        elif "deployment" in feature:
            display = f"{int(feat_val)} months"
        elif "quality" in feature or "level" in feature or "score" in feature:
            display = f"{feat_val:.1f}/10"
        else:
            display = f"{feat_val:.1f}"
            
        contributions.append({
            "feature_name": feature,
            "feature_label": FEATURE_LABELS.get(feature, feature),
            "contribution_score": round(contrib, 1),
            "value_display": display,
            "impact_type": "elevating" if contrib >= 0 else "mitigating"
        })
        
    # Sort elevating factors descending, mitigating factors ascending
    elevating = sorted([c for c in contributions if c["contribution_score"] > 0.5], key=lambda x: x["contribution_score"], reverse=True)
    mitigating = sorted([c for c in contributions if c["contribution_score"] < -0.5], key=lambda x: x["contribution_score"])
    
    # Generate recommendations based on top elevating factors
    recommendations = []
    for factor in elevating[:3]:
        feat_name = factor["feature_name"]
        if feat_name in RECOMMENDATION_RULES:
            recommendations.append(RECOMMENDATION_RULES[feat_name])
            
    if not recommendations:
        recommendations.append("Maintain current balanced duty schedule and routine wellness check-ins.")
        
    return elevating, mitigating, recommendations
