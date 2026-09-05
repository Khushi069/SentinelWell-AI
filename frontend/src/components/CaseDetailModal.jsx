import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';
import { X, Activity, AlertTriangle, UserCheck, Stethoscope, FileText, CheckCircle2, ShieldAlert } from 'lucide-react';
import { fetchCaseDetail } from '../services/api';

export default function CaseDetailModal({ personId, onClose, onOpenTriage, onOpenDoctor, onOpenOutcome }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (personId) loadDetail();
  }, [personId]);

  const loadDetail = async () => {
    setLoading(true);
    try {
      const data = await fetchCaseDetail(personId);
      setDetail(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!personId) return null;

  const getBandBadge = (band) => {
    switch (band) {
      case 'Critical': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'High': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Moderate': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      default: return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-gray-200 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FDF8F2] border border-[#E6D3B8] text-[#C28A4A] flex items-center justify-center font-bold">
              {detail ? detail.rank.slice(0, 2) : 'P'}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                {detail ? `${detail.rank} ${detail.name}` : 'Loading...'}
                <span className="text-xs text-gray-500 font-mono">({personId})</span>
              </h3>
              <p className="text-xs text-gray-500">{detail?.unit_name}</p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        {loading || !detail ? (
          <div className="p-12 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#C28A4A]"></div>
          </div>
        ) : (
          <div className="p-6 overflow-y-auto space-y-6">
            
            {/* Risk Snapshot Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-[#FAF7F2] p-4 rounded-xl border border-gray-200 text-xs">
              <div>
                <span className="text-gray-500 block">Risk Score</span>
                <span className="text-xl font-bold text-gray-900">{detail.risk_score} / 100</span>
              </div>
              <div>
                <span className="text-gray-500 block">Risk Band</span>
                <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full font-semibold border ${getBandBadge(detail.risk_band)}`}>
                  {detail.risk_band}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block">6-Wk Trajectory</span>
                <span className="text-gray-900 font-medium">{detail.trajectory}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Outcome Status</span>
                <span className="text-gray-900 font-medium">
                  {detail.consultation_outcome ? detail.consultation_outcome.outcome : 'Pending Consultation'}
                </span>
              </div>
            </div>

            {/* Trajectory & Explainability Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* 6-Week Trajectory */}
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
                <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#C28A4A]" /> Multi-Week Risk Trend
                </h4>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={detail.historical_scores} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="week" stroke="#6B7280" fontSize={11} />
                      <YAxis domain={[0, 100]} stroke="#6B7280" fontSize={11} />
                      <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', borderRadius: '0.5rem', color: '#1F2937' }} />
                      <Line type="monotone" dataKey="score" stroke="#C28A4A" strokeWidth={2.5} dot={{ fill: '#B07A3B' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Feature Contribution Breakdown */}
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
                <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-600" /> Linear Factor Contributions (Points)
                </h4>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[...detail.top_elevating_factors, ...detail.top_mitigating_factors]} layout="vertical" margin={{ top: 5, right: 10, left: 30, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis type="number" stroke="#6B7280" fontSize={11} />
                      <YAxis dataKey="feature_label" type="category" stroke="#6B7280" fontSize={10} width={100} />
                      <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', color: '#1F2937' }} />
                      <Bar dataKey="contribution_score" name="Contribution Score">
                        {[...detail.top_elevating_factors, ...detail.top_mitigating_factors].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.contribution_score > 0 ? '#C28A4A' : '#10B981'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Work Pattern Metrics Grid */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
              <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">Work Pattern & Voluntary Indicators</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-xs">
                <div className="bg-[#FAF7F2] p-2.5 rounded-lg border border-gray-200">
                  <span className="text-gray-500 block text-[10px]">Weekly Hours</span>
                  <span className="font-semibold text-gray-900">{detail.work_patterns.duty_hours_weekly} hrs/wk</span>
                </div>
                <div className="bg-[#FAF7F2] p-2.5 rounded-lg border border-gray-200">
                  <span className="text-gray-500 block text-[10px]">Night Shifts</span>
                  <span className="font-semibold text-gray-900">{detail.work_patterns.night_shifts_monthly} shifts/mo</span>
                </div>
                <div className="bg-[#FAF7F2] p-2.5 rounded-lg border border-gray-200">
                  <span className="text-gray-500 block text-[10px]">Leave Util.</span>
                  <span className="font-semibold text-gray-900">{detail.work_patterns.leave_utilization_pct}%</span>
                </div>
                <div className="bg-[#FAF7F2] p-2.5 rounded-lg border border-gray-200">
                  <span className="text-gray-500 block text-[10px]">Days Since Leave</span>
                  <span className="font-semibold text-gray-900">{detail.work_patterns.days_since_last_leave} days</span>
                </div>
                <div className="bg-[#FAF7F2] p-2.5 rounded-lg border border-gray-200">
                  <span className="text-gray-500 block text-[10px]">Deployment</span>
                  <span className="font-semibold text-gray-900">{detail.work_patterns.deployment_length_months} mos</span>
                </div>
                <div className="bg-[#FAF7F2] p-2.5 rounded-lg border border-gray-200">
                  <span className="text-gray-500 block text-[10px]">Sleep (Voluntary)</span>
                  <span className="font-semibold text-[#C28A4A]">
                    {detail.voluntary_wellness.has_voluntary_input ? `${detail.voluntary_wellness.sleep_quality}/10` : 'Imputed (6.0)'}
                  </span>
                </div>
              </div>
            </div>

            {/* Officer Actionable Recommendations */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
              <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">Actionable Officer Suggestions</h4>
              <ul className="space-y-2 text-xs">
                {detail.actionable_recommendations.map((rec, idx) => (
                  <li key={idx} className="bg-[#FAF7F2] p-2.5 rounded-lg border border-gray-200 text-gray-800 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#C28A4A] shrink-0 mt-0.5" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Notes & Referral History */}
            {detail.triage_notes.length > 0 && (
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
                <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#C28A4A]" /> Triaged Officer Observations History
                </h4>
                <div className="space-y-3">
                  {detail.triage_notes.map((n, idx) => (
                    <div key={idx} className="bg-[#FAF7F2] p-3 rounded-xl border border-gray-200 text-xs space-y-1.5">
                      <div className="flex justify-between items-center text-gray-500">
                        <span className="font-medium text-gray-800">Priority: <strong className="text-amber-700">{n.follow_up_priority}</strong></span>
                        <span>{n.corroboration_status}</span>
                      </div>
                      <p className="text-gray-900 italic">"{n.officer_note}"</p>
                      <div className="text-[11px] text-gray-500">{n.priority_rationale}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal Action Footer */}
        <div className="p-4 border-t border-gray-200 bg-white flex flex-wrap items-center justify-end gap-3">
          <button 
            onClick={() => onOpenTriage(personId)}
            className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-800 rounded-xl text-xs font-medium border border-gray-200 transition-colors flex items-center gap-2 shadow-xs"
          >
            <FileText className="w-4 h-4 text-[#C28A4A]" /> Triage Officer Note
          </button>
          
          <button 
            onClick={() => onOpenDoctor(personId)}
            className="px-4 py-2 bg-[#C28A4A] hover:bg-[#B07A3B] text-white rounded-xl text-xs font-medium transition-colors flex items-center gap-2 shadow-xs"
          >
            <Stethoscope className="w-4 h-4" /> Book Doctor Referral
          </button>

          <button 
            onClick={() => onOpenOutcome(personId)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-medium transition-colors flex items-center gap-2 shadow-xs"
          >
            <UserCheck className="w-4 h-4" /> Log Consultation Outcome
          </button>
        </div>
      </div>
    </div>
  );
}
