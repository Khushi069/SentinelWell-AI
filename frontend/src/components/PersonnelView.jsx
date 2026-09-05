import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Activity, TrendingUp, TrendingDown, Minus, Moon, Smile, Zap, CheckCircle2, ShieldAlert, Sparkles } from 'lucide-react';
import { fetchPersonnelProfile, submitCheckin } from '../services/api';
import PrivacyBanner from './PrivacyBanner';

export default function PersonnelView({ personId = 'PERS_1001' }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState('');

  // Voluntary checkin form state
  const [sleep, setSleep] = useState(6);
  const [stress, setStress] = useState(5);
  const [mood, setMood] = useState(6);

  useEffect(() => {
    loadProfile();
  }, [personId]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await fetchPersonnelProfile(personId);
      setProfile(data);
      if (data.voluntary_wellness) {
        if (data.voluntary_wellness.sleep_quality) setSleep(data.voluntary_wellness.sleep_quality);
        if (data.voluntary_wellness.stress_level) setStress(data.voluntary_wellness.stress_level);
        if (data.voluntary_wellness.mood_score) setMood(data.voluntary_wellness.mood_score);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitCheckin = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const updated = await submitCheckin({
        person_id: personId,
        sleep_quality: parseFloat(sleep),
        stress_level: parseFloat(stress),
        mood_score: parseFloat(mood)
      });
      setProfile(updated);
      setToast('Voluntary check-in submitted successfully!');
      setTimeout(() => setToast(''), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#C28A4A]"></div>
      </div>
    );
  }

  if (!profile) return null;

  const getBandBadge = (band) => {
    switch (band) {
      case 'Critical': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'High': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Moderate': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      default: return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
  };

  const getTrajIcon = (traj) => {
    if (traj === 'Rising') return <TrendingUp className="w-4 h-4 text-rose-600" />;
    if (traj === 'Decreasing') return <TrendingDown className="w-4 h-4 text-emerald-600" />;
    return <Minus className="w-4 h-4 text-gray-500" />;
  };

  return (
    <div className="space-y-6">
      <PrivacyBanner role="personnel" />

      {toast && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-2 text-sm shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>{toast}</span>
        </div>
      )}

      {/* Top Banner & Score Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Risk Score Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 relative overflow-hidden shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Current Welfare Risk Index</span>
            <span className={`text-xs px-3 py-1 rounded-full font-semibold border ${getBandBadge(profile.risk_band)}`}>
              {profile.risk_band} Band
            </span>
          </div>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-4xl font-bold text-gray-900">{profile.risk_score}</span>
            <span className="text-gray-500 text-sm font-medium">/ 100</span>
          </div>

          <div className="mt-4 flex items-center gap-2 text-xs text-gray-600 bg-[#FAF7F2] p-2.5 rounded-lg border border-gray-200">
            {getTrajIcon(profile.trajectory)}
            <span>6-Week Trajectory: <strong className="text-gray-900">{profile.trajectory}</strong></span>
          </div>

          <div className="mt-4 text-xs text-gray-500">
            {profile.has_voluntary_checkin 
              ? '✓ Includes voluntary check-in data'
              : 'ℹ Voluntary check-in pending (missing data is imputed neutrally)'}
          </div>
        </div>

        {/* 6-Week Score Trajectory Chart */}
        <div className="md:col-span-2 bg-white border border-gray-200 rounded-2xl p-6 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#C28A4A]" />
              6-Week Welfare Score Trajectory
            </h4>
            <span className="text-xs text-gray-500">Unit: {profile.unit_name}</span>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={profile.historical_scores} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="week" stroke="#6B7280" fontSize={12} />
                <YAxis domain={[0, 100]} stroke="#6B7280" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', borderRadius: '0.75rem', color: '#1F2937', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  formatter={(val) => [`${val} pts`, 'Risk Score']}
                />
                <Line type="monotone" dataKey="score" stroke="#C28A4A" strokeWidth={3} dot={{ fill: '#B07A3B', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Main Grid: Voluntary Check-in + Factors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Voluntary Weekly Check-in Form */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#C28A4A]" />
              Voluntary Weekly Wellness Check-in
            </h4>
            <span className="text-xs text-[#C28A4A] bg-[#FDF8F2] px-2.5 py-1 rounded-full border border-[#E6D3B8] font-medium">
              Optional & Confidential
            </span>
          </div>

          <p className="text-xs text-gray-500 mb-6">
            Share how you are feeling this week. Your input helps provide contextual support and is never shared with operational commanders.
          </p>

          <form onSubmit={handleSubmitCheckin} className="space-y-5">
            {/* Sleep Quality Slider */}
            <div>
              <div className="flex justify-between text-xs font-medium text-gray-700 mb-1.5">
                <span className="flex items-center gap-1.5"><Moon className="w-4 h-4 text-blue-600" /> Sleep Quality</span>
                <span className="text-[#C28A4A] font-bold">{sleep} / 10</span>
              </div>
              <input 
                type="range" min="1" max="10" step="0.5" 
                value={sleep} onChange={(e) => setSleep(e.target.value)}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#C28A4A]"
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>Poor / Restless</span>
                <span>Restful / Deep</span>
              </div>
            </div>

            {/* Stress Level Slider */}
            <div>
              <div className="flex justify-between text-xs font-medium text-gray-700 mb-1.5">
                <span className="flex items-center gap-1.5"><Zap className="w-4 h-4 text-amber-600" /> Stress Level</span>
                <span className="text-amber-600 font-bold">{stress} / 10</span>
              </div>
              <input 
                type="range" min="1" max="10" step="0.5" 
                value={stress} onChange={(e) => setStress(e.target.value)}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>Relaxed / Calm</span>
                <span>High Tension</span>
              </div>
            </div>

            {/* Mood Score Slider */}
            <div>
              <div className="flex justify-between text-xs font-medium text-gray-700 mb-1.5">
                <span className="flex items-center gap-1.5"><Smile className="w-4 h-4 text-emerald-600" /> Overall Mood</span>
                <span className="text-emerald-600 font-bold">{mood} / 10</span>
              </div>
              <input 
                type="range" min="1" max="10" step="0.5" 
                value={mood} onChange={(e) => setMood(e.target.value)}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>Low / Disconnected</span>
                <span>Positive / Energized</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-[#C28A4A] hover:bg-[#B07A3B] text-white rounded-xl font-medium text-sm transition-all shadow-md shadow-[#C28A4A]/20 disabled:opacity-50"
            >
              {submitting ? 'Updating Profile...' : 'Submit Voluntary Check-in'}
            </button>
          </form>
        </div>

        {/* Contributing Factors & Personal Recommendations */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col justify-between shadow-xs">
          <div>
            <h4 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-[#C28A4A]" />
              Primary Contributing Factors & Self-Support Options
            </h4>

            {/* Elevating Factors */}
            <div className="space-y-3 mb-6">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Top Duty & Stress Drivers</span>
              {profile.top_elevating_factors.map((factor, idx) => (
                <div key={idx} className="bg-[#FAF7F2] p-3 rounded-xl border border-gray-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-medium text-gray-900">{factor.feature_label}</span>
                    <span className="text-gray-500 block text-[11px] mt-0.5">Recorded value: {factor.value_display}</span>
                  </div>
                  <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-1 rounded-md border border-amber-200">
                    +{factor.contribution_score} pts
                  </span>
                </div>
              ))}
            </div>

            {/* Actionable Self-Suggestions */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Suggested Personal Actions</span>
              <ul className="space-y-2 text-xs text-gray-700">
                {profile.actionable_recommendations.map((rec, idx) => (
                  <li key={idx} className="bg-[#FAF7F2] p-2.5 rounded-lg border border-gray-200 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200 text-[11px] text-gray-500 text-center">
            Sentinel Wellness operates in support of your wellbeing. Reach out to your Welfare Officer anytime for confidential assistance.
          </div>
        </div>
      </div>
    </div>
  );
}
