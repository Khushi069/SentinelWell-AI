import React, { useState, useEffect } from 'react';
import { Search, Filter, AlertTriangle, Eye, FileText, Stethoscope, UserCheck, TrendingUp, TrendingDown, Minus, RefreshCw } from 'lucide-react';
import { fetchWelfareCases } from '../services/api';
import PrivacyBanner from './PrivacyBanner';
import CaseDetailModal from './CaseDetailModal';
import NotesTriageCard from './NotesTriageCard';
import DoctorBookingModal from './DoctorBookingModal';
import OutcomeLoggerModal from './OutcomeLoggerModal';

export default function WelfareOfficerView() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [unitFilter, setUnitFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [trajFilter, setTrajFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // Active Modals
  const [detailPersonId, setDetailPersonId] = useState(null);
  const [triagePersonId, setTriagePersonId] = useState(null);
  const [doctorPersonId, setDoctorPersonId] = useState(null);
  const [outcomePersonId, setOutcomePersonId] = useState(null);

  useEffect(() => {
    loadCases();
  }, [unitFilter, riskFilter, trajFilter, search]);

  const loadCases = async () => {
    setLoading(true);
    try {
      const data = await fetchWelfareCases({
        unitId: unitFilter,
        riskBand: riskFilter,
        trajectory: trajFilter,
        search
      });
      setCases(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getBandBadge = (band) => {
    switch (band) {
      case 'Critical': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'High': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Moderate': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      default: return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
  };

  const getTrajBadge = (traj) => {
    if (traj === 'Rising') return <span className="flex items-center gap-1 text-rose-600 font-medium"><TrendingUp className="w-3.5 h-3.5" /> Rising</span>;
    if (traj === 'Decreasing') return <span className="flex items-center gap-1 text-emerald-600 font-medium"><TrendingDown className="w-3.5 h-3.5" /> Decreasing</span>;
    return <span className="flex items-center gap-1 text-gray-500 font-medium"><Minus className="w-3.5 h-3.5" /> Stable</span>;
  };

  return (
    <div className="space-y-6">
      <PrivacyBanner role="welfare" />

      {/* Filter & Search Bar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-xs">
        
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search personnel by name, rank, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#FAF7F2] border border-gray-200 rounded-xl pl-10 pr-4 py-2 text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-[#C28A4A]"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Unit Filter */}
          <select
            value={unitFilter}
            onChange={(e) => setUnitFilter(e.target.value)}
            className="bg-[#FAF7F2] border border-gray-200 text-gray-700 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-[#C28A4A]"
          >
            <option value="ALL">All Operational Units</option>
            <option value="UNIT_ALPHA">1st Battalion (Alpha)</option>
            <option value="UNIT_BRAVO">2nd Support (Bravo)</option>
            <option value="UNIT_CHARLIE">3rd Rapid (Charlie)</option>
            <option value="UNIT_DELTA">4th Garrison (Delta)</option>
          </select>

          {/* Risk Band Filter */}
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="bg-[#FAF7F2] border border-gray-200 text-gray-700 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-[#C28A4A]"
          >
            <option value="ALL">All Risk Bands</option>
            <option value="Critical">Critical Band (80-100)</option>
            <option value="High">High Band (60-79)</option>
            <option value="Moderate">Moderate Band (30-59)</option>
            <option value="Low">Low Band (0-29)</option>
          </select>

          {/* Trajectory Filter */}
          <select
            value={trajFilter}
            onChange={(e) => setTrajFilter(e.target.value)}
            className="bg-[#FAF7F2] border border-gray-200 text-gray-700 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-[#C28A4A]"
          >
            <option value="ALL">All Trajectories</option>
            <option value="Rising">Rising Trajectory</option>
            <option value="Stable">Stable Trajectory</option>
            <option value="Decreasing">Decreasing Trajectory</option>
          </select>

          <button onClick={loadCases} className="p-2 text-gray-500 hover:text-gray-800 bg-[#FAF7F2] border border-gray-200 rounded-xl">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Risk-Sorted Caseload Table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-gray-900">Prioritized Welfare Caseload</h4>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 font-medium border border-gray-200">
              {cases.length} Personnel Listed
            </span>
          </div>
          <span className="text-xs text-gray-500">Sorted by Welfare Risk Score (Highest First)</span>
        </div>

        {loading ? (
          <div className="p-12 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#C28A4A]"></div>
          </div>
        ) : cases.length === 0 ? (
          <div className="p-12 text-center text-gray-500 text-xs">
            No personnel match the selected filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FAF7F2] text-[11px] font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                  <th className="py-3 px-4">Personnel</th>
                  <th className="py-3 px-4">Unit</th>
                  <th className="py-3 px-4">Risk Score</th>
                  <th className="py-3 px-4">Band</th>
                  <th className="py-3 px-4">Trajectory</th>
                  <th className="py-3 px-4">Top Drivers</th>
                  <th className="py-3 px-4">Triage Priority</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {cases.map((c) => (
                  <tr key={c.person_id} className="hover:bg-[#FAF7F2]/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-gray-900">{c.rank} {c.name}</div>
                      <div className="text-[11px] text-gray-500 font-mono">{c.person_id}</div>
                    </td>
                    <td className="py-3.5 px-4 text-gray-700">{c.unit_name}</td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-sm text-gray-900">{c.risk_score}</span>
                      <span className="text-[10px] text-gray-500 block">/ 100</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${getBandBadge(c.risk_band)}`}>
                        {c.risk_band}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {getTrajBadge(c.trajectory)}
                    </td>
                    <td className="py-3.5 px-4 text-[11px] text-gray-600 max-w-xs">
                      {c.top_factors_summary.slice(0, 2).join(', ')}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                        c.latest_priority === 'Urgent' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                        c.latest_priority === 'Soon' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-gray-100 text-gray-700 border-gray-200'
                      }`}>
                        {c.latest_priority}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setDetailPersonId(c.person_id)}
                          title="Deep Dive Case Details"
                          className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors border border-gray-200"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setTriagePersonId(c.person_id)}
                          title="Triage Officer Note"
                          className="p-1.5 bg-[#FDF8F2] hover:bg-[#F5DEBF]/50 text-[#C28A4A] rounded-lg border border-[#E6D3B8] transition-colors"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDoctorPersonId(c.person_id)}
                          title="Book Doctor Referral"
                          className="p-1.5 bg-[#C28A4A] hover:bg-[#B07A3B] text-white rounded-lg transition-colors shadow-xs"
                        >
                          <Stethoscope className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setOutcomePersonId(c.person_id)}
                          title="Log Consultation Outcome"
                          className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg border border-emerald-200 transition-colors"
                        >
                          <UserCheck className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Render Modals */}
      {detailPersonId && (
        <CaseDetailModal
          personId={detailPersonId}
          onClose={() => setDetailPersonId(null)}
          onOpenTriage={(id) => { setDetailPersonId(null); setTriagePersonId(id); }}
          onOpenDoctor={(id) => { setDetailPersonId(null); setDoctorPersonId(id); }}
          onOpenOutcome={(id) => { setDetailPersonId(null); setOutcomePersonId(id); }}
        />
      )}

      {triagePersonId && (
        <NotesTriageCard
          personId={triagePersonId}
          onClose={() => setTriagePersonId(null)}
          onSuccess={loadCases}
        />
      )}

      {doctorPersonId && (
        <DoctorBookingModal
          personId={doctorPersonId}
          onClose={() => setDoctorPersonId(null)}
          onSuccess={loadCases}
        />
      )}

      {outcomePersonId && (
        <OutcomeLoggerModal
          personId={outcomePersonId}
          onClose={() => setOutcomePersonId(null)}
          onSuccess={loadCases}
        />
      )}
    </div>
  );
}
