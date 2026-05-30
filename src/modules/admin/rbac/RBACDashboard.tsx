import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  getDocs, 
  onSnapshot 
} from 'firebase/firestore';
import { db } from '../../../services/clinicalFirestoreService';
import { updateUserRole, updateUserPatientLink, AppRole } from '../../../services/rbacService';
import { mockDbService } from '../../../lib/mockDatabase';
import { Shield, User, Search, Save, History, Loader2, CheckCircle2, Database, Zap } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { SeedService, SeedProgress } from '../../../services/seedService';
import { toast } from 'sonner';

interface UserData {
  id: string;
  email: string;
  displayName: string;
  currentRole: AppRole;
  patientId?: string;
}

export function RBACDashboard() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedProgress, setSeedProgress] = useState<SeedProgress | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      const rolesSnap = await getDocs(collection(db, 'roles'));
      
      const rolesMap = new Map();
      rolesSnap.forEach(doc => {
        rolesMap.set(doc.id, doc.data().role);
      });

      const usersList: UserData[] = [];
      usersSnap.forEach(doc => {
        const data = doc.data();
        usersList.push({
          id: doc.id,
          email: data.email || '',
          displayName: data.displayName || 'Unknown User',
          currentRole: rolesMap.get(doc.id) || data.role || 'read_only',
          patientId: data.patientId || undefined
        });
      });
      
      setUsers(usersList);

      // Fetch patient charts for linkage dropdown
      let patientsList: any[] = [];
      try {
        const patientsSnap = await getDocs(collection(db, 'patients'));
        patientsSnap.forEach(pDoc => {
          const d = pDoc.data();
          patientsList.push({
            id: pDoc.id,
            name: d.name || `${d.firstName || ''} ${d.lastName || ''}`.trim() || pDoc.id
          });
        });
      } catch (err) {
        console.warn("Failed real firestore patient fetch in rbac panel, copying mock", err);
      }
      if (patientsList.length === 0) {
        const mockPatients = mockDbService.getCollection('patients');
        patientsList = mockPatients.map(p => ({
          id: p.id,
          name: p.name || `${p.firstName || ''} ${p.lastName || ''}`.trim() || p.id
        }));
      }
      setPatients(patientsList);

    } catch (err) {
      console.error("Failed to fetch RBAC data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRunSeed = async () => {
    if (!window.confirm("This will generate a neurosurgical clinical graph with 3 providers and 10 patients. Continue?")) return;
    
    setIsSeeding(true);
    try {
      await SeedService.seedCareNetwork((progress) => {
        setSeedProgress(progress);
      });
      toast.success("Graph Seeding Complete");
      await fetchUsers(); // Refresh the directory
    } catch (err) {
      console.error("Seeding failed", err);
      toast.error("Seeding operation failed");
    } finally {
      setIsSeeding(false);
      setSeedProgress(null);
    }
  };

  const handleRoleChange = async (userId: string, newRole: AppRole) => {
    setIsUpdating(userId);
    try {
      await updateUserRole(userId, newRole);
      // Update local state
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, currentRole: newRole } : u));
    } catch (err) {
      alert("Failed to update role. Ensure you have admin permissions.");
    } finally {
      setIsUpdating(null);
    }
  };

  const handlePatientLinkChange = async (userId: string, patientId: string | null) => {
    setIsUpdating(userId);
    try {
      await updateUserPatientLink(userId, patientId);
      // Update local state
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, patientId: patientId || undefined } : u));
      toast.success("Patient linkage updated successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update patient linkage");
    } finally {
      setIsUpdating(null);
    }
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(search.toLowerCase()) || 
    u.displayName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 font-segoe">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#242424] tracking-tight flex items-center gap-3">
            <Shield className="h-8 w-8 text-[#0078D4]" />
            Access Governance
          </h1>
          <p className="text-sm font-medium text-[#616161] mt-1">
            Maintain security integrity through centralized Role-Based Access Control
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            className="rounded-xl border-[#EDEBE9] bg-white text-xs font-black uppercase tracking-wider h-11 px-6 hover:bg-[#F3F2F1] transition-all flex items-center gap-2"
            onClick={handleRunSeed}
            disabled={isSeeding}
          >
            {isSeeding ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-[#0078D4]" />
                {seedProgress ? `${seedProgress.step} (${seedProgress.count}/${seedProgress.total})` : 'Initializing...'}
              </>
            ) : (
              <>
                <Database className="h-4 w-4 text-[#0078D4]" />
                Seed Graph Data
              </>
            )}
          </Button>
          <div className="bg-[#DEECF9] px-4 py-2 rounded-xl flex items-center gap-3 border border-[#CFE4FA]">
            <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
              <User className="h-4 w-4 text-[#0078D4]" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#0078D4]">Directory Size</p>
              <p className="text-sm font-black text-[#242424]">{users.length} Active Principals</p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#A19F9D]" />
        <input 
          type="text" 
          placeholder="Search by name or email..."
          className="w-full pl-12 pr-6 py-4 bg-white border border-[#EDEBE9] rounded-2xl shadow-sm focus:ring-2 focus:ring-[#0078D4]/20 focus:outline-none transition-all font-medium"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-3xl border border-[#EDEBE9] shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#FAFAFA] border-b border-[#EDEBE9]">
                <th className="px-6 py-4 text-left text-[11px] font-black uppercase tracking-widest text-[#616161]">Principal</th>
                <th className="px-6 py-4 text-left text-[11px] font-black uppercase tracking-widest text-[#616161]">Assigned Role</th>
                <th className="px-6 py-4 text-right text-[11px] font-black uppercase tracking-widest text-[#616161]">Governance Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F2F1]">
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#0078D4] mb-4" />
                    <p className="text-sm font-medium text-[#A19F9D]">Initializing Secure Directory...</p>
                  </td>
                </tr>
              ) : filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-[#FCFCFC] transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-[#F3F2F1] flex items-center justify-center font-black text-[#616161] group-hover:bg-[#DEECF9] group-hover:text-[#0078D4] transition-colors">
                        {user.displayName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-black text-[#242424]">{user.displayName}</p>
                        <p className="text-xs font-medium text-[#A19F9D]">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-2">
                      <select 
                        value={user.currentRole}
                        disabled={isUpdating === user.id}
                        onChange={(e) => handleRoleChange(user.id, e.target.value as AppRole)}
                        className="bg-[#FAFAFA] border border-[#EDEBE9] rounded-lg px-3 py-1.5 text-xs font-bold text-[#242424] focus:ring-2 focus:ring-[#0078D4]/20 outline-none cursor-pointer w-full max-w-[200px]"
                      >
                        <option value="admin">Administrator</option>
                        <option value="clinician">Clinician</option>
                        <option value="nurse">Nurse</option>
                        <option value="billing">Billing Specialist</option>
                        <option value="allied_health">Allied Health</option>
                        <option value="patient">Patient</option>
                        <option value="read_only">Read-Only Staff</option>
                      </select>
                      
                      {user.currentRole === 'patient' && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[10px] font-bold uppercase text-[#616161] tracking-wider whitespace-nowrap">Link Chart:</span>
                          <select
                            value={user.patientId || ''}
                            disabled={isUpdating === user.id}
                            onChange={(e) => handlePatientLinkChange(user.id, e.target.value || null)}
                            className="bg-sky-50 border border-sky-100 rounded px-2 py-1 text-[11px] font-bold text-[#0078D4] focus:ring-2 focus:ring-[#0078D4]/20 outline-none cursor-pointer w-full max-w-[200px]"
                          >
                            <option value="">-- Unlinked --</option>
                            {patients.map(p => (
                              <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <Button 
                         variant="ghost" 
                         size="sm" 
                         className="h-8 text-[11px] font-black uppercase tracking-wider text-[#A19F9D] hover:text-[#0078D4]"
                       >
                         <History className="h-3.5 w-3.5 mr-2" />
                         Audit
                       </Button>
                       {isUpdating === user.id ? (
                         <Loader2 className="h-4 w-4 animate-spin text-[#0078D4]" />
                       ) : (
                         <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100 text-[10px] font-black uppercase">
                            <CheckCircle2 className="h-3 w-3 mr-1.5" />
                            Synchronized
                         </Badge>
                       )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
