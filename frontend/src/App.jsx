import React, { useState } from 'react';
import Navbar from './components/Navbar';
import PersonnelView from './components/PersonnelView';
import WelfareOfficerView from './components/WelfareOfficerView';
import CommanderView from './components/CommanderView';
import AuditTrailModal from './components/AuditTrailModal';

export default function App() {
  const [activeRole, setActiveRole] = useState('personnel');
  const [auditOpen, setAuditOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1F2937] flex flex-col font-sans">
      <Navbar 
        activeRole={activeRole} 
        setActiveRole={setActiveRole} 
        onOpenAudit={() => setAuditOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeRole === 'personnel' && <PersonnelView personId="PERS_1001" />}
        {activeRole === 'welfare' && <WelfareOfficerView />}
        {activeRole === 'commander' && <CommanderView />}
      </main>

      {auditOpen && <AuditTrailModal onClose={() => setAuditOpen(false)} />}

      <footer className="bg-white border-t border-gray-200 py-4 text-center text-xs text-gray-500 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Sentinel Wellness — Personnel Welfare Early-Warning System</span>
          <span>Interpretable ML • Zero-Disciplinary • Strictly Confidential</span>
        </div>
      </footer>
    </div>
  );
}
