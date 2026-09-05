import React, { useState } from 'react';
import { X, Sparkles, AlertCircle, CheckCircle2, ShieldCheck, Tag, ArrowRight } from 'lucide-react';
import { submitTriageNote } from '../services/api';

export default function NotesTriageCard({ personId, onClose, onSuccess }) {
  const [noteText, setNoteText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [triageResult, setTriageResult] = useState(null);

  const handleTriage = async (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    
    setSubmitting(true);
    try {
      const res = await submitTriageNote({
        person_id: personId,
        officer_id: 'OFFICER_007',
        officer_name: 'Capt. Ananya Verma',
        free_text_note: noteText
      });
      setTriageResult(res);
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'Urgent': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Soon': return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-gray-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#FDF8F2] text-[#C28A4A] rounded-lg border border-[#E6D3B8]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base">Welfare Officer Notes Triage Assistant</h3>
              <p className="text-xs text-gray-500">Enter qualitative observations for automated category & priority triage ({personId})</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {!triageResult ? (
            <form onSubmit={handleTriage} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                  Free-Text Officer Observations
                </label>
                <textarea
                  rows="4"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="e.g. Individual appeared visibly fatigued during morning parade. Expressed anxiety regarding extended deployment and distance from family..."
                  className="w-full bg-[#FAF7F2] border border-gray-200 rounded-xl p-3 text-xs text-gray-900 focus:outline-none focus:border-[#C28A4A] resize-none placeholder:text-gray-400"
                  required
                />
              </div>

              <div className="text-[11px] text-gray-600 bg-[#FAF7F2] p-3 rounded-lg border border-gray-200 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  Transparent Keyword Assistant matches categories against work model risk factors to determine follow-up conversation priority. Priority reflects human interaction urgency, never clinical diagnosis.
                </span>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-xl border border-gray-200">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !noteText.trim()}
                  className="px-5 py-2 bg-[#C28A4A] hover:bg-[#B07A3B] text-white text-xs font-medium rounded-xl transition-all shadow-xs disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting ? 'Analyzing & Triaging...' : 'Analyze & Triage Note'}
                </button>
              </div>
            </form>
          ) : (
            /* Triage Result Display */
            <div className="space-y-5">
              <div className="bg-[#FAF7F2] p-4 rounded-xl border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-medium">Follow-up Priority</span>
                  <span className={`text-xs px-3 py-1 rounded-full font-bold border ${getPriorityBadge(triageResult.follow_up_priority)}`}>
                    {triageResult.follow_up_priority} Conversation Priority
                  </span>
                </div>

                <p className="text-xs text-gray-800 bg-white p-3 rounded-lg border border-gray-200">
                  {triageResult.priority_rationale}
                </p>
              </div>

              {/* Category Extraction & Signal Corroboration */}
              <div className="space-y-3">
                <div className="text-xs font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                  <Tag className="w-4 h-4 text-[#C28A4A]" /> Extracted Welfare Categories
                </div>

                <div className="flex flex-wrap gap-2">
                  {triageResult.extracted_categories.map((cat, idx) => (
                    <span key={idx} className="bg-[#FDF8F2] text-[#C28A4A] border border-[#E6D3B8] text-xs px-3 py-1 rounded-lg font-medium">
                      {cat}
                    </span>
                  ))}
                </div>

                <div className="bg-[#FAF7F2] p-3.5 rounded-xl border border-gray-200 text-xs space-y-1">
                  <div className="text-gray-500">Signal Cross-Reference Status:</div>
                  <div className="font-semibold text-emerald-700">{triageResult.corroboration_status}</div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={onClose}
                  className="px-5 py-2 bg-[#C28A4A] hover:bg-[#B07A3B] text-white text-xs font-medium rounded-xl transition-all shadow-xs"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
