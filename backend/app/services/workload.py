import pandas as pd
import numpy as np
from typing import Dict, Any, List
from app.services.store import store
from app.schemas.domain import CommanderUnitSummary

def get_unit_aggregate_summary(unit_id: str) -> CommanderUnitSummary:
    raw_df = store.raw_df
    unit_df = raw_df[(raw_df["unit_id"] == unit_id) & (raw_df["week_index"] == 5)]
    
    if unit_df.empty:
        # Fallback to all if unit_id = 'ALL' or not found
        unit_df = raw_df[raw_df["week_index"] == 5]
        unit_name = "All Operational Units"
    else:
        unit_name = unit_df["unit_name"].iloc[0]
        
    total_personnel = len(unit_df)
    
    # Calculate risk bands across personnel in unit using model
    band_counts = {"Low": 0, "Moderate": 0, "High": 0, "Critical": 0}
    
    for _, row in unit_df.iterrows():
        score, band = store.model.predict_risk(row.to_dict())
        band_counts[band] += 1
        
    band_pcts = {k: round((v / max(1, total_personnel)) * 100.0, 1) for k, v in band_counts.items()}
    
    avg_hours = round(float(unit_df["duty_hours_weekly"].mean()), 1)
    avg_nights = round(float(unit_df["night_shifts_monthly"].mean()), 1)
    
    # Workload imbalance calculation (Top 20% vs Bottom 20%)
    sorted_hours = unit_df["duty_hours_weekly"].sort_values(ascending=False)
    k = max(1, int(len(sorted_hours) * 0.2))
    
    top_avg = round(float(sorted_hours.iloc[:k].mean()), 1)
    bottom_avg = round(float(sorted_hours.iloc[-k:].mean()), 1)
    
    imbalance_delta = top_avg - bottom_avg
    imbalance_index = round(float(np.clip(imbalance_delta / 40.0, 0.0, 1.0)), 2)
    
    # Organizational recommendations
    org_recs = []
    if imbalance_delta > 20.0:
        org_recs.append(f"High workload disparity detected: Top 20% average {top_avg} hrs/wk vs bottom 20% average {bottom_avg} hrs/wk. Recommend reallocating shift duty rosters across sub-units.")
    if band_pcts["High"] + band_pcts["Critical"] > 25.0:
        org_recs.append(f"Unit cumulative high-risk band stands at {band_pcts['High'] + band_pcts['Critical']}%. Consider granting pending operational leave requests and reviewing continuous deployment duration.")
    if avg_nights > 7.0:
        org_recs.append(f"Monthly night shifts average {avg_nights} shifts/person. Evaluate night-shift rotation cycle.")
        
    if not org_recs:
        org_recs.append("Unit workload distribution is well-balanced within standard operational norms.")
        
    return CommanderUnitSummary(
        unit_id=unit_id,
        unit_name=unit_name,
        total_personnel=total_personnel,
        risk_band_counts=band_counts,
        risk_band_percentages=band_pcts,
        average_weekly_duty_hours=avg_hours,
        average_night_shifts=avg_nights,
        workload_imbalance_index=imbalance_index,
        highest_workload_group_avg_hours=top_avg,
        lowest_workload_group_avg_hours=bottom_avg,
        organizational_recommendations=org_recs
    )
