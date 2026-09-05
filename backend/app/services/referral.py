import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Tuple
from app.services.store import store
from app.ml.explainability import analyze_explainability
from app.schemas.domain import DoctorInfo, DoctorBookingResponse

def get_recommended_doctors(person_id: str) -> Tuple[List[DoctorInfo], Optional[str]]:
    person_rec = store.get_latest_person_record(person_id)
    if not person_rec:
        raise ValueError(f"Personnel {person_id} not found.")
        
    elevating, _, _ = analyze_explainability(store.model, person_rec)
    top_factor_name = elevating[0]["feature_name"] if elevating else "duty_hours_weekly"
    
    # Sort doctors: matched doctor first
    doctors_list = []
    matched_doc_id = None
    
    for doc in store.doctors:
        doc_obj = DoctorInfo(**doc)
        if doc["matched_factor"] == top_factor_name:
            matched_doc_id = doc["id"]
            doctors_list.insert(0, doc_obj)
        else:
            doctors_list.append(doc_obj)
            
    return doctors_list, matched_doc_id

def book_doctor_referral(person_id: str, doctor_id: str, slot_time: str, officer_id: str, consent_acknowledged: bool) -> DoctorBookingResponse:
    if not consent_acknowledged:
        raise ValueError("Explicit voluntary consent acknowledgement is required before scheduling a consultation referral.")
        
    person_rec = store.get_latest_person_record(person_id)
    if not person_rec:
        raise ValueError(f"Personnel {person_id} not found.")
        
    target_doc = next((d for d in store.doctors if d["id"] == doctor_id), None)
    if not target_doc:
        raise ValueError(f"Doctor {doctor_id} not found.")
        
    booking_id = f"BKG_{uuid.uuid4().hex[:8].upper()}"
    consent_note = "VOLUNTARY CONSENT ACKNOWLEDGED: The individual has been informed that this referral is voluntary, non-disciplinary, and confidentiality is strictly maintained between individual and medical provider."
    
    booking_res = DoctorBookingResponse(
        booking_id=booking_id,
        person_id=person_id,
        doctor_name=target_doc["name"],
        specialization=target_doc["specialization"],
        slot_time=slot_time,
        consent_note=consent_note,
        status="Confirmed"
    )
    
    # Store in DataStore runtime memory
    store.referrals.insert(0, booking_res.model_dump())
    
    # Log audit entry
    store.add_audit_log(
        actor_id=officer_id,
        actor_name="Welfare Officer",
        actor_role="welfare_officer",
        action_type="DOCTOR_REFERRAL_BOOKED",
        target_person_id=person_id,
        details=f"Booked consultation with {target_doc['name']} ({target_doc['specialization']}) for {slot_time}. Consent acknowledged."
    )
    
    return booking_res
