import React from 'react';
import { Shield, User, ShieldCheck, Award, History } from 'lucide-react';

export default function Navbar({ activeRole, setActiveRole, onOpenAudit }) {
  const roles = [
    { id: 'personnel', label: 'Personnel Portal', name: 'Pte. Rajesh Sharma', icon: User },
    { id: 'welfare', label: 'Welfare Officer', name: 'Capt. Ananya Verma', icon: ShieldCheck },
    { id: 'commander', label: 'Commanding Officer', name: 'Col. Vikram Singh', icon: Award },
  ];

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C28A4A] to-[#B07A3B] flex items-center justify-center text-white shadow-md shadow-[#C28A4A]/20">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              Sentinel Wellness
            </h1>
            <p className="text-xs text-gray-500">Personnel Welfare Early-Warning & Decision Support System</p>
          </div>
        </div>

        {/* Right Section: Persona Selector & Audit Log */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Persona Switcher */}
          <div className="bg-[#FAF7F2] p-1 rounded-2xl border border-gray-200 flex items-center gap-1">
            {roles.map((r) => {
              const Icon = r.icon;
              const isActive = activeRole === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => setActiveRole(r.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-2 ${
                    isActive 
                      ? 'bg-[#C28A4A] text-white shadow-sm font-semibold' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{r.label}</span>
                  <span className="text-[10px] opacity-80 hidden lg:inline">({r.name.split(' ')[0]})</span>
                </button>
              );
            })}
          </div>

          {/* Audit Log Trigger */}
          <button
            onClick={onOpenAudit}
            className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors"
            title="System Audit Trail"
          >
            <History className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
