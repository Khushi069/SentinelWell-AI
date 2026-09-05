import uuid
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional
import pandas as pd
from app.ml.synthetic_data import generate_synthetic_dataset
from app.ml.model import InterpretableRiskModel
from app.ml.explainability import analyze_explainability

class DataStore:
    def __init__(self):
        self.raw_df: Optional[pd.DataFrame] = None
        self.model: InterpretableRiskModel = InterpretableRiskModel()
        
        # In-memory runtime tables
        self.notes: List[Dict[str, Any]] = []
        self.referrals: List[Dict[str, Any]] = []
        self.outcomes: List[Dict[str, Any]] = []
        self.audit_logs: List[Dict[str, Any]] = []
        
        # Predefined doctors with specializations
        self.doctors = [
            {
                "id": "DOC_101",
                "name": "Dr. Aarav Sharma",
                "specialization": "Fatigue & Shift Management Specialist",
                "matched_factor": "night_shifts_monthly",
                "hospital_unit": "Base Hospital Medical Wing",
                "available_slots": ["Tomorrow 10:00 AM", "Tomorrow 02:30 PM", "Friday 11:00 AM"]
            },
            {
                "id": "DOC_102",
                "name": "Dr. Sunita Deshmukh",
                "specialization": "Sleep Hygiene & Circadian Specialist",
                "matched_factor": "sleep_quality_imputed",
                "hospital_unit": "Wellness & Sleep Clinic",
                "available_slots": ["Tomorrow 11:30 AM", "Thursday 04:00 PM", "Friday 09:30 AM"]
            },
            {
                "id": "DOC_103",
                "name": "Dr. Rajesh K. Varma",
                "specialization": "Stress & Burnout Counsellor",
                "matched_factor": "stress_level_imputed",
                "hospital_unit": "Personnel Welfare Support Cell",
                "available_slots": ["Today 04:30 PM", "Tomorrow 09:00 AM", "Thursday 02:00 PM"]
            },
            {
                "id": "DOC_104",
                "name": "Dr. Meera Menon",
                "specialization": "General Operational Health Officer",
                "matched_factor": "duty_hours_weekly",
                "hospital_unit": "HQ Operational Health Wing",
                "available_slots": ["Tomorrow 03:00 PM", "Friday 01:30 PM"]
            }
        ]
        
    def initialize(self, seed: int = 42):
        """Generates synthetic dataset and fits the risk model."""
        self.raw_df = generate_synthetic_dataset(num_persons=60, num_weeks=6, seed=seed)
        self.model.fit(self.raw_df)
        
        # Log initialization audit entry
        self.add_audit_log(
            actor_id="SYSTEM",
            actor_name="System Initialization",
            actor_role="system",
            action_type="SYSTEM_BOOT",
            details="Generated synthetic dataset for 60 personnel across 4 units (6 weeks history) and trained interpretable Logistic Regression risk model."
        )

    def get_latest_person_record(self, person_id: str) -> Optional[Dict[str, Any]]:
        person_df = self.raw_df[self.raw_df["person_id"] == person_id]
        if person_df.empty:
            return None
        # Return week 6 (latest)
        latest_row = person_df.sort_values("week_index", ascending=False).iloc[0]
        return latest_row.to_dict()

    def get_historical_records(self, person_id: str) -> List[Dict[str, Any]]:
        person_df = self.raw_df[self.raw_df["person_id"] == person_id].sort_values("week_index", ascending=True)
        return person_df.to_dict(orient="records")

    def update_voluntary_checkin(self, person_id: str, sleep_quality: float, stress_level: float, mood_score: float) -> Dict[str, Any]:
        mask = (self.raw_df["person_id"] == person_id) & (self.raw_df["week_index"] == 5)
        if not mask.any():
            raise ValueError(f"Personnel {person_id} not found.")
            
        self.raw_df.loc[mask, "sleep_quality"] = sleep_quality
        self.raw_df.loc[mask, "stress_level"] = stress_level
        self.raw_df.loc[mask, "mood_score"] = mood_score
        self.raw_df.loc[mask, "has_voluntary_input"] = True
        
        person_rec = self.get_latest_person_record(person_id)
        
        self.add_audit_log(
            actor_id=person_id,
            actor_name=person_rec["name"],
            actor_role="personnel",
            action_type="VOLUNTARY_CHECKIN_SUBMITTED",
            target_person_id=person_id,
            details=f"Submitted voluntary weekly check-in: Sleep={sleep_quality}/10, Stress={stress_level}/10, Mood={mood_score}/10."
        )
        
        return person_rec

    def add_audit_log(self, actor_id: str, actor_name: str, actor_role: str, action_type: str, details: str, target_person_id: Optional[str] = None):
        entry = {
            "id": f"AUD_{uuid.uuid4().hex[:8].upper()}",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "actor_id": actor_id,
            "actor_name": actor_name,
            "actor_role": actor_role,
            "action_type": action_type,
            "target_person_id": target_person_id,
            "target_person_masked": f"PERS_{target_person_id.split('_')[-1]}" if target_person_id else None,
            "details": details
        }
        self.audit_logs.insert(0, entry)

store = DataStore()
