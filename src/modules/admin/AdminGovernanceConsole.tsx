import { useState } from 'react';
import { RBACDashboard } from './rbac/RBACDashboard';
import { GovernanceRepository } from './governance/GovernanceRepository';
import { ShieldAlert, BookOpen, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';

export function AdminGovernanceConsole() {
  const [activeTab, setActiveTab] = useState<'rbac' | 'sops'>('rbac');

  return (
    <div className="h-full flex flex-col min-w-0 pr-1 select-none">
      {/* Tab Switcher */}
      <div className="flex border-b border-[#EDEBE9] px-8 bg-white/70 backdrop-blur-md sticky top-0 z-10 py-1 gap-6">
        <button
          onClick={() => setActiveTab('rbac')}
          className={`relative pb-3 pt-4 text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all ${
            activeTab === 'rbac' ? 'text-[#0078D4]' : 'text-[#616161] hover:text-[#242424]'
          }`}
        >
          <ShieldAlert className="h-4 w-4" />
          Access Control & Roles
          {activeTab === 'rbac' && (
            <motion.div
              layoutId="gov-tabs"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0078D4] rounded-full"
            />
          )}
        </button>

        <button
          onClick={() => setActiveTab('sops')}
          className={`relative pb-3 pt-4 text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all ${
            activeTab === 'sops' ? 'text-[#0078D4]' : 'text-[#616161] hover:text-[#242424]'
          }`}
        >
          <BookOpen className="h-4 w-4" />
          SOPs & Policy Audit
          {activeTab === 'sops' && (
            <motion.div
              layoutId="gov-tabs"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0078D4] rounded-full"
            />
          )}
        </button>
      </div>

      {/* Embedded Dashboards */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'rbac' ? (
          <RBACDashboard />
        ) : (
          <GovernanceRepository />
        )}
      </div>
    </div>
  );
}
