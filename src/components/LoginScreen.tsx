
import React, { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { User, Lock, AlertTriangle, ChevronRight, Activity } from 'lucide-react';
import { motion } from 'motion/react';
import { signInAnonymously } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { saveUserProfile, resetAppToNewInstall } from '../services/clinicalFirestoreService';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

const AVATAR_PRESETS = [
  { url: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?q=80&w=200&auto=format&fit=crop', label: 'Doctor 1' },
  { url: 'https://images.unsplash.com/photo-1622253692010-333f2da60710?q=80&w=200&auto=format&fit=crop', label: 'Doctor 2' },
  { url: 'https://images.unsplash.com/photo-1537368910025-7003507965b6?q=80&w=200&auto=format&fit=crop', label: 'Nurse' },
  { url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop', label: 'Admin/Manager 1' },
  { url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop', label: 'Admin/Manager 2' },
  { url: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=200&auto=format&fit=crop', label: 'Patient' }
];

export function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [demoUsers, setDemoUsers] = useState<any[]>([]);

  // Registration Form States
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regRole, setRegRole] = useState('clinician');
  const [regAvatar, setRegAvatar] = useState(AVATAR_PRESETS[0].url);
  const [successMsg, setSuccessMsg] = useState('');

  const loadUsers = () => {
    authService.getDemoUsers().then(users => {
      setDemoUsers(users);
      if (users.length > 0 && !email) {
        // Pre-select first user if none selected
        setEmail(users[0].email);
      }
    });
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please select or enter a user identity.");
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      // 1. Log in to demo system (LocalStorage)
      const demoUser = await authService.loginWithDemo(email);

      // 2. Perform Firebase Auth & sync in the background to achieve zero UI-blocking delay
      signInAnonymously(auth).then(async (cred) => {
        const finalUid = cred.user.uid;
        await saveUserProfile(finalUid, {
          ...demoUser,
          id: finalUid, // Override with real Firebase UID for rules to match
          originalId: demoUser.id
        });
      }).catch(authErr => {
        console.warn(
          'Background Firebase Auth anonymous sign-in or sync failed. ' +
          'Proceeding with offline-first demo user context.',
          authErr
        );
      });

      // 3. Trigger immediate success callback
      onLoginSuccess();
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'An unknown error occurred.');
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim()) {
      setError("Please enter all required fields.");
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const newUser = await authService.registerUser(
        regName.trim(),
        regEmail.trim(),
        regRole as any,
        regAvatar
      );
      
      setSuccessMsg(`User "${newUser.displayName}" created successfully.`);
      setRegName('');
      setRegEmail('');
      setRegRole('clinician');
      setRegAvatar(AVATAR_PRESETS[0].url);
      
      // Select newly registered user immediately in the login screen
      setEmail(newUser.email);
      
      // Reload dropdown list
      await loadUsers();
      
      // Auto switch back to login mode after a short delay
      setTimeout(() => {
        setActiveTab('login');
        setSuccessMsg('');
      }, 1500);

    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Registry creation failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmergencyReset = async () => {
    if (window.confirm("Are you sure you want to completely clean and reset the application? This will safely remove all customized and seeded clinical users, roles, messages, patient charts, and schedules from the live database. The system will start completely fresh as a new install.")) {
      setIsLoading(true);
      setError('');
      try {
        await resetAppToNewInstall();
        window.location.reload();
      } catch (err: any) {
        setError('Failed to reset: ' + (err.message || err));
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-white overflow-hidden">
      {/* Left Pane - Hero Visualization */}
      <div className="hidden md:flex md:w-[60%] lg:w-[65%] relative bg-[#0A0D14] overflow-hidden group">
        <div className="absolute inset-0 z-0">
          <img 
            src="/src/assets/images/medical_hero_viz_1778841622513.png" 
            alt="Medical Visualization" 
            className="w-full h-full object-cover object-center opacity-80 transition-transform duration-[20s] ease-linear group-hover:scale-110"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#0A0D14]/10 to-[#0A0D14]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0D14] via-transparent to-transparent opacity-60" />
        </div>
        
        <div className="relative z-10 w-full h-full p-12 flex flex-col justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-500/20 rounded-lg backdrop-blur-md border border-sky-400/30">
              <Activity className="w-6 h-6 text-sky-400" />
            </div>
            <span className="text-xl font-black text-white tracking-widest uppercase italic">CarePlus <span className="text-sky-400">PRM</span></span>
          </div>

          <div className="max-w-xl">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <span className="inline-block py-1 px-3 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                Clinical Excellence Edition
              </span>
              <h2 className="text-5xl lg:text-6xl font-black text-white leading-[1.1] tracking-tight mb-6">
                Connected <span className="text-sky-500 italic">Systems</span> for Precision Care.
              </h2>
              <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-md">
                Experience the next evolution of practice management. Integrated diagnostics, AI-assisted coding, and seamless patient mapping in one workspace.
              </p>
            </motion.div>
          </div>

          <div className="flex items-center gap-8 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
            <div className="flex flex-col gap-1">
              <span className="text-slate-600 block">Security Tier</span>
              <span className="text-white">HIPAA Level 3</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-slate-600 block">Engine</span>
              <span className="text-white">Apex v4.2</span>
            </div>
            <div className="flex flex-col gap-1 border-l border-slate-800 pl-8">
              <span className="text-slate-600 block">Status</span>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-white">System Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Pane - Auth Form */}
      <div className="flex-1 flex flex-col justify-center px-8 lg:px-20 py-12 relative">
        {/* Mobile Header */}
        <div className="md:hidden text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-sky-600 shadow-lg shadow-sky-100 mb-4">
            <Activity className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">CarePlus <span className="text-sky-600">PRM</span></h1>
        </div>

        <div className="w-full max-w-[400px] mx-auto">
          {/* Dual Tab Switcher */}
          <div className="flex border-b border-[#EDEBE9] mb-8">
            <button
              onClick={() => { setActiveTab('login'); setError(''); }}
              className={`flex-1 pb-3 text-sm font-black uppercase tracking-wider text-center transition-all ${
                activeTab === 'login'
                  ? 'border-b-2 border-sky-600 text-sky-600'
                  : 'text-[#A19F9D] hover:text-slate-700'
              }`}
            >
              Session Login
            </button>
            <button
              onClick={() => { setActiveTab('register'); setError(''); }}
              className={`flex-1 pb-3 text-sm font-black uppercase tracking-wider text-center transition-all ${
                activeTab === 'register'
                  ? 'border-b-2 border-sky-600 text-sky-600'
                  : 'text-[#A19F9D] hover:text-slate-700'
              }`}
            >
              Add User
            </button>
          </div>

          <div className="mb-6">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
              {activeTab === 'login' ? 'Systems Login' : 'Register Identity'}
            </h3>
            <p className="text-[#757370] text-sm font-medium">
              {activeTab === 'login' 
                ? 'Access your personalized care environment.' 
                : 'Create and inject new user profile variables.'}
            </p>
          </div>
          
          <motion.div 
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'login' ? (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-4">
                  <div className="group">
                    <label htmlFor="user-select" className="block text-[11px] font-black uppercase tracking-widest text-[#A19F9D] mb-2 group-focus-within:text-sky-600 transition-colors">
                      Deployment Identity
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-sky-600 transition-colors">
                        <User size={18} strokeWidth={2.5} />
                      </div>
                      <select
                        id="user-select"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-11 pr-4 py-3.5 bg-[#FAF9F8] border border-[#EDEBE9] rounded-xl focus:ring-4 focus:ring-sky-500/10 focus:border-sky-600 transition-all appearance-none text-slate-900 text-sm font-bold"
                      >
                        {demoUsers.length === 0 ? (
                          <option value="">No profiles. Click "Add User" tab →</option>
                        ) : (
                          <>
                            <option value="">Select identity profile...</option>
                            {demoUsers.map(user => (
                              <option key={user.id} value={user.email}>
                                {user.displayName} — {user.role.toUpperCase()}
                              </option>
                            ))}
                          </>
                        )}
                      </select>
                    </div>
                    {demoUsers.length === 0 && (
                      <p className="text-xs text-amber-600 font-bold mt-2">
                        ⚠️ The live database has been cleared. Tap "Add User" to register administrative or clinical accounts instantly.
                      </p>
                    )}
                  </div>

                  <div className="group">
                    <div className="flex justify-between items-center mb-2">
                      <label htmlFor="password" className="block text-[11px] font-black uppercase tracking-widest text-[#A19F9D] group-focus-within:text-sky-600 transition-colors">
                        Verification Key
                      </label>
                      <button 
                        type="button" 
                        onClick={handleEmergencyReset}
                        className="text-[10px] font-black uppercase tracking-widest text-[#A19F9D] hover:text-red-600 transition-colors"
                      >
                        Reset Database
                      </button>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-sky-600 transition-colors">
                        <Lock size={18} strokeWidth={2.5} />
                      </div>
                      <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-11 pr-4 py-3.5 bg-[#FAF9F8] border border-[#EDEBE9] rounded-xl focus:ring-4 focus:ring-sky-500/10 focus:border-sky-600 transition-all text-slate-900 text-sm font-bold"
                        placeholder="Any bypass key allowed in offline demo"
                      />
                    </div>
                  </div>
                </div>
                
                {error && (
                  <div className="flex items-start gap-4 p-4 bg-red-50 text-red-700 border border-red-100 text-xs font-bold rounded-xl animate-shake">
                     <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                     <div>{error}</div>
                  </div>
                )}

                {successMsg && (
                  <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-100 text-xs font-bold rounded-xl flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                    {successMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading || !email}
                  className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-xl shadow-[0_8px_30px_rgb(14,165,233,0.1)] text-[12px] font-black uppercase tracking-widest text-white bg-sky-600 hover:bg-sky-700 hover:shadow-[0_12px_40px_rgb(14,165,233,0.2)] active:scale-[0.98] focus:ring-4 focus:ring-sky-500/20 disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none disabled:cursor-not-allowed transition-all"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Initialize Session
                      <ChevronRight size={18} strokeWidth={3} />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-[#A19F9D] mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full px-4 py-3 bg-[#FAF9F8] border border-[#EDEBE9] rounded-xl focus:ring-4 focus:ring-sky-500/10 focus:border-sky-600 transition-all text-slate-900 text-sm font-semibold"
                    placeholder="e.g. Dr. Jordan Mercer"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-[#A19F9D] mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-[#FAF9F8] border border-[#EDEBE9] rounded-xl focus:ring-4 focus:ring-sky-500/10 focus:border-sky-600 transition-all text-slate-900 text-sm font-semibold"
                    placeholder="e.g. j.mercer@careplus.ai"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-[#A19F9D] mb-1.5">
                    Institutional Role
                  </label>
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value)}
                    className="w-full px-4 py-3 bg-[#FAF9F8] border border-[#EDEBE9] rounded-xl focus:ring-4 focus:ring-sky-500/10 focus:border-sky-600 transition-all text-slate-900 text-sm font-bold"
                  >
                    <option value="admin">Admin (Full Control, Auditing)</option>
                    <option value="manager">Manager (Operations Controller)</option>
                    <option value="clinician">Clinician (Physician, Clinical Notes)</option>
                    <option value="nurse">Nurse (Vitals & Care Intake)</option>
                    <option value="billing">Billing Officer (CPT/ICD Invoices)</option>
                    <option value="allied_health">Allied Health (Physical/Dietary)</option>
                    <option value="patient">Patient (Personal Access Portal)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-[#A19F9D] mb-2">
                    Profile Avatar Preset
                  </label>
                  <div className="grid grid-cols-6 gap-2">
                    {AVATAR_PRESETS.map((preset) => (
                      <button
                        key={preset.url}
                        type="button"
                        onClick={() => setRegAvatar(preset.url)}
                        className={`relative rounded-xl overflow-hidden border-2 w-11 h-11 transition-all ${
                          regAvatar === preset.url
                            ? 'border-sky-600 scale-105 shadow-md shadow-sky-500/10'
                            : 'border-transparent hover:border-[#EDEBE9]'
                        }`}
                      >
                        <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                        {regAvatar === preset.url && (
                          <div className="absolute inset-0 bg-sky-600/10 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-sky-600" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-4 p-4 bg-red-50 text-red-700 border border-red-100 text-xs font-bold rounded-xl">
                     <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                     <div>{error}</div>
                  </div>
                )}

                {successMsg && (
                  <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-100 text-xs font-bold rounded-xl">
                     {successMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl text-[12px] font-black uppercase tracking-widest text-white bg-sky-600 hover:bg-sky-700 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Register Profile"
                  )}
                </button>
              </form>
            )}

            <div className="mt-10 space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-[#EDEBE9]" />
                <span className="text-[10px] font-black uppercase tracking-widest text-[#A19F9D]">Governance & Compliance</span>
                <div className="h-px flex-1 bg-[#EDEBE9]" />
              </div>
              <p className="text-[10px] text-[#A19F9D] leading-relaxed font-bold text-center">
                Notice: This enterprise environment is subject to real-time monitoring under institutional governance protocols. HIPAA Section 164.312 applies.
              </p>
            </div>
          </motion.div>
        </div>

        {/* Footer Links */}
        <div className="md:absolute md:bottom-8 md:left-20 md:right-20 flex flex-wrap justify-center gap-6 mt-12 md:mt-0">
          <a href="#" className="text-[10px] font-black uppercase tracking-widest text-[#A19F9D] hover:text-sky-600 transition-colors">Privacy Policy</a>
          <a href="#" className="text-[10px] font-black uppercase tracking-widest text-[#A19F9D] hover:text-sky-600 transition-colors">Terms of Service</a>
          <a href="#" className="text-[10px] font-black uppercase tracking-widest text-[#A19F9D] hover:text-sky-600 transition-colors">Security Report</a>
        </div>
      </div>
    </div>
  );
}
