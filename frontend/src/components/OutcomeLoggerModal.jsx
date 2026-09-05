import React, { useState } from 'react';
import { X, UserCheck, CheckCircle2 } from 'lucide-react';
import { logConsultationOutcome } from '../services/api';

export default function OutcomeLoggerModal({ personId, onClose, onSuccess }) {
  const [outcome, setOutcome] = useState('Resolved');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await logConsultationOutcome({
        person_id: personId,
        officer_id: 'OFFICER_007',
        outcome,
        outcome_notes: notes
      });
      setSuccess(true);
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-gray-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base">Log Consultation Outcome</h3>
              <p className="text-xs text-gray-500">Capture feedback for future model recalibration ({personId})</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        {success ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-gray-900">Consultation Outcome Logged!</h4>
            <p className="text-xs text-gray-600">
              Outcome recorded as <strong className="text-emerald-700">{outcome}</strong>. Captured in audit trail and model feedback store.
            </p>
            <button onClick={onClose} className="px-5 py-2 bg-[#C28A4A] hover:bg-[#B07A3B] text-white text-xs font-medium rounded-xl">
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Consultation Outcome Category
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'Resolved', label: 'Resolved', color: 'border-emerald-200 bg-emerald-50 text-emerald-700 font-bold' },
                  { id: 'Needs Follow-up', label: 'Needs Follow-up', color: 'border-amber-200 bg-amber-50 text-amber-700 font-bold' },
                  { id: 'False Alarm', label: 'False Alarm', color: 'border-gray-200 bg-gray-100 text-gray-700 font-bold' }
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setOutcome(opt.id)}
                    className={`p-2.5 rounded-xl border text-xs font-medium transition-all ${
                      outcome === opt.id 
                        ? `${opt.color} shadow-xs` 
                        : 'bg-[#FAF7F2] text-gray-600 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Consultation Notes / Feedback
              </label>
              <textarea
                rows="3"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Details of conversation, agreed follow-up steps, or reason for false alarm tagging..."
                className="w-full bg-[#FAF7F2] border border-gray-200 rounded-xl p-3 text-xs text-gray-900 focus:outline-none focus:border-emerald-600 resize-none placeholder:text-gray-400"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-700 text-xs font-medium rounded-xl border border-gray-200">
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-xl transition-all shadow-xs disabled:opacity-50"
              >
                {submitting ? 'Saving Outcome...' : 'Save Outcome Log'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
