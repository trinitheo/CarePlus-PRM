import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  getDocs, 
  onSnapshot 
} from 'firebase/firestore';
import { db } from '../../../services/clinicalFirestoreService';
import { updateUserRole, AppRole } from '../../../services/rbacService';
import { Shield, User, Search, Save, History, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';

interface UserData {
  id: string;
  email: string;
  displayName: string;
  currentRole: AppRole;
}

export function RBACDashboard() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  useEffect(() => {
    // 1. Fetch all users from /users
    const fetchUsers = async () => {
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
            currentRole: rolesMap.get(doc.id) || data.role || 'read_only'
          });
        });
        
        setUsers(usersList);
      } catch (err) {
        console.error("Failed to fetch RBAC data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

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
                    <select 
                      value={user.currentRole}
                      disabled={isUpdating === user.id}
                      onChange={(e) => handleRoleChange(user.id, e.target.value as AppRole)}
                      className="bg-[#FAFAFA] border border-[#EDEBE9] rounded-lg px-3 py-1.5 text-xs font-bold text-[#242424] focus:ring-2 focus:ring-[#0078D4]/20 outline-none cursor-pointer"
                    >
                      <option value="admin">Administrator</option>
                      <option value="manager">Clinical Manager</option>
                      <option value="clinician">Clinician</option>
                      <option value="front_desk">Front Desk</option>
                      <option value="read_only">Read-Only Staff</option>
                    </select>
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
