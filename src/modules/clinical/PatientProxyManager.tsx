import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, UserPlus, ShieldCheck, Trash2, Search, Loader2, Lock, ShieldAlert
} from 'lucide-react';
import { doc, onSnapshot, getDocs, collection } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { updateAuthorizedUsers } from '../../services/clinicalFirestoreService';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';

interface PatientProxyManagerProps {
  patientId: string;
}

export function PatientProxyManager({ patientId }: PatientProxyManagerProps) {
  const { userProfile } = useCurrentUser();
  const [authorizedIds, setAuthorizedIds] = useState<string[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const isAdminOrStaff = useMemo(() => {
    if (!userProfile) return false;
    return ['admin', 'clinician', 'nurse', 'front_desk'].includes(userProfile.role);
  }, [userProfile]);

  // Fetch live Patient document authorizedUserIds
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'patients', patientId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setAuthorizedIds(data.authorizedUserIds || []);
      }
      setIsLoading(false);
    }, (error) => {
      console.error("Error subscribing to patient proxies:", error);
      setIsLoading(false);
    });
    return unsub;
  }, [patientId]);

  // Fetch all registered users for proxy candidates lookup
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'users'));
        const usersList = snapshot.docs.map(uDoc => {
          const d = uDoc.data();
          return {
            id: uDoc.id,
            name: d.displayName || d.email || 'Registered User',
            email: d.email || '',
            role: d.role || 'patient'
          };
        });
        setAllUsers(usersList);
      } catch (err) {
        console.error("Error loading users for proxy assignment:", err);
      }
    };
    fetchUsers();
  }, []);

  const currentProxies = useMemo(() => {
    return authorizedIds.map(uid => {
      const match = allUsers.find(u => u.id === uid);
      return {
        id: uid,
        name: match?.name || `User (${uid.substring(0, 6)}...)`,
        email: match?.email || 'N/A',
        role: match?.role || 'patient'
      };
    });
  }, [authorizedIds, allUsers]);

  const candidateUsers = useMemo(() => {
    return allUsers.filter(u => 
      !authorizedIds.includes(u.id) && 
      (u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
       u.email.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [allUsers, authorizedIds, searchQuery]);

  const handleAddProxy = async (userId: string) => {
    setActionLoading(userId);
    const newIds = [...authorizedIds, userId];
    try {
      await updateAuthorizedUsers(patientId, newIds);
      toast.success("Authorized user/proxy added successfully");
      setIsAdding(false);
      setSearchQuery('');
    } catch (err) {
      console.error(err);
      toast.error("Security: Failed to add proxy");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveProxy = async (userId: string) => {
    setActionLoading(userId);
    const newIds = authorizedIds.filter(id => id !== userId);
    try {
      await updateAuthorizedUsers(patientId, newIds);
      toast.success("Proxy authorization revoked successfully");
    } catch (err) {
      console.error(err);
      toast.error("Security: Failed to revoke proxy");
    } finally {
      setActionLoading(null);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 bg-white rounded-xl border border-[#EDEBE9] flex justify-center items-center h-48">
        <Loader2 className="h-6 w-6 animate-spin text-[#0078D4]" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-[#EDEBE9] shadow-sm flex flex-col overflow-hidden h-full">
      <div className="p-4 bg-[#FAFAFA] border-b border-[#EDEBE9] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-[#0078D4]" />
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-[#242424] leading-normal">Surrogate & Proxy Access</h3>
            <p className="text-[10px] text-[#616161]">Authorized patient portals & parental links</p>
          </div>
        </div>
        
        {isAdminOrStaff && !isAdding && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsAdding(true)}
            className="h-7 text-[10px] font-black uppercase text-[#0078D4] hover:bg-[#DEECF9]/50"
          >
            <UserPlus className="h-3 w-3 mr-1" /> Add Proxy
          </Button>
        )}
      </div>

      <div className="p-4 flex-1 overflow-y-auto max-h-[250px] space-y-3">
        {isAdding ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#0078D4]">Search Registered Users</span>
              <button 
                onClick={() => { setIsAdding(false); setSearchQuery(''); }}
                className="text-[10px] font-bold text-[#616161] hover:text-[#242424]"
              >
                Cancel
              </button>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-[#616161]" />
              <input 
                type="text" 
                placeholder="Find users by name or email..." 
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-[#EDEBE9] rounded outline-none bg-sky-50/20 focus:border-[#0078D4] font-medium"
                value={searchQuery}
                aria-label="Find registered users"
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="max-h-[150px] overflow-y-auto divide-y divide-[#F0F0F0] border border-[#EDEBE9] rounded-md bg-white">
              {candidateUsers.length === 0 ? (
                <p className="p-4 text-center text-xs text-[#A19F9D] italic">No candidate users found</p>
              ) : (
                candidateUsers.map(user => (
                  <div key={user.id} className="p-2 flex items-center justify-between hover:bg-[#F9F9F9] transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-[#242424] truncate">{user.name}</p>
                      <p className="text-[9px] text-[#616161] truncate">{user.email} • {user.role}</p>
                    </div>
                    {actionLoading === user.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-[#0078D4]" />
                    ) : (
                      <button 
                        onClick={() => handleAddProxy(user.id)}
                        className="text-[10px] font-black uppercase tracking-widest text-[#0078D4] hover:underline shrink-0"
                      >
                        Grant
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {currentProxies.length === 0 ? (
              <div className="p-6 justify-center flex flex-col items-center border border-dashed border-[#EDEBE9] rounded-xl text-center">
                <Lock className="h-5 w-5 text-[#A19F9D] mb-1.5" />
                <p className="text-[11px] font-bold text-[#616161]">No proxy entities authorized</p>
                <p className="text-[9px] text-[#A19F9D]">This record is only readable by clinical care team members and linked profile matches.</p>
              </div>
            ) : (
              currentProxies.map(proxy => (
                <div key={proxy.id} className="flex items-center justify-between p-2.5 bg-[#FAFAFA] hover:bg-[#F3F2F1] rounded-xl border border-[#EDEBE9] transition-all group">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-[#242424] flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 inline shrink-0" />
                      <span className="truncate">{proxy.name}</span>
                    </p>
                    <p className="text-[10px] text-[#616161] truncate">{proxy.email}</p>
                    <p className="text-[8px] font-bold uppercase tracking-wider text-primary mt-0.5">{proxy.role === 'patient' ? 'Family/Proxy' : proxy.role}</p>
                  </div>
                  
                  {isAdminOrStaff && (
                    <button 
                      disabled={actionLoading === proxy.id}
                      onClick={() => handleRemoveProxy(proxy.id)}
                      className="text-muted-foreground hover:text-red-600 transition-colors h-7 w-7 rounded flex items-center justify-center hover:bg-red-50"
                      title="Revoke surrogate access"
                    >
                      {actionLoading === proxy.id ? (
                        <Loader2 className="h-4 w-4 animate-spin text-red-600" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
      
      <div className="bg-[#FAFAFA] border-t border-[#EDEBE9] p-2.5 px-4 flex items-center gap-2">
        <ShieldAlert className="h-3.5 w-3.5 text-emerald-600" />
        <span className="text-[9px] font-mono leading-none font-bold uppercase tracking-wide text-emerald-700">Governance Sync Active</span>
      </div>
    </div>
  );
}
