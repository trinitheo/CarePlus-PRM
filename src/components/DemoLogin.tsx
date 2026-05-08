import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Shield, Stethoscope, Activity, HeartHandshake, 
  Settings, Landmark, User, ArrowRight, Loader2,
  Lock, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserRole, AlliedHealthSpecialty } from '../types';
import { auth } from '../lib/firebase';
import { signInAnonymously, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { saveUserProfile } from '../services/clinicalFirestoreService';
import { AlertCircle } from 'lucide-react';

const SPECIALTIES: AlliedHealthSpecialty[] = [
  'Physiotherapist', 'Psychologist', 'Physical Therapist', 
  'Speech Therapist', 'Medical assistant', 'Nursing assistant', 
  'Dietitian', 'Nutritionist', 'Optometrist'
];

const ROLES: { id: UserRole; label: string; icon: any; color: string; desc: string }[] = [
  { id: 'clinician', label: 'Clinician', icon: Stethoscope, color: '#107C10', desc: 'Full profile access, prescribing, and record creation.' },
  { id: 'nurse', label: 'Nurse', icon: Activity, color: '#0078D4', desc: 'Vitals, interactions, and limited record contribution.' },
  { id: 'allied_health', label: 'Allied Health', icon: HeartHandshake, color: '#5C2D91', desc: 'Specialized care tracking (PT, Psych, etc).' },
  { id: 'admin', label: 'Administrator', icon: Settings, color: '#D13438', desc: 'Full care team management and systemic overrides.' },
  { id: 'financial', label: 'Financial', icon: Landmark, color: '#666666', desc: 'Billing, claims, and insurance verification only.' },
  { id: 'patient', label: 'Patient', icon: User, color: '#FFB900', desc: 'View own health trends, medications, and messages.' },
];

export function DemoLogin() {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [specialty, setSpecialty] = useState<AlliedHealthSpecialty | ''>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const performProvisioning = async (userId: string, role: UserRole, specialtyStr?: string) => {
    // 1. Create User Profile
    await saveUserProfile(userId, {
      email: auth.currentUser?.email || `demo-${role}@precisionhealth.care`,
      displayName: auth.currentUser?.displayName || `${role.charAt(0).toUpperCase() + role.slice(1)} Demo`,
      role: role,
      specialty: specialtyStr || undefined,
      organizationId: 'org-demo-001',
      createdAt: new Date().toISOString(),
    });

    // 2. Add to Demo Patient Care Team (p-1) to ensure permission to write records
    // This is required for Day 1 "Make data real" functionality
    const { addToCareTeam } = await import('../services/clinicalFirestoreService');
    await addToCareTeam('p-1', userId, {
      accessLevel: role === 'admin' || role === 'clinician' ? 'clinical_full' : 'clinical_limited',
      userRole: role,
      userSpecialty: specialtyStr || undefined
    });
  };

  const handleSignIn = async (useGoogle = false) => {
    if (!selectedRole) return;
    setIsLoading(true);
    setError(null);
    try {
      let currentUser = auth.currentUser;
      
      if (!currentUser || useGoogle) {
        if (useGoogle) {
          const provider = new GoogleAuthProvider();
          const cred = await signInWithPopup(auth, provider);
          currentUser = cred.user;
        } else {
          try {
            const cred = await signInAnonymously(auth);
            currentUser = cred.user;
          } catch (e: any) {
            if (e.code === 'auth/admin-restricted-operation') {
              setError('ANONYMOUS_AUTH_DISABLED');
              setIsLoading(false);
              return;
            }
            throw e;
          }
        }
      }

      if (currentUser) {
        await performProvisioning(currentUser.uid, selectedRole, specialty || undefined);
        console.log('Demo profile provisioned for', selectedRole);
      }
    } catch (err: any) {
      console.error('Failed to provision demo account:', err);
      setError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#FAFAFA] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-4xl w-full"
      >
        <div className="grid md:grid-cols-5 gap-8 bg-white rounded-[32px] p-8 shadow-2xl shadow-[#000000]/5 border border-[#EDEBE9]">
          
          {/* Left: Branding & Info */}
          <div className="md:col-span-2 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-[#0078D4] rounded-xl flex items-center justify-center text-white">
                  <Shield className="h-6 w-6" />
                </div>
                <h1 className="text-xl font-black text-[#242424] tracking-tight uppercase">Precision Health</h1>
              </div>

              <div className="space-y-4">
                <h2 className="text-3xl font-black text-[#242424] leading-tight leading-none uppercase tracking-tighter">
                   Tiered Access<br />Simulation
                </h2>
                <p className="text-[13px] text-[#616161] leading-relaxed font-medium">
                  We are testing the HIPAA-compliant Tiered Access Control model. 
                  Choose a persona to simulate how the system adjusts information density 
                  and permissions based on professional scope.
                </p>
              </div>

              <div className="space-y-3">
                {[
                  "HIPAA Auditable Sessions",
                  "Verified Clinical Roles",
                  "Automated Care Team Scoping",
                  "Demographics Isolation"
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#107C10]" />
                    <span className="text-[11px] font-black uppercase text-[#616161] tracking-widest">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-8 border-t border-[#F3F2F1]">
              <div className="flex items-center gap-3 opacity-60">
                <div className="h-8 w-8 rounded-full bg-[#FAFAFA] border border-[#EDEBE9] flex items-center justify-center">
                  <Lock className="h-3.5 w-3.5 text-[#616161]" />
                </div>
                <p className="text-[10px] font-bold text-[#A19F9D] uppercase tracking-widest">Dev Sandbox Environment</p>
              </div>
            </div>
          </div>

          {/* Right: Role Selection */}
          <div className="md:col-span-3 flex flex-col min-h-[500px]">
            <Card className="flex-1 border-none bg-transparent shadow-none">
              <CardHeader className="px-0 pt-0">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="bg-[#FAFAFA] border-[#EDEBE9] text-[#616161] font-black uppercase tracking-widest text-[9px] px-3 py-1">
                    Phase 2: Authorization
                  </Badge>
                  <span className="text-[11px] font-bold text-[#A19F9D]">Step 01 of 02</span>
                </div>
                <CardTitle className="text-2xl font-black text-[#242424] mt-4 uppercase tracking-tighter">Choose Your Persona</CardTitle>
                <CardDescription className="text-xs font-medium">This will determine your access levels within the application.</CardDescription>
              </CardHeader>
              <CardContent className="px-0">
                <div className="grid grid-cols-2 gap-3 mt-4">
                  {ROLES.map((role) => (
                    <button
                      key={role.id}
                      onClick={() => {
                        setSelectedRole(role.id);
                        if (role.id !== 'allied_health') setSpecialty('');
                      }}
                      className={`relative flex flex-col text-left p-4 rounded-2xl border-2 transition-all group ${selectedRole === role.id ? 'border-[#0078D4] bg-[#F3F9FD] ring-4 ring-[#0078D4]/5' : 'border-[#F3F2F1] hover:border-[#BDBDBD] hover:bg-[#FAFAFA]'}`}
                    >
                      <div className={`h-10 w-10 flex items-center justify-center rounded-xl mb-3 ${selectedRole === role.id ? 'bg-[#0078D4] text-white shadow-lg shadow-[#0078D4]/20' : 'bg-[#FAFAFA] text-[#616161] border border-[#EDEBE9]'}`}>
                        <role.icon className="h-5 w-5" />
                      </div>
                      <h4 className="text-[13px] font-black text-[#242424] uppercase tracking-tight">{role.label}</h4>
                      <p className="text-[10px] text-[#616161] mt-1 font-medium leading-tight opacity-70">{role.desc}</p>
                      
                      {selectedRole === role.id && (
                        <motion.div 
                          layoutId="roleCheck"
                          className="absolute top-4 right-4"
                        >
                          <div className="h-5 w-5 rounded-full bg-[#107C10] text-white flex items-center justify-center">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          </div>
                        </motion.div>
                      )}
                    </button>
                  ))}
                </div>

                <AnimatePresence>
                  {selectedRole === 'allied_health' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="mt-6 p-4 bg-[#FAFAFA] rounded-2xl border border-[#EDEBE9] space-y-3"
                    >
                      <label className="text-[10px] font-black text-[#616161] uppercase tracking-widest">Select Specialty</label>
                      <div className="flex flex-wrap gap-2">
                        {SPECIALTIES.map((s) => (
                          <Button
                            key={s}
                            variant={specialty === s ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setSpecialty(s)}
                            className={`h-8 text-[10px] font-bold rounded-lg ${specialty === s ? 'bg-[#0078D4] border-none shadow-md shadow-[#0078D4]/20' : 'bg-white border-[#EDEBE9]'}`}
                          >
                            {s}
                          </Button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
              <CardFooter className="px-0 pt-6 flex flex-col gap-4">
                <AnimatePresence>
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="w-full bg-[#FFF4F4] border border-[#FDE7E9] rounded-xl p-3"
                    >
                      {error === 'ANONYMOUS_AUTH_DISABLED' ? (
                        <div className="space-y-2">
                          <div className="flex items-start gap-2 text-[#A4262C]">
                             <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                             <p className="text-[11px] font-bold leading-tight uppercase tracking-tight">
                               Anonymous Auth Disabled
                             </p>
                          </div>
                          <p className="text-[11px] text-[#616161] font-medium leading-relaxed">
                            To use guest personas, enable **Anonymous** in your <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" className="text-[#0078D4] underline">Firebase Console</a> (Auth &gt; Sign-in method).
                          </p>
                          <Button 
                            variant="outline" 
                            onClick={() => handleSignIn(true)}
                            className="w-full h-9 bg-white border-[#EDEBE9] text-[10px] font-black uppercase tracking-widest gap-2 shadow-sm"
                          >
                            Sign in with Google instead
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-[#A4262C]">
                          <AlertCircle className="h-4 w-4" />
                          <p className="text-[10px] font-bold uppercase tracking-tight">{error}</p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                <Button 
                  onClick={() => handleSignIn(false)}
                  disabled={!selectedRole || (selectedRole === 'allied_health' && !specialty) || isLoading}
                  className="w-full h-12 bg-[#242424] hover:bg-black text-white rounded-2xl font-black uppercase tracking-widest text-[12px] gap-2 shadow-xl shadow-black/10"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Enter Application
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
