import React, { useState, useEffect } from 'react';
import { X, History, Clock } from 'lucide-react';
import { fetchAuditLogs } from '../services/api';

export default function AuditTrailModal({ onClose }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await fetchAuditLogs();
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (action) => {
    if (action.includes('REFERRAL') || action.includes('BOOKED')) return 'bg-[#FDF8F2] text-[#C28A4A] border-[#E6D3B8]';
    if (action.includes('TRIAGED') || action.includes('NOTE')) return 'bg-amber-50 text-amber-700 border-amber-200';
    if (action.includes('OUTCOME')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-gray-200 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#FDF8F2] text-[#C28A4A] rounded-lg border border-[#E6D3B8]">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base">Immutable Welfare System Audit Trail</h3>
              <p className="text-xs text-gray-500">Chronological log of notes, referrals, bookings, and consultation outcomes</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        {loading ? (
          <div className="p-12 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#C28A4A]"></div>
          </div>
        ) : (
          <div className="p-6 overflow-y-auto space-y-4">
            {logs.map((log) => (
              <div key={log.id} className="bg-[#FAF7F2] p-4 rounded-xl border border-gray-200 text-xs space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 pb-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full font-bold border ${getActionBadge(log.action_type)}`}>
                      {log.action_type}
                    </span>
                    <span className="text-gray-800 font-medium">by {log.actor_name} ({log.actor_role})</span>
                  </div>
                  <span className="text-[11px] text-gray-500 font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3 text-gray-400" />
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>

                <p className="text-gray-800">{log.details}</p>

                {log.target_person_id && (
                  <div className="text-[11px] text-gray-500 flex items-center gap-2">
                    <span>Target Personnel: <strong className="text-gray-800">{log.target_person_id}</strong></span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
