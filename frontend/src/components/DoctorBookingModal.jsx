import React, { useState, useEffect } from 'react';
import { X, Stethoscope, Calendar, Clock, CheckCircle2, ShieldAlert, UserCheck } from 'lucide-react';
import { fetchCaseDetail, bookDoctorReferral } from '../services/api';

export default function DoctorBookingModal({ personId, onClose, onSuccess }) {
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [consentAcknowledged, setConsentAcknowledged] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(null);

  useEffect(() => {
    if (personId) loadDoctors();
  }, [personId]);

  const loadDoctors = async () => {
    setLoading(true);
    try {
      const detail = await fetchCaseDetail(personId);
      setDoctors(detail.recommended_doctors || []);
      if (detail.matched_doctor_id) {
        setSelectedDoctorId(detail.matched_doctor_id);
        const doc = detail.recommended_doctors.find(d => d.id === detail.matched_doctor_id);
        if (doc && doc.available_slots.length > 0) setSelectedSlot(doc.available_slots[0]);
      } else if (detail.recommended_doctors.length > 0) {
        setSelectedDoctorId(detail.recommended_doctors[0].id);
        if (detail.recommended_doctors[0].available_slots.length > 0) {
          setSelectedSlot(detail.recommended_doctors[0].available_slots[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDoctorChange = (docId) => {
    setSelectedDoctorId(docId);
    const doc = doctors.find(d => d.id === docId);
    if (doc && doc.available_slots.length > 0) setSelectedSlot(doc.available_slots[0]);
  };

  const handleBook = async (e) => {
    e.preventDefault();
    if (!consentAcknowledged) return;

    setSubmitting(true);
    try {
      const res = await bookDoctorReferral({
        person_id: personId,
        doctor_id: selectedDoctorId,
        slot_time: selectedSlot,
        officer_id: 'OFFICER_007',
        consent_acknowledged: consentAcknowledged
      });
      setBookingSuccess(res);
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const currentDoc = doctors.find(d => d.id === selectedDoctorId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-gray-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#FDF8F2] text-[#C28A4A] rounded-lg border border-[#E6D3B8]">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base">Doctor & Counsellor Referral Booking</h3>
              <p className="text-xs text-gray-500">Match specialization to primary risk factor with voluntary consent ({personId})</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        {loading ? (
          <div className="p-10 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#C28A4A]"></div>
          </div>
        ) : bookingSuccess ? (
          <div className="p-6 space-y-4 text-center">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-gray-900">Doctor Referral Appointment Confirmed!</h4>
            <div className="bg-[#FAF7F2] p-4 rounded-xl text-xs text-gray-700 space-y-2 text-left border border-gray-200">
              <div><strong>Booking Ref:</strong> {bookingSuccess.booking_id}</div>
              <div><strong>Doctor:</strong> {bookingSuccess.doctor_name} ({bookingSuccess.specialization})</div>
              <div><strong>Scheduled Slot:</strong> {bookingSuccess.slot_time}</div>
              <div className="pt-2 border-t border-gray-200 text-[11px] text-emerald-700 italic">{bookingSuccess.consent_note}</div>
            </div>
            <button onClick={onClose} className="px-5 py-2 bg-[#C28A4A] hover:bg-[#B07A3B] text-white text-xs font-medium rounded-xl">
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleBook} className="p-6 space-y-5">
            {/* Select Doctor */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Select Medical Officer / Counsellor
              </label>
              <select
                value={selectedDoctorId}
                onChange={(e) => handleDoctorChange(e.target.value)}
                className="w-full bg-[#FAF7F2] border border-gray-200 rounded-xl p-3 text-xs text-gray-900 focus:outline-none focus:border-[#C28A4A]"
              >
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} — {d.specialization} ({d.hospital_unit})
                  </option>
                ))}
              </select>
            </div>

            {/* Doctor Info Card */}
            {currentDoc && (
              <div className="bg-[#FAF7F2] p-4 rounded-xl border border-gray-200 text-xs space-y-2">
                <div className="font-semibold text-gray-900">{currentDoc.name}</div>
                <div className="text-[#C28A4A] font-medium">{currentDoc.specialization}</div>
                <div className="text-gray-500 text-[11px]">{currentDoc.hospital_unit}</div>
              </div>
            )}

            {/* Available Slot Selector */}
            {currentDoc && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#C28A4A]" /> Select Appointment Time Slot
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {currentDoc.available_slots.map((slot, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      className={`p-2.5 rounded-xl border text-xs font-medium transition-all ${
                        selectedSlot === slot 
                          ? 'bg-[#C28A4A] text-white border-[#B07A3B] shadow-xs' 
                          : 'bg-[#FAF7F2] text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Voluntary Consent Checkbox */}
            <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl flex items-start gap-3">
              <input
                type="checkbox"
                id="consentCheck"
                checked={consentAcknowledged}
                onChange={(e) => setConsentAcknowledged(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-gray-300 text-[#C28A4A] focus:ring-[#C28A4A] bg-white"
              />
              <label htmlFor="consentCheck" className="text-xs text-amber-900 cursor-pointer">
                <strong>Explicit Voluntary Consent Note:</strong> The individual has been informed that this referral is voluntary, non-disciplinary, and they may decline or choose a different medical provider without consequence.
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-xl border border-gray-200">
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !consentAcknowledged || !selectedSlot}
                className="px-5 py-2 bg-[#C28A4A] hover:bg-[#B07A3B] text-white text-xs font-medium rounded-xl transition-all shadow-xs disabled:opacity-50"
              >
                {submitting ? 'Confirming Referral...' : 'Confirm Appointment Booking'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
