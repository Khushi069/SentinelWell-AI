import numpy as np
import pandas as pd
from typing import List, Dict, Any

UNITS = [
    {"id": "UNIT_ALPHA", "name": "1st Battalion (Alpha)"},
    {"id": "UNIT_BRAVO", "name": "2nd Mobile Support (Bravo)"},
    {"id": "UNIT_CHARLIE", "name": "3rd Rapid Response (Charlie)"},
    {"id": "UNIT_DELTA", "name": "4th Garrison HQ (Delta)"}
]

RANKS = ["Constable", "Head Constable", "Sub-Inspector", "Inspector", "Naik", "Havildar", "Subedar"]

NAMES = [
    "Rajesh Sharma", "Amit Singh", "Priya Verma", "Vikram Rathore", "Suresh Kumar",
    "Ankit Yadav", "Deepak Patel", "Sunita Devi", "Ramesh Chand", "Manoj Tiwari",
    "Kavita Reddy", "Pankaj Sharma", "Gaurav Joshi", "Arjun Nair", "Sanjay Dutt",
    "Pooja Rani", "Vijay Kumar", "Dinesh Rawat", "Neha Gupta", "Rohit Choudhary",
    "Karan Johar", "Rahul Dravid", "Sachin Tendulkar", "Virender Sehwag", "Harbhajan Singh",
    "Ashok Gehlot", "Devendra Fadnavis", "Birender Singh", "Gurpreet Singh", "Simran Kaur",
    "Tenzing Norgay", "Aakash Chopra", "Abhinav Bindra", "Mary Kom", "Milka Singh",
    "Pradeep Kumar", "Sunil Chhetri", "Bhaichung Bhutia", "Subhash Chandra", "Sardar Patel"
]

def generate_synthetic_dataset(num_persons: int = 60, num_weeks: int = 6, seed: int = 42) -> pd.DataFrame:
    """
    Generates multi-week synthetic dataset for personnel work patterns and voluntary wellness inputs.
    Includes ground-truth probability calculation for training the interpretable Logistic Regression model.
    """
    np.random.seed(seed)
    records = []
    
    for i in range(num_persons):
        person_id = f"PERS_{1001 + i}"
        name = NAMES[i % len(NAMES)] if i < len(NAMES) else f"Personnel {1001 + i}"
        rank = np.random.choice(RANKS)
        unit = UNITS[i % len(UNITS)]
        
        # Base baseline stress profile for this person
        base_workload = np.random.uniform(45, 78)
        base_night_shifts = np.random.randint(1, 12)
        base_leave_util = np.random.uniform(10, 85)
        base_days_since_leave = np.random.randint(15, 240)
        base_deployment_len = np.random.randint(1, 18)
        
        # Simulate trajectory type: 25% rising, 60% stable, 15% decreasing
        traj_type = np.random.choice(["rising", "stable", "decreasing"], p=[0.25, 0.60, 0.15])
        
        for w in range(num_weeks):
            week_label = f"Wk {w + 1}"
            
            # Apply trajectory progression over weeks
            if traj_type == "rising":
                duty_hours = base_workload + (w * np.random.uniform(2.5, 4.5))
                night_shifts = min(15, int(base_night_shifts + (w * 0.8)))
                days_since_leave = base_days_since_leave + (w * 7)
                sleep_quality = max(2.0, 7.5 - (w * 0.7) + np.random.uniform(-0.4, 0.4))
                stress_level = min(9.5, 4.0 + (w * 0.9) + np.random.uniform(-0.3, 0.3))
                mood_score = max(2.0, 7.0 - (w * 0.8) + np.random.uniform(-0.3, 0.3))
            elif traj_type == "decreasing":
                duty_hours = max(42.0, base_workload - (w * np.random.uniform(2.0, 3.5)))
                night_shifts = max(1, int(base_night_shifts - (w * 0.6)))
                days_since_leave = max(10, base_days_since_leave - (w * 5))
                sleep_quality = min(9.0, 4.5 + (w * 0.6) + np.random.uniform(-0.3, 0.3))
                stress_level = max(2.5, 7.5 - (w * 0.8) + np.random.uniform(-0.3, 0.3))
                mood_score = min(9.0, 5.0 + (w * 0.7) + np.random.uniform(-0.3, 0.3))
            else:
                duty_hours = base_workload + np.random.uniform(-3, 3)
                night_shifts = max(0, min(14, base_night_shifts + np.random.randint(-1, 2)))
                days_since_leave = base_days_since_leave + (w * 7)
                sleep_quality = np.random.uniform(4.5, 7.5)
                stress_level = np.random.uniform(4.0, 7.0)
                mood_score = np.random.uniform(4.5, 7.5)
                
            duty_hours = round(float(np.clip(duty_hours, 38.0, 88.0)), 1)
            leave_utilization = round(float(np.clip(base_leave_util, 5.0, 95.0)), 1)
            deployment_len = int(np.clip(base_deployment_len + int(w * 0.25), 1, 24))
            workload_intensity = round(float(np.clip((duty_hours / 10.0) + (night_shifts * 0.3), 1.0, 10.0)), 1)
            
            # Simulate voluntary data submission rate (~80% submit, 20% missing)
            has_voluntary = np.random.rand() > 0.18
            if has_voluntary:
                sq = round(float(np.clip(sleep_quality, 1.0, 10.0)), 1)
                st = round(float(np.clip(stress_level, 1.0, 10.0)), 1)
                md = round(float(np.clip(mood_score, 1.0, 10.0)), 1)
            else:
                sq, st, md = np.nan, np.nan, np.nan
                
            # Ground truth risk probability formula (for synthetic training target)
            # Standardized domain scoring formula
            z_duty = (duty_hours - 55.0) / 10.0
            z_night = (night_shifts - 5.0) / 3.0
            z_leave_util = (50.0 - leave_utilization) / 20.0
            z_days_leave = (days_since_leave - 90.0) / 40.0
            z_deploy = (deployment_len - 6.0) / 4.0
            z_workload = (workload_intensity - 5.0) / 2.0
            
            # Voluntary components (use population norm if missing so missingness doesn't elevate risk)
            v_sleep = (6.0 - (sq if has_voluntary else 6.0)) / 2.0
            v_stress = ((st if has_voluntary else 5.0) - 5.0) / 2.0
            v_mood = (6.0 - (md if has_voluntary else 6.0)) / 2.0
            
            logit = (0.75 * z_duty + 0.65 * z_night + 0.55 * z_leave_util + 
                     0.70 * z_days_leave + 0.45 * z_deploy + 0.50 * z_workload + 
                     0.60 * v_sleep + 0.65 * v_stress + 0.50 * v_mood - 0.4)
            
            prob = 1.0 / (1.0 + np.exp(-logit))
            label = 1 if prob >= 0.5 else 0
            
            records.append({
                "person_id": person_id,
                "name": name,
                "rank": rank,
                "unit_id": unit["id"],
                "unit_name": unit["name"],
                "week": week_label,
                "week_index": w,
                "duty_hours_weekly": duty_hours,
                "night_shifts_monthly": night_shifts,
                "leave_utilization_pct": leave_utilization,
                "deployment_length_months": deployment_len,
                "days_since_last_leave": int(days_since_leave),
                "workload_intensity_index": workload_intensity,
                "sleep_quality": sq,
                "stress_level": st,
                "mood_score": md,
                "has_voluntary_input": has_voluntary,
                "ground_truth_prob": prob,
                "ground_truth_label": label
            })
            
    return pd.DataFrame(records)
