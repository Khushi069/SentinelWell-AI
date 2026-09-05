const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export async function fetchPersonnelProfile(personId = 'PERS_1001') {
  const res = await fetch(`${BASE_URL}/personnel/me?person_id=${personId}`);
  if (!res.ok) throw new Error('Failed to fetch personnel profile');
  return res.json();
}

export async function submitCheckin(data) {
  const res = await fetch(`${BASE_URL}/personnel/checkin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to submit voluntary check-in');
  return res.json();
}

export async function fetchWelfareCases({ unitId = 'ALL', riskBand = 'ALL', trajectory = 'ALL', search = '' } = {}) {
  const params = new URLSearchParams();
  if (unitId && unitId !== 'ALL') params.append('unit_id', unitId);
  if (riskBand && riskBand !== 'ALL') params.append('risk_band', riskBand);
  if (trajectory && trajectory !== 'ALL') params.append('trajectory', trajectory);
  if (search) params.append('search', search);

  const res = await fetch(`${BASE_URL}/welfare/cases?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch welfare cases');
  return res.json();
}

export async function fetchCaseDetail(personId) {
  const res = await fetch(`${BASE_URL}/welfare/cases/${personId}`);
  if (!res.ok) throw new Error(`Failed to fetch details for case ${personId}`);
  return res.json();
}

export async function submitTriageNote(data) {
  const res = await fetch(`${BASE_URL}/welfare/triage-note`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to triage note');
  return res.json();
}

export async function bookDoctorReferral(data) {
  const res = await fetch(`${BASE_URL}/welfare/referrals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to book doctor referral');
  return res.json();
}

export async function logConsultationOutcome(data) {
  const res = await fetch(`${BASE_URL}/welfare/outcomes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to log consultation outcome');
  return res.json();
}

export async function fetchCommanderSummary(unitId = 'UNIT_ALPHA') {
  const res = await fetch(`${BASE_URL}/commander/unit-summary?unit_id=${unitId}`);
  if (!res.ok) throw new Error('Failed to fetch commander aggregate summary');
  return res.json();
}

export async function fetchAuditLogs() {
  const res = await fetch(`${BASE_URL}/audit/logs`);
  if (!res.ok) throw new Error('Failed to fetch audit logs');
  return res.json();
}
