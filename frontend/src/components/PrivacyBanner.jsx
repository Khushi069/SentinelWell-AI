import React from 'react';
import { ShieldCheck, EyeOff } from 'lucide-react';

export default function PrivacyBanner({ role = 'personnel' }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 shadow-xs">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#FDF8F2] text-[#C28A4A] rounded-lg border border-[#E6D3B8]">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 flex items-center gap-2 text-sm sm:text-base">
              Non-Clinical & Dignity-Preserving Welfare System
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-normal">
                Strict Confidentiality
              </span>
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
              {role === 'commander' 
                ? 'Server-side RBAC enforces strict zero-knowledge of individual identities. Unit aggregate statistics only.'
                : role === 'welfare'
                ? 'Risk scores indicate work pattern stress signals for confidential human support — never a clinical diagnosis or disciplinary metric.'
                : 'Your voluntary check-ins are self-only. Aggregated work patterns route confidential support to your Welfare Officer.'
              }
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-600 shrink-0 bg-[#FAF7F2] px-3 py-1.5 rounded-lg border border-gray-200">
          <EyeOff className="w-4 h-4 text-emerald-600" />
          <span>No Disciplinary / Performance Impact</span>
        </div>
      </div>
    </div>
  );
}
