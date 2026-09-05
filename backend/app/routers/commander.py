from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from app.services.workload import get_unit_aggregate_summary
from app.schemas.domain import CommanderUnitSummary
from app.ml.synthetic_data import UNITS

router = APIRouter(prefix="/api/commander", tags=["commander"])

@router.get("/unit-summary", response_model=CommanderUnitSummary)
def get_commander_unit_summary(unit_id: Optional[str] = Query("UNIT_ALPHA", description="Unit ID")):
    try:
        return get_unit_aggregate_summary(unit_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/units")
def list_operational_units():
    return UNITS
