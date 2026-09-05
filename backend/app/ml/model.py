import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from typing import Tuple, Dict, Any, List

FEATURE_COLUMNS = [
    "duty_hours_weekly",
    "night_shifts_monthly",
    "leave_utilization_pct",
    "deployment_length_months",
    "days_since_last_leave",
    "workload_intensity_index",
    "sleep_quality_imputed",
    "stress_level_imputed",
    "mood_score_imputed",
    "is_voluntary_missing"
]

FEATURE_LABELS = {
    "duty_hours_weekly": "Weekly Duty Hours",
    "night_shifts_monthly": "Monthly Night Shifts",
    "leave_utilization_pct": "Leave Utilization (%)",
    "deployment_length_months": "Continuous Deployment (Months)",
    "days_since_last_leave": "Days Since Last Leave",
    "workload_intensity_index": "Workload Intensity Index",
    "sleep_quality_imputed": "Voluntary Sleep Quality (1-10)",
    "stress_level_imputed": "Voluntary Stress Level (1-10)",
    "mood_score_imputed": "Voluntary Mood Score (1-10)",
    "is_voluntary_missing": "Missing Voluntary Check-in"
}

class InterpretableRiskModel:
    def __init__(self):
        self.scaler = StandardScaler()
        self.model = LogisticRegression(penalty='l2', C=1.0, max_iter=1000, random_state=42)
        self.medians = {}
        self.is_fitted = False

    def preprocess_df(self, df: pd.DataFrame, fit_medians: bool = False) -> pd.DataFrame:
        df_clean = df.copy()
        
        # Calculate or use stored medians for missing voluntary inputs
        for col in ["sleep_quality", "stress_level", "mood_score"]:
            if fit_medians or col not in self.medians:
                # Default defaults if entire dataset is missing
                default_val = 6.0 if col != "stress_level" else 5.0
                self.medians[col] = float(df_clean[col].median()) if not df_clean[col].isna().all() else default_val
            
            imp_col = f"{col}_imputed"
            df_clean[imp_col] = df_clean[col].fillna(self.medians[col])
            
        # Indicator flag for missingness
        df_clean["is_voluntary_missing"] = df_clean["sleep_quality"].isna().astype(float)
        return df_clean

    def fit(self, df: pd.DataFrame):
        df_clean = self.preprocess_df(df, fit_medians=True)
        X = df_clean[FEATURE_COLUMNS]
        y = df_clean["ground_truth_label"]
        
        X_scaled = self.scaler.fit_transform(X)
        self.model.fit(X_scaled, y)
        self.is_fitted = True

    def predict_risk(self, person_record: Dict[str, Any]) -> Tuple[float, str]:
        if not self.is_fitted:
            raise ValueError("Model must be fitted before calling predict_risk.")
            
        df = pd.DataFrame([person_record])
        df_clean = self.preprocess_df(df, fit_medians=False)
        X = df_clean[FEATURE_COLUMNS]
        X_scaled = self.scaler.transform(X)
        
        prob = float(self.model.predict_proba(X_scaled)[0, 1])
        score = round(prob * 100.0, 1)
        band = self.score_to_band(score)
        return score, band

    @staticmethod
    def score_to_band(score: float) -> str:
        if score < 30.0:
            return "Low"
        elif score < 60.0:
            return "Moderate"
        elif score < 80.0:
            return "High"
        else:
            return "Critical"
