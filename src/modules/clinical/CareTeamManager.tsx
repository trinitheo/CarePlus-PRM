import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, UserPlus, ShieldAlert, X, Search, 
  Stethoscope, Activity, HeartHandshake, AlertCircle, Lock,
  ShieldCheck, Loader2, Trash2, Check, User
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { addToCareTeam, removeFromCareTeam } from '../../services/clinicalFirestoreService';
import { collection, onSnapshot, query, where, getDocs, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { CareTeamMember, UserRole, AlliedHealthSpecialty } from '../../types';
import { useCurrentUser } from '../../hooks/useCurrentUser';

const SPECIALTIES: AlliedHealthSpecialty[] = [
  'Physiotherapist', 'Psychologist', 'Physical Therapist', 
  'Speech Therapist', 'Medical assistant', 'Nursing assistant', 
  'Dietitian', 'Nutritionist', 'Optometrist'
];

interface CareTeamManagerProps {
  patientId: string;
}

export function CareTeamManager({ patientId }: CareTeamManagerProps) {
  const [members, setMembers] = useState<CareTeamMember[]>([]);
  const [patientName, setPatientName] = useState<string>('Patient');
  const { userProfile } = useCurrentUser();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // All registered system staff for lookup
  const [allStaff, setAllStaff] = useState<any[]>([]);

  // RBAC Assignment logic
  const isAdminUser = userProfile?.role === 'admin';
  const isPatient = userProfile?.role === 'patient';
  const myMember = members.find(m => m.userId === userProfile?.id);
  const canManageTeam = isAdminUser || (myMember?.accessLevel === 'clinical_full' && !isPatient);

  // Fetch Care Team dynamically from Firestore path
  useEffect(() => {
    const q = query(collection(db, `patients/${patientId}/care_teams`), where('status', '==', 'active'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMembers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CareTeamMember)));
      setIsLoading(false);
    }, (error) => {
      console.warn("CareTeamManager active care teams subscription error:", error);
      setIsLoading(false);
    });
    return unsubscribe;
  }, [patientId]);

  // Fetch Patient Name dynamically
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'patients', patientId), (docSnap) => {
      if (docSnap.exists()) {
        const d = docSnap.data();
        setPatientName(d.name || `${d.firstName || ''} ${d.lastName || ''}`.trim() || 'Patient');
      }
    }, (error) => {
      console.warn("CareTeamManager patient doc subscription error:", error);
    });
    return unsub;
  }, [patientId]);

  // Fetch list of non-patient users from systems registry when searching or panel is clicked
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const q = query(collection(db, 'users'), where('role', 'in', ['clinician', 'nurse', 'allied_health', 'admin']));
        const snapshot = await getDocs(q);
        const staffList = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || data.displayName || data.email || 'Staff Member',
            role: data.role || 'allied_health',
            department: data.department || data.specialty || (data.role === 'clinician' ? 'Internal Medicine' : 'Care Circle'),
            email: data.email,
            accessLevel: data.role === 'clinician' ? 'clinical_full' : 'clinical_limited'
          };
        });
        setAllStaff(staffList);
      } catch (e) {
        console.error("Error fetching clinician directory:", e);
      }
    };
    fetchStaff();
  }, []);

  const handleAdd = async (staff: any) => {
    setActionLoading(staff.id);
    setErrorMessage(null);
    try {
      await addToCareTeam(patientId, staff.id, {
        accessLevel: staff.role === 'clinician' || staff.role === 'admin' ? 'clinical_full' : 'clinical_limited',
        userRole: staff.role,
        userSpecialty: staff.department || undefined
      });
      setIsAdding(false);
      setSearchQuery('');
    } catch (e: any) {
      console.error(e);
      setErrorMessage(e.message?.includes('permission') ? 'Security: Access Denied' : (e.message || 'Sync error'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemove = async (memberId: string) => {
    setActionLoading(memberId);
    setErrorMessage(null);
    try {
      await removeFromCareTeam(patientId, memberId);
    } catch (e: any) {
      console.error(e);
      setErrorMessage(e.message?.includes('permission') ? 'Security: Access Denied' : 'Sync error: Removal failed');
    } finally {
      setActionLoading(null);
    }
  };

  // Safe subset directory that is not already on current care team. Filtered by live search query.
  const filteredStaffList = useMemo(() => {
    return allStaff.filter(
      staff => !members.some(m => m.userId === staff.id) &&
               staff.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allStaff, members, searchQuery]);

  // Map database entries to UI objects containing their displayed properties
  const displayTeam = useMemo(() => {
    return members.map(m => {
      // Find matches in existing directory lookup or create default fallback values
      const match = allStaff.find(s => s.id === m.userId);
      return {
        id: m.id,
        userId: m.userId,
        name: match?.name || m.userRole.replace('_', ' ').toUpperCase() || 'Assigned Staff',
        role: m.userRole as UserRole,
        department: match?.department || m.userSpecialty || (m.userRole === 'clinician' ? 'Clinical Staff' : 'Care Assistant'),
        accessLevel: m.accessLevel,
      };
    });
  }, [members, allStaff]);

  const getRoleBadge = (role: string) => {
    const formatted = role.toLowerCase();
    if (formatted === 'clinician') {
      return (
        <span className="flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-[9px] font-black uppercase tracking-widest leading-none">
          <Stethoscope size={11} className="shrink-0" /> Clinician
        </span>
      );
    } else if (formatted === 'nurse') {
      return (
        <span className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[9px] font-black uppercase tracking-widest leading-none">
          <Activity size={11} className="shrink-0" /> Nursing
        </span>
      );
    } else if (formatted === 'allied_health') {
      return (
        <span className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-[9px] font-black uppercase tracking-widest leading-none">
          <HeartHandshake size={11} className="shrink-0" /> Allied Health
        </span>
      );
    } else {
      return (
        <span className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[9px] font-black uppercase tracking-widest leading-none">
          <User size={11} className="shrink-0" /> Admin / Staff
        </span>
      );
    }
  };

  return (
    <div className="bg-white border border-[#EDEBE9] rounded-2xl shadow-sm overflow-hidden font-sans h-full flex flex-col">
      {/* Header */}
      <div className="p-5 border-b border-[#EDEBE9] bg-[#FAF9F8] flex justify-between items-start shrink-0">
        <div>
          <h3 className="text-sm font-black text-slate-900 tracking-widest uppercase flex items-center gap-2 mb-1">
            <Users size={16} className="text-sky-600" />
            Active Care Network
          </h3>
          <p className="text-xs font-medium text-slate-500">
            Managing access for <span className="font-bold text-slate-900">{patientName}</span>
          </p>
        </div>
        
        {canManageTeam ? (
          <button
            onClick={() => setIsAdding(!isAdding)}
            className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 cursor-pointer ${
              isAdding 
                ? 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-[#EDEBE9]' 
                : 'text-white bg-slate-900 hover:bg-black shadow-[0_4px_15px_rgb(15,23,42,0.15)] active:scale-[0.98]'
            }`}
          >
            {isAdding ? (
              <>Cancel</>
            ) : (
              <><UserPlus size={14} /> Assign Provider</>
            )}
          </button>
        ) : (
          <div className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500">
            <Lock size={12} /> Restricted
          </div>
        )}
      </div>

      {/* Main Roster Area */}
      <div className="p-5 flex-1 overflow-y-auto space-y-4">
        
        {errorMessage && (
          <div className="flex items-center gap-2 text-[10px] font-black uppercase text-[#A4262C] bg-[#FDE7E9] px-4 py-2 rounded-xl">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            {errorMessage}
          </div>
        )}

        {/* Add Provider Dropdown (Conditional) */}
        <AnimatePresence>
          {isAdding && canManageTeam && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 20 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="overflow-hidden shrink-0"
            >
              <div className="p-4 bg-sky-50 border border-sky-100 rounded-xl space-y-3">
                <div className="group">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-sky-400 group-focus-within:text-sky-600 transition-colors">
                      <Search size={16} strokeWidth={3} />
                    </div>
                    <input
                      type="text"
                      placeholder="Search Clinicians, Nurses, or allied staff by name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-white border border-sky-200 rounded-xl focus:ring-4 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-slate-900 text-sm font-semibold shadow-sm placeholder:text-slate-400"
                    />
                  </div>
                </div>
                
                <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                  {filteredStaffList.length > 0 ? (
                    filteredStaffList.map(staff => (
                      <div key={staff.id} className="flex items-center justify-between p-3 bg-white border border-sky-100 rounded-xl hover:border-sky-300 transition-colors">
                        <div>
                          <div className="text-sm font-bold text-slate-900">{staff.name}</div>
                          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">{staff.department}</div>
                        </div>
                        <div className="flex items-center gap-4">
                          {getRoleBadge(staff.role)}
                          <button
                            onClick={() => handleAdd(staff)}
                            disabled={actionLoading === staff.id}
                            className="text-[10px] font-black uppercase tracking-widest text-sky-600 hover:text-sky-800 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {actionLoading === staff.id ? (
                              <Loader2 className="h-3 w-3 animate-spin text-sky-600" />
                            ) : (
                              '+ Assign'
                            )}
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-xs font-bold text-slate-400">
                      No credentials match search parameters.
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Current Team List */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 opacity-30">
              <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
            </div>
          ) : displayTeam.length > 0 ? (
            <AnimatePresence mode="popLayout">
              {displayTeam.map((member, index) => (
                <motion.div
                  key={member.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex items-center justify-between p-4 bg-white border border-[#EDEBE9] rounded-xl hover:bg-slate-50 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 text-slate-500 font-bold">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-black text-slate-900">{member.name}</h4>
                        {index === 0 && (
                          <span className="text-[8px] font-black uppercase tracking-widest bg-slate-900 text-white px-1.5 py-0.5 rounded">Primary</span>
                        )}
                      </div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                        {member.department}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    {getRoleBadge(member.role)}
                    
                    {canManageTeam && index !== 0 ? (
                      <button
                        onClick={() => handleRemove(member.id)}
                        disabled={actionLoading === member.id}
                        className="text-slate-300 hover:text-rose-500 transition-colors p-1 cursor-pointer disabled:opacity-50"
                        title="Remove from Care Team"
                      >
                        {actionLoading === member.id ? (
                          <Loader2 className="h-4 w-4 animate-spin text-rose-500" />
                        ) : (
                          <X size={18} strokeWidth={3} />
                        )}
                      </button>
                    ) : (
                      <div className="w-6" /> // Spacer for alignment if no button
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center text-center p-6 space-y-4 bg-[#FAFAFA] rounded-2xl border border-dashed border-[#EDEBE9]">
              <Users className="h-10 w-10 text-[#BDBDBD] opacity-30" />
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-[#616161]">No Staff Assigned</p>
                <p className="text-[9px] font-bold text-[#A19F9D] mt-2 max-w-[180px]">All patient data currently locked to default admin access levels.</p>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* ABAC Compliance Footer */}
      <div className="p-4 bg-slate-50 border-t border-[#EDEBE9] flex items-start gap-3 shrink-0">
        <AlertCircle size={16} className="text-slate-400 mt-0.5 shrink-0" />
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
          ABAC Policy Active: Providers listed above are granted encrypted read/write access to this patient's clinical sub-collections (/clinical_records, /vitals, /procedures) in accordance with HIPAA minimum-necessary guidelines.
        </p>
      </div>
    </div>
  );
}
