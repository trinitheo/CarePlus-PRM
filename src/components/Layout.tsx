import { Activity, Calendar, FileText, Settings, Users, CreditCard, ShieldCheck } from 'lucide-react';
import { ReactNode, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HIPAAComplianceDashboard } from '../domains/compliance/HIPAAComplianceDashboard';

const NAV_ITEMS = [
  { id: 'patients', icon: Users, label: 'Patients' },
  { id: 'scheduling', icon: Calendar, label: 'Schedule' },
  { id: 'billing', icon: CreditCard, label: 'Billing' },
  { id: 'care-team', icon: FileText, label: 'Collaboration' },
];

export function Sidebar({ currentModule, onNavigate, onOpenHipaa }: { currentModule: string, onNavigate: (module: string) => void, onOpenHipaa: () => void }) {
  return (
    <aside className="hidden md:flex flex-col h-screen border-r border-[#EDEBE9] bg-[#FAFAFA] transition-all duration-300 w-16 lg:w-[200px] shrink-0 shadow-sm z-20">
      <div className="p-6 flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-[#0078D4] flex items-center justify-center shrink-0 shadow-sm shadow-[#0078D4]/20">
          <Activity className="h-5 w-5 text-white" />
        </div>
        <div className="hidden lg:block overflow-hidden whitespace-nowrap">
          <h1 className="font-extrabold text-[15px] tracking-tight text-[#242424]">CarePlus AI</h1>
          <p className="text-[10px] text-[#616161] uppercase tracking-widest font-black opacity-60">PRM Enterprise</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = currentModule === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full group relative flex items-center gap-3 p-3 rounded-md transition-all duration-150 ${
                active 
                  ? 'bg-white text-[#0078D4] shadow-[0_2px_4px_rgba(0,0,0,0.04)]' 
                  : 'text-[#616161] hover:bg-[#F3F2F1] hover:text-[#242424]'
              }`}
            >
              {active && (
                <div className="absolute left-[-12px] w-1.5 h-6 bg-[#0078D4] rounded-r-full" />
              )}
              <Icon className={`h-5 w-5 shrink-0 ${active ? 'text-[#0078D4]' : ''}`} />
              <span className={`hidden lg:block text-[13px] font-semibold tracking-tight ${active ? 'text-[#201F1E]' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-[#EDEBE9]/50 space-y-1">
        <button 
          onClick={onOpenHipaa}
          className="w-full flex items-center gap-3 p-3 rounded-md text-emerald-600 hover:bg-emerald-50 transition-all duration-150"
        >
          <ShieldCheck className="h-5 w-5 shrink-0" />
          <span className="hidden lg:block text-[13px] font-semibold tracking-tight">HIPAA Agent</span>
        </button>
        <button className="w-full flex items-center gap-3 p-3 rounded-md text-[#616161] hover:bg-[#F3F2F1] hover:text-[#242424] transition-all duration-150">
          <Settings className="h-5 w-5 shrink-0" />
          <span className="hidden lg:block text-[13px] font-semibold tracking-tight">Settings</span>
        </button>
      </div>
    </aside>
  );
}

export function BottomNav({ currentModule, onNavigate, onOpenHipaa }: { currentModule: string, onNavigate: (module: string) => void, onOpenHipaa: () => void }) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-t border-[#EDEBE9] px-4 flex items-center justify-around z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const active = currentModule === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`flex flex-col items-center gap-1 transition-all duration-150 ${
              active ? 'text-[#0078D4]' : 'text-[#616161]'
            }`}
          >
            <div className={`p-1.5 rounded-full transition-colors ${active ? 'bg-[#0078D4]/10' : ''}`}>
              <Icon className={`h-5 w-5`} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-tight">{item.label}</span>
          </button>
        );
      })}
      <button
        onClick={onOpenHipaa}
        className="flex flex-col items-center gap-1 transition-all duration-150 text-emerald-600"
      >
        <div className="p-1.5 rounded-full transition-colors h-8 w-8 flex items-center justify-center">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-tight">HIPAA</span>
      </button>
    </nav>
  );
}

export function Shell({ children, currentModule, onNavigate }: { children: ReactNode, currentModule: string, onNavigate: (module: string) => void }) {
  const [isHipaaOpen, setIsHipaaOpen] = useState(false);

  return (
    <div className="flex bg-background min-h-screen text-foreground overflow-hidden selection:bg-primary/20">
      <Sidebar currentModule={currentModule} onNavigate={onNavigate} onOpenHipaa={() => setIsHipaaOpen(true)} />
      
      <main className="flex-1 flex flex-col min-w-0 relative pb-16 md:pb-0">
        <div className="flex-1 overflow-auto bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-muted/30 via-transparent to-transparent">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentModule}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="p-3 md:p-6 flex-1 h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <BottomNav currentModule={currentModule} onNavigate={onNavigate} onOpenHipaa={() => setIsHipaaOpen(true)} />

      <HIPAAComplianceDashboard
        isOpen={isHipaaOpen}
        onClose={() => setIsHipaaOpen(false)}
      />
    </div>
  );
}
