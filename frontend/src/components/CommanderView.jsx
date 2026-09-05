import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { ShieldCheck, Users, BarChart3, AlertOctagon, CheckCircle2, Lock } from 'lucide-react';
import { fetchCommanderSummary } from '../services/api';
import PrivacyBanner from './PrivacyBanner';

const BAND_COLORS = {
  Low: '#10b981',
  Moderate: '#eab308',
  High: '#f97316',
  Critical: '#f43f5e'
};

export default function CommanderView() {
  const [unitId, setUnitId] = useState('UNIT_ALPHA');
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSummary();
  }, [unitId]);

  const loadSummary = async () => {
    setLoading(true);
    try {
      const data = await fetchCommanderSummary(unitId);
      setSummary(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !summary) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#C28A4A]"></div>
      </div>
    );
  }

  const pieData = Object.entries(summary.risk_band_percentages).map(([band, pct]) => ({
    name: band,
    value: pct,
    count: summary.risk_band_counts[band]
  }));

  return (
    <div className="space-y-6">
      <PrivacyBanner role="commander" />

      {/* Unit Selector Bar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#FDF8F2] text-[#C28A4A] rounded-xl border border-[#E6D3B8]">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm sm:text-base">Unit Welfare & Workload Command Dashboard</h3>
            <p className="text-xs text-gray-500">Aggregate workload statistics & structural risk distribution</p>
          </div>
        </div>

        <select
          value={unitId}
          onChange={(e) => setUnitId(e.target.value)}
          className="bg-[#FAF7F2] border border-gray-200 text-gray-800 text-xs font-medium rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#C28A4A]"
        >
          <option value="UNIT_ALPHA">1st Battalion (Alpha)</option>
          <option value="UNIT_BRAVO">2nd Support (Bravo)</option>
          <option value="UNIT_CHARLIE">3rd Rapid Response (Charlie)</option>
          <option value="UNIT_DELTA">4th Garrison HQ (Delta)</option>
        </select>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
          <span className="text-xs text-gray-500 font-medium block">Total Personnel</span>
          <span className="text-3xl font-bold text-gray-900 mt-2 block">{summary.total_personnel}</span>
          <span className="text-[11px] text-gray-500 mt-2 block">Active Duty Roster</span>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
          <span className="text-xs text-gray-500 font-medium block">Avg Weekly Duty Hours</span>
          <span className="text-3xl font-bold text-gray-900 mt-2 block">{summary.average_weekly_duty_hours} hrs</span>
          <span className="text-[11px] text-gray-500 mt-2 block">Unit-wide average</span>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
          <span className="text-xs text-gray-500 font-medium block">Avg Monthly Night Shifts</span>
          <span className="text-3xl font-bold text-gray-900 mt-2 block">{summary.average_night_shifts} shifts</span>
          <span className="text-[11px] text-gray-500 mt-2 block">Per person monthly norm</span>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
          <span className="text-xs text-gray-500 font-medium block">Workload Disparity Index</span>
          <span className={`text-3xl font-bold mt-2 block ${summary.workload_imbalance_index > 0.4 ? 'text-amber-700' : 'text-emerald-700'}`}>
            {summary.workload_imbalance_index}
          </span>
          <span className="text-[11px] text-gray-500 mt-2 block">0 (Equal) to 1 (Extreme Disparity)</span>
        </div>
      </div>

      {/* Main Charts: Risk Band Distribution & Workload Imbalance Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Risk Band Distribution Pie/Bar */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col justify-between shadow-xs">
          <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center justify-between">
            <span>Unit Welfare Risk Band Distribution (%)</span>
            <span className="text-xs text-gray-500">Aggregate Only</span>
          </h4>

          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={BAND_COLORS[entry.name] || '#C28A4A'} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', borderRadius: '0.75rem', color: '#1F2937' }}
                  formatter={(val, name, props) => [`${val}% (${props.payload.count} personnel)`, 'Share']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center text-xs mt-4 pt-4 border-t border-gray-200">
            {pieData.map((d) => (
              <div key={d.name} className="p-2 rounded-lg bg-[#FAF7F2] border border-gray-200">
                <span className="text-[11px] text-gray-500 block">{d.name} Band</span>
                <span className="font-bold text-gray-900">{d.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Structural Workload Imbalance Variance Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col justify-between shadow-xs">
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#C28A4A]" />
              Structural Duty Disparity (Top 20% vs Bottom 20%)
            </h4>

            <div className="space-y-4 my-6">
              <div className="bg-[#FAF7F2] p-4 rounded-xl border border-gray-200">
                <div className="flex justify-between items-center text-xs text-gray-600 mb-1.5">
                  <span>Highest Workload Cohort (Top 20%)</span>
                  <span className="font-bold text-rose-700">{summary.highest_workload_group_avg_hours} hrs/wk avg</span>
                </div>
                <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
                  <div 
                    className="bg-rose-500 h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, (summary.highest_workload_group_avg_hours / 90) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="bg-[#FAF7F2] p-4 rounded-xl border border-gray-200">
                <div className="flex justify-between items-center text-xs text-gray-600 mb-1.5">
                  <span>Lowest Workload Cohort (Bottom 20%)</span>
                  <span className="font-bold text-emerald-700">{summary.lowest_workload_group_avg_hours} hrs/wk avg</span>
                </div>
                <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, (summary.lowest_workload_group_avg_hours / 90) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="text-xs text-gray-600 bg-[#FAF7F2] p-3 rounded-xl border border-gray-200">
              Workload gap: <strong className="text-amber-800">{(summary.highest_workload_group_avg_hours - summary.lowest_workload_group_avg_hours).toFixed(1)} hrs/wk</strong>. High disparity indicates structural duty allocation imbalance rather than individual fatigue.
            </div>
          </div>
        </div>
      </div>

      {/* Organizational Action Recommendations */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
        <h4 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <AlertOctagon className="w-5 h-5 text-[#C28A4A]" />
          Organizational & Structural Action Recommendations
        </h4>

        <div className="space-y-3">
          {summary.organizational_recommendations.map((rec, idx) => (
            <div key={idx} className="bg-[#FAF7F2] p-3.5 rounded-xl border border-gray-200 text-xs text-gray-800 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{rec}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Privacy Guarantee Badge */}
      <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-center justify-between text-xs text-emerald-800">
        <div className="flex items-center gap-2.5">
          <Lock className="w-5 h-5 text-emerald-700 shrink-0" />
          <div>
            <strong>Strict Server-Side Privacy Guarantee:</strong> {summary.privacy_notice}
          </div>
        </div>
      </div>
    </div>
  );
}
