from fastapi import APIRouter
from typing import List
from app.services.store import store
from app.schemas.domain import AuditLogEntry

router = APIRouter(prefix="/api/audit", tags=["audit"])

@router.get("/logs", response_model=List[AuditLogEntry])
def get_audit_logs():
    return [AuditLogEntry(**log) for log in store.audit_logs]
