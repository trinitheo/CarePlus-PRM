import React, { useState, useEffect } from 'react';
import { authService, CurrentUser } from '../services/authService';
import { 
  User, Lock, AlertTriangle, ChevronRight, ChevronLeft, Activity, 
  MapPin, ShieldCheck, Mail, Phone, Fingerprint, Check, CreditCard, 
  Settings, Key, AlertCircle, RefreshCcw, Eye, HelpCircle, Laptop,
  FlameKindling
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { signInAnonymously } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { saveUserProfile } from '../services/clinicalFirestoreService';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

// Config lists from specified schema
const CLINICS = [
  { id: 'clinic-main', label: 'Main Clinic', location: 'Downtown' },
  { id: 'clinic-branch-b', label: 'Branch B', location: 'Uptown' },
  { id: 'clinic-branch-c', label: 'Branch C', location: 'Suburban' }
];

const PROVIDER_IDENTIFICATIONS = [
  { id: 'email', label: 'Email Address', icon: <Mail className="w-5 h-5" /> },
  { id: 'providerId', label: 'Provider ID / Badge', icon: <CreditCard className="w-5 h-5" /> },
  { id: 'sso', label: 'Corporate SSO (Google/MS)', icon: <ShieldCheck className="w-5 h-5" /> }
];

const SECURITY_QUESTIONS = [
  "What is your mother's maiden name?",
  "What city were you born in?",
  "What is the name of your first pet?",
  "What was your first phone number?"
];

const DEMO_USERS = [
  {
    id: "user-clinic-001",
    displayName: "Dr. Sarah Chen",
    email: "sarah.chen@careplus.local",
    role: "clinician",
    avatar: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?q=80&w=200&auto=format&fit=crop",
    clinic: "clinic-main",
    status: "Active"
  },
  {
    id: "uid-nurse-alex-001",
    displayName: "Nurse Alex Morgan, RN",
    email: "alex.morgan@careplus.health",
    role: "nurse",
    avatar: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?q=80&w=200&auto=format&fit=crop",
    clinic: "clinic-main",
    status: "Active"
  },
  {
    id: "user-clinic-002",
    displayName: "Mark Davis",
    email: "mark.davis@careplus.local",
    role: "nurse",
    avatar: "https://images.unsplash.com/photo-1537368910025-7003507965b6?q=80&w=200&auto=format&fit=crop",
    clinic: "clinic-main",
    status: "Active"
  },
  {
    id: "user-clinic-003",
    displayName: "Jane Smith",
    email: "jane.smith@careplus.local",
    role: "pt",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop",
    clinic: "clinic-main",
    status: "Active"
  },
  {
    id: "user-clinic-004",
    displayName: "Admin Panel",
    email: "admin@careplus.local",
    role: "admin",
    avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=200&auto=format&fit=crop",
    clinic: "clinic-main",
    status: "Active"
  }
];

const ERRORS_LIST = {
  invalidCredentials: "The email or password you entered is incorrect.",
  accountLocked: "Your account has been locked due to multiple failed login attempts. Please try again in 15 minutes.",
  mfaFailed: "The verification code you entered is incorrect or has expired.",
  networkError: "Unable to connect to the server. Please check your internet connection.",
  sessionExpired: "Your session has expired. Please log in again.",
  unauthorizedRole: "Your account does not have access to this portal.",
  clinicMismatch: "You do not have access to the selected clinic."
};

const THEMES = {
  staff: {
    primaryColor: "#3b82f6", // blue
    accentColor: "#1e40af",
    backgroundColor: "bg-slate-50",
    bannerBg: "from-[#0A0D14]",
    icon: "🏥",
    accentLight: "bg-blue-50 text-blue-600 border-blue-100",
    buttonClass: "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500/20"
  },
  patient: {
    primaryColor: "#10b981", // emerald
    accentColor: "#059669",
    backgroundColor: "bg-emerald-50/30",
    bannerBg: "from-[#061C14]",
    icon: "❤️",
    accentLight: "bg-emerald-50 text-emerald-600 border-emerald-100",
    buttonClass: "bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-emerald-500/20"
  },
  guest: {
    primaryColor: "#8b5cf6", // violet
    accentColor: "#7c3aed",
    backgroundColor: "bg-violet-50/30",
    bannerBg: "from-[#11091C]",
    icon: "👁️",
    accentLight: "bg-violet-50 text-violet-600 border-violet-100",
    buttonClass: "bg-violet-600 hover:bg-violet-700 text-white focus:ring-violet-500/20"
  },
  welcome: {
    primaryColor: "#0078D4",
    accentColor: "#005a9e",
    backgroundColor: "bg-white",
    bannerBg: "from-[#0A0D14]",
    icon: "🏥",
    accentLight: "bg-slate-50 text-slate-700 border-slate-100",
    buttonClass: "bg-[#0078D4] hover:bg-[#005a9e] text-white"
  }
};

export function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  // State variables for active flow
  const [activeFlow, setActiveFlow] = useState<'welcome' | 'staff' | 'patient' | 'guest'>('welcome');
  const [agreed, setAgreed] = useState<boolean>(false);
  const [showWarning, setShowWarning] = useState<boolean>(false);
  const [sandboxOpen, setSandboxOpen] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorStatus, setErrorStatus] = useState<string>('');
  const [failedLoginCount, setFailedLoginCount] = useState<number>(0);
  const [isLockedOut, setIsLockedOut] = useState<boolean>(false);

  // General Input States
  const [selectedClinic, setSelectedClinic] = useState<string>('clinic-main');
  
  // Staff Flow Input state
  const [staffIdMethod, setStaffIdMethod] = useState<'email' | 'providerId' | 'sso'>('email');
  const [staffEmail, setStaffEmail] = useState<string>('');
  const [staffBadge, setStaffBadge] = useState<string>('');
  const [staffPassword, setStaffPassword] = useState<string>('');
  const [selectedStaffRole, setSelectedStaffRole] = useState<string>('clinician');

  // Patient Flow Input state
  const [patientContactMethod, setPatientContactMethod] = useState<'email' | 'phone' | 'medicalId'>('email');
  const [patientContactValue, setPatientContactValue] = useState<string>('');
  const [patientPasswordless, setPatientPasswordless] = useState<boolean>(false);
  const [patientPassword, setPatientPassword] = useState<string>('');
  const [selectedSecurityQuestion, setSelectedSecurityQuestion] = useState<string>(SECURITY_QUESTIONS[0]);
  const [securityAnswer, setSecurityAnswer] = useState<string>('');

  // Password requirements calculation
  const passLengthOk = patientPassword.length >= 8;
  const passUpperOk = /[A-Z]/.test(patientPassword);
  const passNumOk = /[0-9]/.test(patientPassword);
  const passSpecialOk = /[^A-Za-z0-9]/.test(patientPassword);

  // Active theme properties
  const activeTheme = THEMES[activeFlow];

  // Demo user quick-fill handler
  const handleQuickDemoClick = (demo: typeof DEMO_USERS[0]) => {
    setErrorStatus('');
    setSelectedClinic(demo.clinic);
    setStaffIdMethod('email');
    setStaffEmail(demo.email);
    setSelectedStaffRole(demo.role);
    setStaffPassword('demo-bypass-code');
    
    // Jump to the final step
    setCurrentStep(4);
  };

  const handleQuickDemoSubmit = async (demo: typeof DEMO_USERS[0]) => {
    setIsLoading(true);
    setStaffEmail(demo.email);
    setErrorStatus('');
    try {
      const demoUser = await authService.loginWithDemo(demo.email);
      const cred = await signInAnonymously(auth);
      const finalUid = cred.user.uid;
      
      await saveUserProfile(finalUid, {
        ...demoUser,
        id: finalUid,
        originalId: demoUser.id,
        role: (demo.role === 'pt' ? 'pt' : demo.role) as any
      });
      
      onLoginSuccess();
    } catch (err: any) {
      setErrorStatus(err.message || 'An unknown error occurred.');
      setIsLoading(false);
    }
  };

  const handleDirectSignIn = async (type: 'staff' | 'patient' | 'guest', demo?: typeof DEMO_USERS[0]) => {
    setIsLoading(true);
    setErrorStatus('');
    if (demo) {
      setStaffEmail(demo.email);
    }
    try {
      if (type === 'staff' && demo) {
        const demoUser = await authService.loginWithDemo(demo.email);
        const cred = await signInAnonymously(auth);
        const finalUid = cred.user.uid;
        
        await saveUserProfile(finalUid, {
          ...demoUser,
          id: finalUid,
          originalId: demoUser.id,
          role: (demo.role === 'pt' ? 'pt' : demo.role) as any
        });
      } else if (type === 'patient') {
        const demoUser = await authService.loginWithDemo('m.everett@personal.com');
        const cred = await signInAnonymously(auth);
        const finalUid = cred.user.uid;
        
        await saveUserProfile(finalUid, {
          ...demoUser,
          id: finalUid,
          originalId: demoUser.id,
          role: 'patient',
          displayName: demoUser.displayName || 'Marcus Everett',
          email: 'm.everett@personal.com'
        });
      } else if (type === 'guest') {
        const demoUser: CurrentUser = {
          id: 'pat-demo-001',
          displayName: 'Marcus Johnson (Guest)',
          email: 'marcus.johnson@guest.local',
          role: 'read_only' as any,
          patientId: 'pat-marcus-001',
          avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop',
          createdAt: new Date().toISOString()
        };

        localStorage.setItem('careplus_current_user', JSON.stringify(demoUser));

        const cred = await signInAnonymously(auth);
        const finalUid = cred.user.uid;
        
        await saveUserProfile(finalUid, {
          ...demoUser,
          id: finalUid,
          originalId: 'pat-demo-001'
        });
      }
      onLoginSuccess();
    } catch (err: any) {
      setErrorStatus(err.message || 'Quick login failed');
      setIsLoading(false);
    }
  };

  const executeStaffLogin = async () => {
    if (isLockedOut) {
      setErrorStatus(ERRORS_LIST.accountLocked);
      return;
    }

    setIsLoading(true);
    setErrorStatus('');

    // Simulate potential issues
    if (staffIdMethod === 'email' && !staffEmail) {
      setErrorStatus('Please provide an Email Address.');
      setIsLoading(false);
      return;
    }

    if (staffIdMethod === 'providerId' && !staffBadge) {
      setErrorStatus('Please provide a Provider ID / Badge Number.');
      setIsLoading(false);
      return;
    }

    // Lockout logic simulation
    if (staffPassword !== 'demo-bypass-code' && failedLoginCount >= 4) {
      setIsLockedOut(true);
      setErrorStatus(ERRORS_LIST.accountLocked);
      setIsLoading(false);
      return;
    }

    if (staffPassword !== 'demo-bypass-code' && staffPassword !== '12345123' && staffPassword.toLowerCase() !== 'password123' && staffPassword !== 'admin123') {
      const newFails = failedLoginCount + 1;
      setFailedLoginCount(newFails);
      if (newFails >= 5) {
        setIsLockedOut(true);
        setErrorStatus(ERRORS_LIST.accountLocked);
      } else {
        setErrorStatus(ERRORS_LIST.invalidCredentials + ` (Attempt ${newFails}/5 before lockout)`);
      }
      setIsLoading(false);
      return;
    }

    // Verify selected clinic matches (demo only supports clinic-main)
    if (selectedClinic !== 'clinic-main') {
      setErrorStatus(ERRORS_LIST.clinicMismatch);
      setIsLoading(false);
      return;
    }

    try {
      // Find matching user or fallback
      const targetEmail = staffEmail || (selectedStaffRole === 'admin' ? 'admin@careplus.local' : 'sarah.chen@careplus.local');
      const demoUser = await authService.loginWithDemo(targetEmail);
      
      const cred = await signInAnonymously(auth);
      const finalUid = cred.user.uid;
      
      await saveUserProfile(finalUid, {
        ...demoUser,
        id: finalUid,
        originalId: demoUser.id,
        role: selectedStaffRole as any
      });

      onLoginSuccess();
    } catch (err: any) {
      setErrorStatus(err.message || 'Verification Error');
      setIsLoading(false);
    }
  };

  const executePatientLogin = async () => {
    setIsLoading(true);
    setErrorStatus('');

    if (!patientContactValue) {
      setErrorStatus(`Please provide a patient contact detail.`);
      setIsLoading(false);
      return;
    }

    // Verify Password if not passwordless
    if (!patientPasswordless && patientPassword) {
      if (!passLengthOk || !passUpperOk || !passNumOk || !passSpecialOk) {
        setErrorStatus('Password does not satisfy the secure criteria.');
        setIsLoading(false);
        return;
      }
    }

    try {
      // Authenticate as Marcus Everett (pat-marcus-001)
      const emailToUse = patientContactMethod === 'email' ? patientContactValue : 'm.everett@personal.com';
      const demoUser = await authService.loginWithDemo('m.everett@personal.com');
      
      const cred = await signInAnonymously(auth);
      const finalUid = cred.user.uid;
      
      await saveUserProfile(finalUid, {
        ...demoUser,
        id: finalUid,
        originalId: demoUser.id,
        role: 'patient',
        displayName: demoUser.displayName || 'Marcus Everett',
        email: emailToUse
      });

      onLoginSuccess();
    } catch (err: any) {
      setErrorStatus(err.message || 'Validation error');
      setIsLoading(false);
    }
  };

  const executeGuestLogin = async () => {
    setIsLoading(true);
    setErrorStatus('');
    try {
      // Authenticate as read_only role connected to Marcus Johnson demo context
      const demoUser: CurrentUser = {
        id: 'pat-demo-001',
        displayName: 'Marcus Johnson (Guest)',
        email: 'marcus.johnson@guest.local',
        role: 'read_only' as any,
        patientId: 'pat-marcus-001',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop',
        createdAt: new Date().toISOString()
      };

      localStorage.setItem('careplus_current_user', JSON.stringify(demoUser));

      // real firebase login
      const cred = await signInAnonymously(auth);
      const finalUid = cred.user.uid;
      
      await saveUserProfile(finalUid, {
        ...demoUser,
        id: finalUid,
        originalId: 'pat-demo-001'
      });

      onLoginSuccess();
    } catch (err: any) {
      setErrorStatus(err.message || 'Failed guest initialization');
      setIsLoading(false);
    }
  };

  const navigateBackFlow = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    } else {
      setActiveFlow('welcome');
      setErrorStatus('');
    }
  };

  const advanceStep = () => {
    setErrorStatus('');
    setCurrentStep(prev => prev + 1);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-tr from-indigo-100 via-rose-50 to-orange-100 p-4 md:p-8 font-sans select-none overflow-y-auto">
      
      {/* Central Card with split screen layout */}
      <div className="bg-white rounded-[32px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.08)] border border-slate-100/60 max-w-6xl w-full md:h-[680px] flex flex-col md:flex-row overflow-hidden p-3 md:p-4 shrink-0 transition-all">
        
        {/* Left Column: Visual Banner (Mockup Styled Sunset) */}
        <div className="hidden md:flex md:w-[42%] lg:w-[45%] h-full relative rounded-[24px] overflow-hidden flex-col justify-between p-8 shrink-0 bg-gradient-to-b from-[#7A61BA] via-[#DF9C8C] to-[#EFA68D] group">
          {/* Abstract blurred sunset visual */}
          <div className="absolute inset-0 z-0">
            <img 
              src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=600&auto=format&fit=crop" 
              alt="Abstract Sunset" 
              className="w-full h-full object-cover object-center opacity-85 scale-105 blur-[3px] saturate-150 transition-transform duration-[20s] ease-linear group-hover:scale-110"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/30 via-rose-500/20 to-orange-400/20 mix-blend-overlay" />
            <div className="absolute inset-0 bg-black/5" />
          </div>

          <div className="relative z-10 w-full h-full flex flex-col justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-white/90" />
              <span className="text-sm font-semibold uppercase tracking-widest text-white/90">CarePlus</span>
            </div>

            {/* Mockup custom logo: Overlapping squares */}
            <div className="flex items-center gap-2.5 mt-auto">
              <div className="relative w-10 h-10 bg-white rounded-xl shadow-md flex items-center justify-center overflow-hidden">
                <div className="absolute top-1.5 left-1.5 w-6 h-6 bg-slate-900 rounded rotate-12 opacity-85" />
                <div className="absolute bottom-1.5 right-1.5 w-6 h-6 bg-slate-700 rounded -rotate-12 opacity-95" />
                <Activity className="w-5 h-5 text-white relative z-10" />
              </div>
              <span className="text-xs font-black tracking-widest uppercase italic text-white/95">
                PRM<span className="text-[8px] align-super font-normal ml-0.5">TM</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Interactive Auth Workspace */}
        <div className={`flex-1 h-full flex flex-col justify-center px-6 md:px-10 lg:px-14 py-8 relative overflow-y-auto rounded-[24px] transition-colors duration-300 ${activeTheme.backgroundColor}`}>
          
          {/* Mobile Header indicator */}
          <div className="md:hidden text-center mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-sky-100 rounded-full text-sky-800 text-xs font-bold mb-2">
              <Activity className="w-4 h-4" />
              <span>CarePlus PRM</span>
            </div>
          </div>

          <div className="w-full max-w-[460px] mx-auto space-y-6">
            <AnimatePresence mode="wait">
              
              {/* 1. WELCOME SCREEN / AUTH FLOW SELECTOR */}
              {activeFlow === 'welcome' && (
                <motion.div
                  key="welcome-screen"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-6"
                >
                  <div>
                    <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                      Enter CarePlus
                    </h1>
                    <p className="text-slate-500 text-xs font-medium mt-1.5 leading-relaxed">
                      Manage clinical operations, care teams, and patient records—one clinic at a time.
                    </p>
                  </div>

                  {/* Policy / Terms Agreement Checkbox */}
                  <div className="space-y-2 mt-4">
                    <div className="flex items-start gap-3">
                      <input 
                        type="checkbox" 
                        id="agree-terms"
                        checked={agreed}
                        onChange={(e) => {
                          setAgreed(e.target.checked);
                          if (e.target.checked) {
                            setShowWarning(false);
                          }
                        }}
                        className="mt-0.5 w-5 h-5 text-slate-950 border-slate-300 rounded focus:ring-slate-950 bg-white accent-slate-900 cursor-pointer"
                      />
                      <label htmlFor="agree-terms" className="text-xs text-slate-500 font-medium leading-relaxed select-none cursor-pointer">
                        I agree with the <span className="underline cursor-pointer hover:text-slate-800 transition-colors">Terms of Use</span> and acknowledge the <span className="underline cursor-pointer hover:text-slate-800 transition-colors">CarePlus Privacy Policy</span>.
                      </label>
                    </div>

                    {showWarning && (
                      <motion.div 
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-1.5 text-rose-600 text-[10px] font-bold"
                      >
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Please agree to the Terms of Use to select a login portal.</span>
                      </motion.div>
                    )}
                  </div>

                  {/* Two Main Cards Grid (from Mockup) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                    
                    {/* Healthcare Provider Card */}
                    <div
                      onClick={() => {
                        if (!agreed) {
                          setShowWarning(true);
                          return;
                        }
                        setActiveFlow('staff');
                        setCurrentStep(1);
                        setErrorStatus('');
                      }}
                      className={`border border-slate-200/80 rounded-[24px] p-5 bg-white flex flex-col justify-between h-[165px] text-left transition-all ${
                        agreed 
                          ? 'hover:shadow-[0_8px_24px_rgba(0,0,0,0.04)] hover:border-slate-300 cursor-pointer active:scale-[0.99]' 
                          : 'opacity-65 cursor-not-allowed filter grayscale-[15%]'
                      }`}
                    >
                      <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl w-10 h-10 flex items-center justify-center text-slate-700">
                        <Laptop className="w-5 h-5 text-slate-700" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1">
                          Healthcare Provider
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        </h3>
                        <p className="text-[11px] text-slate-400 font-medium leading-relaxed mt-1">
                          Clinicians, nurses, physical therapists, and admins.
                        </p>
                      </div>
                    </div>

                    {/* Patient Portal Card */}
                    <div
                      onClick={() => {
                        if (!agreed) {
                          setShowWarning(true);
                          return;
                        }
                        setActiveFlow('patient');
                        setCurrentStep(1);
                        setErrorStatus('');
                      }}
                      className={`border border-slate-200/80 rounded-[24px] p-5 bg-white flex flex-col justify-between h-[165px] text-left transition-all ${
                        agreed 
                          ? 'hover:shadow-[0_8px_24px_rgba(0,0,0,0.04)] hover:border-slate-300 cursor-pointer active:scale-[0.99]' 
                          : 'opacity-65 cursor-not-allowed filter grayscale-[15%]'
                      }`}
                    >
                      <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl w-10 h-10 flex items-center justify-center text-slate-700">
                        <Fingerprint className="w-5 h-5 text-slate-700" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1">
                          Patient Portal
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        </h3>
                        <p className="text-[11px] text-slate-400 font-medium leading-relaxed mt-1">
                          Access medical charts, checkups, and logs.
                        </p>
                      </div>
                    </div>

                  </div>

                  {/* Continuing Guest and Sandbox Integration */}
                  <div className="space-y-3 pt-2">
                    
                    {/* Collapsible Sandbox Toggle */}
                    <div className="border border-slate-150 rounded-2xl bg-slate-50/50 p-1">
                      <button
                        type="button"
                        onClick={() => setSandboxOpen(!sandboxOpen)}
                        className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-black text-slate-500 uppercase tracking-wider hover:text-slate-800 transition-colors"
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="text-amber-500">⚡</span>
                          <span>Developer Sandbox & Guest Portal</span>
                        </div>
                        <span className="text-xs">{sandboxOpen ? '−' : '+'}</span>
                      </button>

                      {sandboxOpen && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="px-3 pb-3 pt-1 space-y-3 border-t border-slate-150 mt-1"
                        >
                          <p className="text-[10px] text-slate-400 leading-normal font-semibold">
                            Instantly authenticate using active evaluation profiles or use Guest mode with read-only access.
                          </p>
                          
                          <div className="grid grid-cols-2 gap-2">
                            {/* Healthcare Staff */}
                            {DEMO_USERS.map(demo => {
                              const isActiveLoading = isLoading && staffEmail === demo.email;
                              return (
                                <button
                                  key={demo.id}
                                  type="button"
                                  onClick={() => handleDirectSignIn('staff', demo)}
                                  disabled={isLoading}
                                  className="text-left p-2 bg-white hover:bg-slate-50 border border-slate-150 hover:border-slate-300 rounded-xl shadow-sm transition-all flex items-center gap-2 group relative overflow-hidden"
                                >
                                  <img src={demo.avatar} alt={demo.displayName} className="w-6 h-6 rounded-lg object-cover border border-slate-100 shrink-0" />
                                  <div className="min-w-0 space-y-0.5">
                                    <p className="text-[10px] font-bold text-slate-800 truncate leading-tight group-hover:text-slate-950 transition-colors">{demo.displayName}</p>
                                    <div className="text-[8px] text-[#5c5a57] font-black uppercase tracking-tight leading-none">
                                      {demo.role}
                                    </div>
                                  </div>
                                </button>
                              );
                            })}

                            {/* Patient Sandbox */}
                            <button
                              type="button"
                              onClick={() => handleDirectSignIn('patient')}
                              disabled={isLoading}
                              className="text-left p-2 bg-white hover:bg-slate-50 border border-slate-150 hover:border-slate-300 rounded-xl shadow-sm transition-all flex items-center gap-2 group relative overflow-hidden"
                            >
                              <img 
                                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop" 
                                alt="Marcus Everett" 
                                className="w-6 h-6 rounded-lg object-cover border border-slate-100 shrink-0" 
                              />
                              <div className="min-w-0 space-y-0.5">
                                <p className="text-[10px] font-bold text-slate-800 truncate leading-tight group-hover:text-slate-950 transition-colors">Marcus Everett</p>
                                <div className="text-[8px] text-[#5c5a57] font-black uppercase tracking-tight leading-none">
                                  Patient
                                </div>
                              </div>
                            </button>

                            {/* Guest Sandbox */}
                            <button
                              type="button"
                              onClick={() => handleDirectSignIn('guest')}
                              disabled={isLoading}
                              className="text-left p-2 bg-white hover:bg-slate-50 border border-slate-150 hover:border-slate-300 rounded-xl shadow-sm transition-all flex items-center gap-2 group relative overflow-hidden"
                            >
                              <img 
                                src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop" 
                                alt="Marcus Johnson" 
                                className="w-6 h-6 rounded-lg object-cover border border-slate-100 shrink-0" 
                              />
                              <div className="min-w-0 space-y-0.5">
                                <p className="text-[10px] font-bold text-slate-800 truncate leading-tight group-hover:text-slate-950 transition-colors">Marcus Johnson</p>
                                <div className="text-[8px] text-[#5c5a57] font-black uppercase tracking-tight leading-none">
                                  Guest Read-Only
                                </div>
                              </div>
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </div>

                  </div>

                  {/* Absolute Footer inside right pane container */}
                  <div className="pt-8 flex items-center justify-end gap-4 text-[10px] font-medium text-slate-400">
                    <span className="cursor-pointer hover:text-slate-600 transition-colors">Privacy Policy</span>
                    <span className="cursor-pointer hover:text-slate-600 transition-colors">Terms of Service</span>
                  </div>
                </motion.div>
              )}

            {/* 2. STAFF WORKFLOW (HEALTHCARE PROVIDER) */}
            {activeFlow === 'staff' && (
              <motion.div
                key="staff-flow"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <button
                    onClick={navigateBackFlow}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                  </button>
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                    Step {currentStep} of 4
                  </span>
                </div>

                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <span>{THEMES.staff.icon}</span> Staff Portal Login
                  </h3>
                  <p className="text-xs font-semibold text-slate-500 mt-1">Verify credentials for clinical access</p>
                </div>

                {/* Progress Indicators */}
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4].map(s => (
                    <div 
                      key={s} 
                      className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                        s < currentStep 
                          ? 'bg-blue-600' 
                          : s === currentStep 
                          ? 'bg-blue-400 animate-pulse' 
                          : 'bg-slate-200'
                      }`} 
                    />
                  ))}
                </div>

                {/* Step 1: Dropdown clinic selector */}
                {currentStep === 1 && (
                  <div className="space-y-4 animate-fade">
                    <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 md:p-5 space-y-3">
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-blue-800 uppercase tracking-widest bg-blue-100/80 px-2.5 py-1 rounded-full border border-blue-200">
                        ⚡ Quick Select — Active Demo Profiles
                      </span>
                      <p className="text-[11px] text-slate-600 leading-normal font-semibold">
                        Click any profile below to instantly authenticate and sign in with role-based access control (RBAC).
                      </p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                        {DEMO_USERS.map(demo => {
                          const isActiveLoading = isLoading && staffEmail === demo.email;
                          return (
                            <button
                              key={demo.id}
                              type="button"
                              onClick={() => handleQuickDemoSubmit(demo)}
                              disabled={isLoading}
                              className="w-full text-left p-3.5 bg-white hover:bg-slate-50/80 border border-slate-200/80 hover:border-blue-400 rounded-xl shadow-sm transition-all flex items-center justify-between gap-3 group relative overflow-hidden"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <img src={demo.avatar} alt={demo.displayName} className="w-9 h-9 rounded-lg object-cover border border-slate-100 shrink-0" />
                                <div className="min-w-0 space-y-0.5">
                                  <p className="text-xs font-black text-slate-900 truncate leading-tight">{demo.displayName}</p>
                                  <div className="text-[9px] text-slate-500 font-semibold space-y-0.5 leading-none">
                                    <div className="text-[9px] font-black text-blue-600 uppercase tracking-tight">
                                      Role: {demo.role === 'pt' ? 'Physical Therapist' : demo.role}
                                    </div>
                                    <div className="truncate text-slate-500">Email: <strong className="text-slate-800 font-bold">{demo.email}</strong></div>
                                    <div className="text-slate-500">Passcode: <strong className="text-blue-700 font-bold">12345123</strong></div>
                                  </div>
                                </div>
                              </div>
                              <div className="text-slate-400 group-hover:text-blue-600 transition-colors shrink-0">
                                {isActiveLoading ? (
                                  <div className="w-4 h-4 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
                                ) : (
                                  <div className="p-1 rounded-full bg-slate-50 border border-slate-100 group-hover:bg-blue-50">
                                    <ChevronRight className="w-3.5 h-3.5" />
                                  </div>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="relative flex items-center justify-center my-4">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200" />
                      </div>
                      <span className="relative px-3 bg-white text-[9px] font-extrabold uppercase tracking-widest text-[#A19F9D]">
                        Or Use Custom Credentials
                      </span>
                    </div>

                    <label className="block text-[11px] font-black uppercase tracking-widest text-[#A19F9D]">
                      Select Your Clinic
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <select
                        value={selectedClinic}
                        onChange={(e) => setSelectedClinic(e.target.value)}
                        className="w-full pl-10 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 appearance-none text-slate-900 text-sm font-bold shadow-sm"
                      >
                        {CLINICS.map(clinic => (
                          <option key={clinic.id} value={clinic.id}>
                            {clinic.label} — {clinic.location}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      onClick={advanceStep}
                      className="w-full flex items-center justify-center gap-1.5 py-3.5 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-sm"
                    >
                      Continue with Manual Credentials
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Step 2: Identification Choice */}
                {currentStep === 2 && (
                  <div className="space-y-4">
                    <label className="block text-[11px] font-black uppercase tracking-widest text-[#A19F9D]">
                      Provider Identification Method
                    </label>

                    <div className="grid grid-cols-3 gap-2">
                      {PROVIDER_IDENTIFICATIONS.map(method => (
                        <button
                          key={method.id}
                          type="button"
                          onClick={() => setStaffIdMethod(method.id as any)}
                          className={`p-3 border rounded-xl flex flex-col items-center justify-center gap-1.5 text-center transition-all ${
                            staffIdMethod === method.id
                              ? 'border-blue-600 bg-blue-50/50 text-blue-700 font-extrabold shadow-sm'
                              : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                          }`}
                        >
                          {method.icon}
                          <span className="text-[10px] tracking-tight">{method.label}</span>
                        </button>
                      ))}
                    </div>

                    <div className="pt-2">
                      {staffIdMethod === 'email' && (
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-600">Email Address</label>
                          <input
                            type="email"
                            value={staffEmail}
                            onChange={(e) => setStaffEmail(e.target.value)}
                            placeholder="username@careplus.local"
                            className="w-full pl-4 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 text-slate-900 text-sm font-bold shadow-sm"
                          />
                        </div>
                      )}

                      {staffIdMethod === 'providerId' && (
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-600">Badge / Provider Number</label>
                          <input
                            type="text"
                            value={staffBadge}
                            onChange={(e) => setStaffBadge(e.target.value)}
                            placeholder="e.g. NPI-19827364-MD"
                            className="w-full pl-4 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 text-slate-900 text-sm font-bold shadow-sm animate-fade"
                          />
                        </div>
                      )}

                      {staffIdMethod === 'sso' && (
                        <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl text-center space-y-3 animate-fade">
                          <p className="text-xs text-slate-500 font-medium">Verify credentials securely via OAuth Provider SSO.</p>
                          <button
                            type="button"
                            onClick={() => {
                              setIsLoading(true);
                              setTimeout(() => {
                                setIsLoading(false);
                                setStaffEmail("sarah.chen@careplus.local");
                                advanceStep();
                              }, 1200);
                            }}
                            className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 inline-flex items-center gap-1.5 shadow-sm transition-colors"
                          >
                            <ShieldCheck className="w-4 h-4 text-blue-600" />
                            Log In with Corporate SSO (Demo Auto-Fill)
                          </button>
                        </div>
                      )}
                    </div>

                    {staffIdMethod !== 'sso' && (
                      <button
                        onClick={advanceStep}
                        className="w-full flex items-center justify-center gap-1.5 py-3.5 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-sm"
                      >
                        Continue
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}

                {/* Step 3: Verify Identity Credentials */}
                {currentStep === 3 && (
                  <div className="space-y-4">
                    <label className="block text-[11px] font-black uppercase tracking-widest text-[#A19F9D]">
                      Verify Identity
                    </label>

                    {/* Standard password field */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600">Verification Key / Password</label>
                      <input
                        type="password"
                        value={staffPassword}
                        onChange={(e) => setStaffPassword(e.target.value)}
                        placeholder="Enter password (e.g. 12345123)"
                        className="w-full pl-4 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 text-slate-900 text-sm font-bold shadow-sm"
                      />
                    </div>

                    <button
                      onClick={advanceStep}
                      className="w-full flex items-center justify-center gap-1.5 py-3.5 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-sm"
                    >
                      Continue
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Step 4: Role Selection & Demo Accounts */}
                {currentStep === 4 && (
                  <div className="space-y-4">
                    <label className="block text-[11px] font-black uppercase tracking-widest text-[#A19F9D]">
                      Select Your Corporate Role
                    </label>
                    <select
                      value={selectedStaffRole}
                      onChange={(e) => setSelectedStaffRole(e.target.value)}
                      className="w-full pl-4 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 text-slate-900 text-sm font-bold shadow-sm"
                    >
                      <option value="clinician">Clinician (Physician)</option>
                      <option value="nurse">Nurse</option>
                      <option value="admin">Administrator</option>
                      <option value="pt">Physical Therapist (Allied Health)</option>
                    </select>

                    <div className="border-t border-slate-100 pt-3">
                      <span className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                        💡 Quick Select - Active Demo Profiles
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        {DEMO_USERS.map(demo => (
                          <div
                            key={demo.id}
                            className="p-2.5 bg-white hover:bg-slate-50/50 border border-slate-200 rounded-xl relative group"
                          >
                            <div className="flex gap-2">
                              <img src={demo.avatar} alt={demo.displayName} className="w-7 h-7 rounded-lg object-cover" />
                              <div className="min-w-0">
                                <p className="text-[11px] font-bold text-slate-900 truncate">{demo.displayName}</p>
                                <p className="text-[9px] font-bold text-blue-600 uppercase tracking-tight">{demo.role}</p>
                              </div>
                            </div>
                            
                            {/* Visual choices */}
                            <div className="mt-2 flex gap-1 justify-end">
                              <button
                                type="button"
                                onClick={() => handleQuickDemoClick(demo)}
                                className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[8px] font-extrabold uppercase tracking-widest rounded transition-colors"
                              >
                                Populate
                              </button>
                              <button
                                type="button"
                                onClick={() => handleQuickDemoSubmit(demo)}
                                className="px-1.5 py-0.5 bg-blue-600 hover:bg-blue-700 text-white text-[8px] font-extrabold uppercase tracking-widest rounded transition-colors"
                              >
                                Direct Login
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={executeStaffLogin}
                      disabled={isLoading}
                      className="w-full flex items-center justify-center gap-1.5 py-3.5 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-sm"
                    >
                      {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          Initialize Secure Session
                          <ChevronRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* 3. PATIENT WORKFLOW (PATIENT PORTAL) */}
            {activeFlow === 'patient' && (
              <motion.div
                key="patient-flow"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <button
                    onClick={navigateBackFlow}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                  </button>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                    Step {currentStep} of 3
                  </span>
                </div>

                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <span>{THEMES.patient.icon}</span> Patient Portal Login
                  </h3>
                  <p className="text-xs font-semibold text-slate-500 mt-1">Access your clinical logs and appointments</p>
                </div>

                {/* Progress Indicators */}
                <div className="flex gap-1.5">
                  {[1, 2, 3].map(s => (
                    <div 
                      key={s} 
                      className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                        s < currentStep 
                          ? 'bg-emerald-600' 
                          : s === currentStep 
                          ? 'bg-emerald-400 animate-pulse' 
                          : 'bg-slate-200'
                      }`} 
                    />
                  ))}
                </div>

                {/* Step 1: Contact Method */}
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <label className="block text-[11px] font-black uppercase tracking-widest text-[#A19F9D]">
                      How would you like to sign in?
                    </label>

                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setPatientContactMethod('email')}
                        className={`p-3 border rounded-xl flex flex-col items-center justify-center gap-1 text-center transition-all ${
                          patientContactMethod === 'email'
                            ? 'border-emerald-600 bg-emerald-50/50 text-emerald-700 font-extrabold shadow-sm'
                            : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        <Mail className="w-4 h-4" />
                        <span className="text-[10px] tracking-tight">Email</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPatientContactMethod('phone')}
                        className={`p-3 border rounded-xl flex flex-col items-center justify-center gap-1 text-center transition-all ${
                          patientContactMethod === 'phone'
                            ? 'border-emerald-600 bg-emerald-50/50 text-emerald-700 font-extrabold shadow-sm'
                            : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        <Phone className="w-4 h-4" />
                        <span className="text-[10px] tracking-tight">Phone</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPatientContactMethod('medicalId')}
                        className={`p-3 border rounded-xl flex flex-col items-center justify-center gap-1 text-center transition-all ${
                          patientContactMethod === 'medicalId'
                            ? 'border-emerald-600 bg-emerald-50/50 text-emerald-700 font-extrabold shadow-sm'
                            : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span className="text-[10px] tracking-tight">MRN Code</span>
                      </button>
                    </div>

                    <div className="pt-2 gap-1.5 flex flex-col">
                      <label className="text-xs font-semibold text-slate-600">
                        {patientContactMethod === 'email' ? 'Email Address' : patientContactMethod === 'phone' ? 'Phone Number' : 'Medical Record Number (MRN)'}
                      </label>
                      <input
                        type="text"
                        value={patientContactValue}
                        onChange={(e) => setPatientContactValue(e.target.value)}
                        placeholder={patientContactMethod === 'email' ? 'm.everett@personal.com' : patientContactMethod === 'phone' ? '(555) 123-4567' : 'MRN-1089456'}
                        className="w-full pl-4 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10 text-slate-900 text-sm font-bold shadow-sm"
                      />
                      
                      <button
                        type="button"
                        onClick={() => setPatientContactValue('m.everett@personal.com')}
                        className="text-[10px] text-emerald-600 hover:underline inline-block text-left w-fit"
                      >
                        💡 Use Demo Patient (Marcus Everett)
                      </button>
                    </div>

                    <button
                      onClick={advanceStep}
                      className="w-full flex items-center justify-center gap-1.5 py-3.5 rounded-xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-sm"
                    >
                      Continue
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Step 2: Password credentials setup */}
                {currentStep === 2 && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="block text-[11px] font-black uppercase tracking-widest text-[#A19F9D]">
                        Setup Portal Password
                      </label>
                      <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-600">
                        <input
                          type="checkbox"
                          checked={patientPasswordless}
                          onChange={(e) => setPatientPasswordless(e.target.checked)}
                          className="rounded text-emerald-600 border-slate-300 focus:ring-emerald-500/20"
                        />
                        Sign in Passwordless
                      </label>
                    </div>

                    {!patientPasswordless ? (
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-600">Secure Password</label>
                          <input
                            type="password"
                            value={patientPassword}
                            onChange={(e) => setPatientPassword(e.target.value)}
                            placeholder="Type a new password"
                            className="w-full pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-xl focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10 text-slate-900 text-sm font-bold shadow-sm"
                          />
                        </div>

                        {/* Real-time Validation Checks Grid */}
                        <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs space-y-1.5 font-medium">
                          <p className="text-slate-500 font-bold mb-1 text-[10px] uppercase tracking-wider">Password Requirements</p>
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <div className={`w-4 h-4 rounded-full flex items-center justify-center ${passLengthOk ? 'bg-emerald-100' : 'bg-slate-200'}`}>
                              <Check className={`w-2.5 h-2.5 ${passLengthOk ? 'text-emerald-700' : 'text-slate-400'}`} />
                            </div>
                            <span className={passLengthOk ? 'text-emerald-800' : ''}>At least 8 characters long</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <div className={`w-4 h-4 rounded-full flex items-center justify-center ${passUpperOk ? 'bg-emerald-100' : 'bg-slate-200'}`}>
                              <Check className={`w-2.5 h-2.5 ${passUpperOk ? 'text-emerald-700' : 'text-slate-400'}`} />
                            </div>
                            <span className={passUpperOk ? 'text-emerald-800' : ''}>At least 1 uppercase letter</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <div className={`w-4 h-4 rounded-full flex items-center justify-center ${passNumOk ? 'bg-emerald-100' : 'bg-slate-200'}`}>
                              <Check className={`w-2.5 h-2.5 ${passNumOk ? 'text-emerald-700' : 'text-slate-400'}`} />
                            </div>
                            <span className={passNumOk ? 'text-emerald-800' : ''}>At least 1 number digit (0-9)</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <div className={`w-4 h-4 rounded-full flex items-center justify-center ${passSpecialOk ? 'bg-emerald-100' : 'bg-slate-200'}`}>
                              <Check className={`w-2.5 h-2.5 ${passSpecialOk ? 'text-emerald-700' : 'text-slate-400'}`} />
                            </div>
                            <span className={passSpecialOk ? 'text-emerald-800' : ''}>At least 1 special character (e.g. @, #)</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-xl text-xs font-semibold leading-normal">
                        📲 Passwordless configuration is active. Completing the questions next is sufficient for login!
                      </div>
                    )}

                    <button
                      onClick={advanceStep}
                      className="w-full flex items-center justify-center gap-1.5 py-3.5 rounded-xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-sm"
                    >
                      Continue
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Step 3: Security Questions */}
                {currentStep === 3 && (
                  <div className="space-y-4">
                    <label className="block text-[11px] font-black uppercase tracking-widest text-[#A19F9D]">
                      Security Questions (Optional Verification)
                    </label>

                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-600">Select Question</label>
                        <select
                          value={selectedSecurityQuestion}
                          onChange={(e) => setSelectedSecurityQuestion(e.target.value)}
                          className="w-full text-xs font-bold pl-3 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10 text-slate-900 shadow-sm"
                        >
                          {SECURITY_QUESTIONS.map(q => (
                            <option key={q} value={q}>{q}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-600">Your Answer</label>
                        <input
                          type="text"
                          value={securityAnswer}
                          onChange={(e) => setSecurityAnswer(e.target.value)}
                          placeholder="Type your secure answer"
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10 text-slate-900 text-sm font-semibold shadow-sm"
                        />
                      </div>
                    </div>

                    <button
                      onClick={executePatientLogin}
                      disabled={isLoading}
                      className="w-full flex items-center justify-center gap-1.5 py-3.5 rounded-xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-sm"
                    >
                      {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          Authenticate Patient Wallet
                          <ChevronRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* 4. GUEST FLOW */}
            {activeFlow === 'guest' && (
              <motion.div
                key="guest-flow"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.25 }}
                className="space-y-6 animate-fade"
              >
                <div className="flex items-center">
                  <button
                    onClick={() => setActiveFlow('welcome')}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                  </button>
                </div>

                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <span>{THEMES.guest.icon}</span> Guest / Demo Access
                  </h3>
                  <p className="text-xs font-semibold text-slate-500 mt-1">Explore CarePlus without logging in</p>
                </div>

                {/* Marcus Johnson Custom Patient Card */}
                <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-start gap-4">
                  <img
                    src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop"
                    alt="Marcus Johnson"
                    className="w-16 h-16 rounded-xl object-cover border border-slate-200"
                  />
                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-slate-900">Marcus Johnson</h4>
                    <p className="text-xs text-slate-500 font-bold">DOB: <span className="font-mono text-slate-700">1965-03-15</span></p>
                    <p className="text-xs text-slate-500 font-bold">MRN: <span className="font-mono text-slate-700">MRN-1089456</span></p>
                    <div className="inline-block px-2.5 py-0.5 bg-violet-50 border border-violet-100 text-violet-700 rounded-full text-[10px] font-bold mt-1">
                      Rheumatoid Arthritis
                    </div>
                  </div>
                </div>

                {/* Restrictions Column Block */}
                <div className="space-y-2">
                  <span className="block text-[10px] font-black uppercase tracking-widest text-[#A19F9D]">
                    Restricted Access Scope
                  </span>
                  <div className="p-4 bg-violet-50/50 border border-violet-100 rounded-xl space-y-2 text-xs font-semibold text-violet-950">
                    <div className="flex items-center gap-2">
                      <span className="text-red-500 font-extrabold text-sm">❌</span>
                      <span>No direct clinical Messaging services</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-red-500 font-extrabold text-sm">❌</span>
                      <span>No active booking of appointments</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-red-500 font-extrabold text-sm">❌</span>
                      <span>No data downloads or local saves</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-600 font-extrabold text-sm">👁️</span>
                      <span>Read-only system diagnostics preview</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={executeGuestLogin}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-1.5 py-3.5 rounded-xl font-bold text-sm text-white bg-violet-600 hover:bg-violet-700 transition-all shadow-sm"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Initialize Guest Demo Mode
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </motion.div>
            )}

          </AnimatePresence>

          {/* Feedback or error message boxes */}
          {errorStatus && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 p-4 bg-red-50 text-red-700 border border-red-100 text-xs font-bold rounded-2xl shadow-sm"
            >
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>{errorStatus}</div>
            </motion.div>
          )}

          {/* SIMULATION AND TESTING DEV DRAWER */}
          <div className="border-t border-slate-200 pt-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#A19F9D] flex items-center gap-1">
                <Settings className="w-3.5 h-3.5 text-slate-400" />
                Compliance & Error Simulator
              </span>
              <button
                type="button"
                onClick={() => {
                  setErrorStatus('');
                  setFailedLoginCount(0);
                  setIsLockedOut(false);
                }}
                className="text-[9px] text-blue-600 font-black hover:underline uppercase flex items-center gap-0.5"
                title="Reset all simulated lockouts"
              >
                <RefreshCcw className="w-2.5 h-2.5" /> Clean Sandbox
              </button>
            </div>
            
            <p className="text-[10px] text-slate-400 font-medium leading-normal">
              Click to instantly trigger and audit exact error payloads specified inside the system config:
            </p>

            <div className="grid grid-cols-2 gap-1.5 text-[9px] font-black uppercase tracking-wider">
              <button
                type="button"
                onClick={() => setErrorStatus(ERRORS_LIST.invalidCredentials)}
                className="py-1 px-2 border border-slate-200 bg-white hover:bg-slate-50 rounded text-left text-slate-700 truncate"
              >
                ⚠️ Invalid Key
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsLockedOut(true);
                  setErrorStatus(ERRORS_LIST.accountLocked);
                }}
                className="py-1 px-2 border border-slate-200 bg-white hover:bg-slate-50 rounded text-left text-slate-700 truncate"
              >
                🔒 Lockout (5 Fails)
              </button>
              <button
                type="button"
                onClick={() => setErrorStatus(ERRORS_LIST.sessionExpired)}
                className="py-1 px-2 border border-slate-200 bg-white hover:bg-slate-50 rounded text-left text-slate-700 truncate"
              >
                ⏳ Expired Session
              </button>
              <button
                type="button"
                onClick={() => setErrorStatus(ERRORS_LIST.networkError)}
                className="py-1 px-2 border border-slate-200 bg-white hover:bg-slate-50 rounded text-left text-slate-700 truncate"
              >
                🌐 Network Offline
              </button>
              <button
                type="button"
                onClick={() => setErrorStatus(ERRORS_LIST.clinicMismatch)}
                className="py-1 px-2 border border-slate-200 bg-white hover:bg-slate-50 rounded text-left text-slate-700 truncate"
              >
                🏥 Clinic Mismatch
              </button>
              <button
                type="button"
                onClick={() => setErrorStatus(ERRORS_LIST.unauthorizedRole)}
                className="py-1 px-2 border border-slate-200 bg-white hover:bg-slate-50 rounded text-left text-slate-700 truncate"
              >
                🚫 Role Unauthorized
              </button>
            </div>
          </div>

          <div className="text-center pt-2">
            <p className="text-[9px] text-[#A19F9D] leading-relaxed font-bold">
              Notice: This system environment is audited under federal clinical standards. HIPAA Section 164.312 applies.
            </p>
          </div>

        </div>

        {/* Footer Links */}
        <div className="md:absolute md:bottom-6 md:left-12 md:right-12 flex flex-wrap justify-center gap-6 mt-12 md:mt-0 text-[9px] font-black uppercase tracking-widest text-slate-400">
          <a href="#" className="hover:text-slate-600 transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-slate-600 transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-slate-600 transition-colors">Compliance Audit</a>
        </div>

      </div>

    </div>

  </div>
  );
}
