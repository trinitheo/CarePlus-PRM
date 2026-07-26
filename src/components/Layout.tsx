import { 
  Activity, Calendar, FileText, Settings, LayoutDashboard,
  Users, CreditCard, ShieldCheck, User, LogOut,
  RefreshCcw, Signature, Share2, Zap, MessageSquare, Sparkles
} from 'lucide-react';
import { ReactNode, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HIPAAComplianceDashboard } from '../modules/compliance/HIPAAComplianceDashboard';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { auth } from '../lib/firebase';
import { authService } from '../services/authService';

const ALL_NAV_ITEMS = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Home', roles: ['admin', 'manager', 'clinician', 'nurse', 'billing', 'allied_health', 'patient', 'read_only', 'pt'] },
  { id: 'patients', icon: Users, label: 'Patients', roles: ['admin', 'manager', 'clinician', 'nurse', 'billing', 'allied_health', 'read_only', 'pt'] },
  { id: 'scheduling', icon: Calendar, label: 'Schedule', roles: ['admin', 'manager', 'front_desk'] }, 
  { id: 'roster', icon: Activity, label: 'Roster', roles: ['admin', 'manager', 'front_desk'] },
  { id: 'messages', icon: MessageSquare, label: 'Inbox', roles: ['admin', 'manager', 'clinician', 'nurse', 'billing', 'allied_health', 'patient', 'pt'] },
  { id: 'appointments', icon: Calendar, label: 'Appts', roles: ['patient'] },
  { id: 'consultations', icon: FileText, label: 'Consultations', roles: ['patient'] },
  { id: 'wellness', icon: Sparkles, label: 'Wellness', roles: ['patient'] },
  { id: 'care-network', icon: Share2, label: 'Networks', roles: ['admin', 'manager', 'clinician'] },
  { id: 'billing', icon: CreditCard, label: 'Billing', roles: ['admin', 'manager', 'billing'] },
  { id: 'care-team', icon: FileText, label: 'Workflows', roles: ['admin', 'manager', 'nurse', 'allied_health', 'pt'] },
  { id: 'frontdesk', icon: Signature, label: 'Access', roles: ['admin', 'manager', 'front_desk'] },
  { id: 'governance', icon: ShieldCheck, label: 'Control', roles: ['admin', 'manager'] },
  { id: 'settings', icon: Settings, label: 'Settings', roles: ['admin', 'manager', 'clinician', 'nurse', 'billing', 'allied_health', 'patient', 'read_only', 'pt', 'front_desk'] },
];

function NavigationRail({ currentModule, onNavigate, onOpenHipaa }: { currentModule: string, onNavigate: (module: string) => void, onOpenHipaa: () => void }) {
  const { userProfile } = useCurrentUser();

  const navItems = ALL_NAV_ITEMS.filter(item => 
    !item.roles || (userProfile?.role && item.roles.includes(userProfile.role))
  );

  const handleLogout = async () => {
    authService.logout();
    await auth.signOut();
    sessionStorage.removeItem('careplus_started');
    sessionStorage.removeItem('precison_health_view_state');
    window.location.reload();
  };

  return (
    <aside className="hidden md:flex flex-col h-screen border-r border-[#EDEBE9] bg-white w-20 shrink-0 z-20 overflow-y-auto overflow-x-hidden transition-all duration-300">
      <div className="py-6 flex flex-col items-center gap-10">
        <div className="h-10 w-10 rounded-2xl bg-[#0078D4] flex items-center justify-center shrink-0 shadow-lg shadow-[#0078D4]/20 ring-4 ring-[#0078D4]/5">
          <Activity className="h-6 w-6 text-white" />
        </div>

        <nav className="flex flex-col items-center gap-6">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = currentModule === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className="group relative flex flex-col items-center gap-1.5 w-16"
              >
                <div className={`
                  flex items-center justify-center h-8 w-14 rounded-full transition-all duration-200
                  ${active ? 'bg-[#0078D4]/10 text-[#0078D4]' : 'text-[#616161]'}
                `}>
                  <Icon className={`h-[22px] w-[22px] ${active ? 'scale-110' : ''} transition-transform`} />
                </div>
                <span className={`text-[10px] font-bold tracking-tight uppercase leading-none ${active ? 'text-[#0078D4]' : 'text-[#A19F9D]'}`}>
                  {item.label}
                </span>
                {active && (
                   <motion.div 
                     layoutId="rail-indicator" 
                     className="absolute -right-[1px] top-1/2 -translate-y-1/2 w-1 h-6 bg-[#0078D4] rounded-l-full" 
                   />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto pb-6 flex flex-col items-center gap-6">
        {userProfile?.role !== 'patient' && (
          <button 
            onClick={onOpenHipaa}
            className="flex flex-col items-center gap-1 text-emerald-600 hover:opacity-80 transition-opacity"
          >
            <div className="h-8 w-14 rounded-full flex items-center justify-center hover:bg-emerald-50">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <span className="hidden lg:block text-[9px] font-bold uppercase tracking-widest text-center">SECURE</span>
          </button>
        )}

        <button 
          className="flex flex-col items-center gap-1 text-red-600 hover:opacity-80 transition-opacity"
          onClick={handleLogout}
          title="Log out and return to landing page"
        >
          <div className="h-8 w-14 rounded-full flex items-center justify-center hover:bg-red-50">
            <LogOut className="h-5 w-5" />
          </div>
          <span className="text-[9px] font-bold uppercase tracking-widest text-center">LOGOUT</span>
        </button>

        {userProfile?.role !== 'patient' && (
          <button
            onClick={() => onNavigate('profile')}
            title="Edit Profile"
            className={`h-10 w-10 rounded-full border-2 p-0.5 shadow-sm overflow-hidden bg-white group cursor-pointer transition-all duration-200 ${
              currentModule === 'profile' ? 'border-[#0078D4] ring-4 ring-[#0078D4]/10' : 'border-[#EDEBE9] hover:border-[#0078D4]'
            }`}
          >
            <div className="w-full h-full rounded-full bg-[#F3F2F1] flex items-center justify-center font-black text-[#0078D4] text-[10px]">
              {userProfile?.displayName?.[0] || 'U'}
            </div>
          </button>
        )}
      </div>
    </aside>
  );
}

function BottomNav({ currentModule, onNavigate, onOpenHipaa }: { currentModule: string, onNavigate: (module: string) => void, onOpenHipaa: () => void }) {
  const { userProfile } = useCurrentUser();

  const handleLogout = async () => {
    authService.logout();
    await auth.signOut();
    sessionStorage.removeItem('careplus_started');
    sessionStorage.removeItem('precison_health_view_state');
    window.location.reload();
  };

  // If the user is a patient, render the highly customized mockup bottom nav
  if (userProfile?.role === 'patient') {
    const items = [
      { id: 'dashboard', label: 'HOME', icon: LayoutDashboard },
      { id: 'messages', label: 'INBOX', icon: MessageSquare },
      { id: 'appointments', label: 'APPT', icon: Calendar },
      { id: 'consultations', label: 'Clinical Notes', icon: FileText },
      { id: 'wellness', label: 'WELLNESS', icon: Sparkles },
      { id: 'settings', label: 'SETTINGS', icon: Settings },
    ];

    return (
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[76px] bg-[#E2ECF7]/95 backdrop-blur-md border-t border-[#D0DFEF] px-2 flex items-center justify-around z-50 shadow-[0_-8px_24px_rgba(15,108,189,0.06)]" id="patient-custom-bottom-nav">
        {items.map((item) => {
          const Icon = item.icon;
          const active = currentModule === item.id;
          
          let iconColor = 'text-slate-600';
          let textColor = 'text-slate-500';
          if (active) {
            iconColor = 'text-[#0078D4]';
            textColor = 'text-[#0078D4] font-black';
          } else if (item.id === 'wellness') {
            iconColor = 'text-purple-600';
            textColor = 'text-slate-500 font-bold';
          } else {
            textColor = 'text-slate-500 font-bold';
          }

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className="flex-1 flex flex-col items-center justify-center h-full transition-all duration-200 relative group active:scale-95 cursor-pointer"
            >
              {/* High-fidelity white card icon wrapper */}
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-xs border transition-all duration-300 ${
                active 
                  ? 'bg-white border-[#B9D7F5] shadow-sm scale-105' 
                  : 'bg-white/70 border-white/50 hover:bg-white hover:shadow-xs'
              }`}>
                <Icon className={`h-5 w-5 ${iconColor}`} />
              </div>
              <span className={`text-[8.5px] tracking-tight mt-1 text-center whitespace-nowrap leading-none ${textColor}`}>
                {item.label}
              </span>
            </button>
          );
        })}

        <button
          onClick={handleLogout}
          className="flex-1 flex flex-col items-center justify-center h-full transition-all duration-200 active:scale-95 cursor-pointer"
        >
          <div className="w-11 h-11 rounded-xl bg-white/70 border border-white/50 flex items-center justify-center shadow-xs hover:bg-white hover:shadow-xs">
            <LogOut className="h-5 w-5 text-red-600" />
          </div>
          <span className="text-[8.5px] tracking-tight mt-1 text-red-600 font-black leading-none">
            LOGOUT
          </span>
        </button>
      </nav>
    );
  }

  const navItems = ALL_NAV_ITEMS.filter(item => 
    !item.roles || (userProfile?.role && item.roles.includes(userProfile.role))
  );

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-t border-[#EDEBE9] px-4 flex items-center justify-around z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      {navItems.map((item) => {
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
        onClick={() => onNavigate('profile')}
        className={`flex flex-col items-center gap-1 transition-all duration-150 ${
          currentModule === 'profile' ? 'text-[#0078D4]' : 'text-[#616161]'
        }`}
      >
        <div className={`p-1.5 rounded-full transition-colors ${currentModule === 'profile' ? 'bg-[#0078D4]/10' : ''}`}>
          <User className="h-5 w-5" />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-tight">Profile</span>
      </button>

      <button 
        className="flex flex-col items-center gap-1 text-red-600 hover:opacity-80 transition-opacity"
        onClick={handleLogout}
      >
        <div className="p-1.5 rounded-full transition-colors h-8 w-8 flex items-center justify-center hover:bg-red-50">
          <LogOut className="h-5 w-5" />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-tight">LOGOUT</span>
      </button>

      <button
        onClick={onOpenHipaa}
        className="flex flex-col items-center gap-1 transition-all duration-150 text-emerald-600"
      >
        <div className="p-1.5 rounded-full transition-colors h-8 w-8 flex items-center justify-center">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <span className="hidden lg:block text-[10px] font-bold uppercase tracking-tight">HIPAA</span>
      </button>
    </nav>
  );
}

export function Shell({ children, currentModule, onNavigate }: { children: ReactNode, currentModule: string, onNavigate: (module: string) => void }) {
  const [isHipaaOpen, setIsHipaaOpen] = useState(false);

  return (
    <div className="flex bg-[#FDFDFD] min-h-screen text-[#242424] overflow-hidden selection:bg-[#0078D4]/20">
      <NavigationRail currentModule={currentModule} onNavigate={onNavigate} onOpenHipaa={() => setIsHipaaOpen(true)} />
      
      <main className="flex-1 flex flex-col min-w-0 relative pb-16 md:pb-0">
        <div className="flex-1 overflow-auto bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#0078D4]/5 via-transparent to-transparent">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentModule}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.25, ease: [0.33, 1, 0.68, 1] }} // Fluent 2 fluid motion
              className="p-4 md:p-8 flex-1 h-full"
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
