from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime

class WorkPatternData(BaseModel):
    duty_hours_weekly: float = Field(..., description="Average weekly duty hours")
    night_shifts_monthly: int = Field(..., description="Night shifts performed in last 30 days")
    leave_utilization_pct: float = Field(..., description="Percentage of entitled leave utilized")
    deployment_length_months: int = Field(..., description="Continuous months in current deployment")
    days_since_last_leave: int = Field(..., description="Days elapsed since last taken leave")
    workload_intensity_index: float = Field(..., description="Scale 1-10 of duty intensity")

class VoluntaryWellnessInput(BaseModel):
    sleep_quality: Optional[float] = Field(None, description="Voluntary sleep quality 1-10")
    stress_level: Optional[float] = Field(None, description="Voluntary stress level 1-10")
    mood_score: Optional[float] = Field(None, description="Voluntary mood score 1-10")

class FactorContribution(BaseModel):
    feature_name: str
    feature_label: str
    contribution_score: float  # + or - impact on risk score
    value_display: str
    impact_type: str  # "elevating" or "mitigating"

class RiskAnalysisResponse(BaseModel):
    person_id: str
    person_name: str
    rank: str
    unit_id: str
    unit_name: str
    risk_score: float  # 0 - 100
    risk_band: str  # "Low", "Moderate", "High", "Critical"
    trajectory: str  # "Rising", "Stable", "Decreasing"
    historical_scores: List[Dict[str, Any]]  # [{"week": "Wk 1", "score": 45}, ...]
    top_elevating_factors: List[FactorContribution]
    top_mitigating_factors: List[FactorContribution]
    actionable_recommendations: List[str]
    last_checkin_date: Optional[str] = None
    has_voluntary_checkin: bool = False

class VoluntaryCheckinRequest(BaseModel):
    person_id: str
    sleep_quality: float = Field(..., ge=1, le=10)
    stress_level: float = Field(..., ge=1, le=10)
    mood_score: float = Field(..., ge=1, le=10)

class NoteTriageRequest(BaseModel):
    person_id: str
    officer_id: str
    officer_name: str
    free_text_note: str

class NoteTriageResponse(BaseModel):
    note_id: str
    person_id: str
    created_at: str
    extracted_categories: List[str]
    corroboration_status: str  # "Corroborated Signal", "New Unrecorded Signal", "Baseline Observation"
    corroborated_factors: List[str]
    new_surfaced_factors: List[str]
    follow_up_priority: str  # "Routine", "Soon", "Urgent"
    priority_rationale: str
    officer_note: str

class DoctorInfo(BaseModel):
    id: str
    name: str
    specialization: str
    matched_factor: str
    hospital_unit: str
    available_slots: List[str]

class DoctorBookingRequest(BaseModel):
    person_id: str
    doctor_id: str
    slot_time: str
    officer_id: str
    consent_acknowledged: bool

class DoctorBookingResponse(BaseModel):
    booking_id: str
    person_id: str
    doctor_name: str
    specialization: str
    slot_time: str
    consent_note: str
    status: str

class OutcomeLogRequest(BaseModel):
    person_id: str
    officer_id: str
    outcome: str  # "Resolved", "Needs Follow-up", "False Alarm"
    outcome_notes: str

class CommanderUnitSummary(BaseModel):
    unit_id: str
    unit_name: str
    total_personnel: int
    risk_band_counts: Dict[str, int]
    risk_band_percentages: Dict[str, float]
    average_weekly_duty_hours: float
    average_night_shifts: float
    workload_imbalance_index: float  # 0 to 1 scale
    highest_workload_group_avg_hours: float
    lowest_workload_group_avg_hours: float
    organizational_recommendations: List[str]
    privacy_notice: str = "SERVER-SIDE ENFORCED: Aggregate metrics only. No individual identifiers or scores transmitted."

class AuditLogEntry(BaseModel):
    id: str
    timestamp: str
    actor_id: str
    actor_name: str
    actor_role: str
    action_type: str
    target_person_id: Optional[str] = None
    target_person_masked: Optional[str] = None
    details: str
