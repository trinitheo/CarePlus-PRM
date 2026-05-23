
import React, { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { User, Lock, AlertTriangle, ChevronRight, Activity } from 'lucide-react';
import { motion } from 'motion/react';
import { signInAnonymously } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { saveUserProfile } from '../services/clinicalFirestoreService';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

export function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [demoUsers, setDemoUsers] = useState<any[]>([]);

  useEffect(() => {
    authService.getDemoUsers().then(setDemoUsers);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please select a user to log in.");
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      // 1. Log in to demo system (LocalStorage)
      const demoUser = await authService.loginWithDemo(email);

      let finalUid = demoUser.id;
      try {
        // 2. Sign in to Firebase Auth anonymously so firestore works
        const cred = await signInAnonymously(auth);
        finalUid = cred.user.uid;
      } catch (authErr: any) {
        console.warn(
          'Firebase Auth anonymous sign-in failed (possibly sandbox, CORS, or network block). ' +
          'Proceeding with offline-first demo user context.',
          authErr
        );
      }
      
      // 3. Sync profile to Firestore so rules can see the role
      await saveUserProfile(finalUid, {
        ...demoUser,
        id: finalUid, // Override with real Firebase UID for rules to match
        originalId: demoUser.id
      });

      onLoginSuccess();
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
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
          <div className="mb-10">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Systems Login</h3>
            <p className="text-[#757370] text-sm font-medium">Access your personalized care environment.</p>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
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
                      <option value="">Select identity profile...</option>
                      {demoUsers.map(user => (
                        <option key={user.id} value={user.email}>
                          {user.displayName} — {user.role.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="group">
                  <div className="flex justify-between items-center mb-2">
                    <label htmlFor="password" className="block text-[11px] font-black uppercase tracking-widest text-[#A19F9D] group-focus-within:text-sky-600 transition-colors">
                      Verification Key
                    </label>
                    <button type="button" className="text-[10px] font-black uppercase tracking-widest text-sky-600 hover:text-sky-700">
                      Emergency Reset
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
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>
              
              {error && (
                <div className="flex items-start gap-3 p-4 bg-red-50 text-red-700 border border-red-100 text-xs font-bold rounded-xl animate-shake">
                   <AlertTriangle size={16} className="flex-shrink-0" />
                   <div>{error}</div>
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

              <div className="mt-12 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-px flex-1 bg-[#EDEBE9]" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#A19F9D]">Governance & Compliance</span>
                  <div className="h-px flex-1 bg-[#EDEBE9]" />
                </div>
                <p className="text-[10px] text-[#A19F9D] leading-relaxed font-bold text-center">
                  Notice: This enterprise environment is subject to real-time monitoring under institutional governance protocols. HIPAA Section 164.312 applies.
                </p>
              </div>
            </form>
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
