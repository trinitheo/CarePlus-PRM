import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { ScrollArea } from '../../components/ui/scroll-area';
import { 
  Users, UserPlus, Shield, Clock, X, 
  Stethoscope, Activity, HeartHandshake, ShieldCheck,
  Search, ExternalLink, Trash2, Check, AlertCircle,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { addToCareTeam, removeFromCareTeam } from '../../services/clinicalFirestoreService';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { CareTeamMember, UserRole, AlliedHealthSpecialty } from '../../types';

const SPECIALTIES: AlliedHealthSpecialty[] = [
  'Physiotherapist', 'Psychologist', 'Physical Therapist', 
  'Speech Therapist', 'Medical assistant', 'Nursing assistant', 
  'Dietitian', 'Nutritionist', 'Optometrist'
];

export function CareTeamManager({ patientId }: { patientId: string }) {
  const [members, setMembers] = useState<CareTeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Invite state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('allied_health');
  const [inviteSpecialty, setInviteSpecialty] = useState<string>('');
  const [inviteAccess, setInviteAccess] = useState<'clinical_full' | 'clinical_limited' | 'administrative'>('clinical_limited');

  useEffect(() => {
    const q = query(collection(db, `patients/${patientId}/care_teams`), where('status', '==', 'active'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMembers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CareTeamMember)));
      setIsLoading(false);
    });
    return unsubscribe;
  }, [patientId]);

  const handleInvite = async () => {
    setActionLoading('invite');
    try {
      // In a real app, you'd lookup userId by email first. 
      // For this implementation, we'll use a deterministic mock ID or placeholder logic
      const mockUserId = `staff-${Math.random().toString(36).substring(7)}`;
      await addToCareTeam(patientId, mockUserId, {
        accessLevel: inviteAccess,
        userRole: inviteRole,
        userSpecialty: inviteSpecialty || undefined
      });
      setIsInviteOpen(false);
      setInviteEmail('');
      setInviteSpecialty('');
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemove = async (memberId: string) => {
    setActionLoading(memberId);
    try {
      await removeFromCareTeam(patientId, memberId);
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'clinician': return Stethoscope;
      case 'nurse': return Activity;
      case 'allied_health': return HeartHandshake;
      default: return Users;
    }
  };

  const getAccessBadge = (level: string) => {
    switch (level) {
      case 'clinical_full': return <Badge className="bg-[#107C10] text-white border-none text-[9px] font-black uppercase tracking-tighter">Full Clinical</Badge>;
      case 'clinical_limited': return <Badge className="bg-[#DEECF9] text-[#0078D4] border-none text-[9px] font-black uppercase tracking-tighter">Limited Access</Badge>;
      default: return <Badge className="bg-[#F3F2F1] text-[#616161] border-none text-[9px] font-black uppercase tracking-tighter">Admin Only</Badge>;
    }
  };

  return (
    <Card className="flex flex-col border-[#EDEBE9] shadow-sm rounded-lg overflow-hidden bg-white h-full">
      <CardHeader className="py-3 px-4 border-b border-[#F3F2F1] bg-[#FAFAFA]/50 shrink-0 flex flex-row items-center justify-between">
        <div className="flex flex-col">
          <CardTitle className="text-[12px] font-bold text-[#242424] flex items-center gap-2 uppercase tracking-widest">
            <ShieldCheck className="h-4 w-4 text-[#107C10]" />
            Care Circle
          </CardTitle>
          <p className="text-[9px] text-[#616161] font-medium leading-none mt-1">Tiered access control for clinical team</p>
        </div>

        <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-8 bg-[#0078D4] hover:bg-[#005A9E] text-white text-[10px] font-bold rounded-lg px-3 gap-2">
              <UserPlus className="h-3.5 w-3.5" />
              Assign Staff
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-white rounded-2xl shadow-2xl border-[#EDEBE9]">
            <DialogHeader>
              <DialogTitle className="text-lg font-black text-[#242424] flex items-center gap-2">
                <Shield className="h-5 w-5 text-[#0078D4]" />
                Assign Care Team Access
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#616161] uppercase">Professional Role</Label>
                <Select value={inviteRole} onValueChange={(v: UserRole) => setInviteRole(v)}>
                  <SelectTrigger className="h-10 bg-[#FAFAFA] border-[#EDEBE9] rounded-xl text-sm font-medium">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-[#EDEBE9] rounded-xl">
                    <SelectItem value="clinician">Clinician / Physician</SelectItem>
                    <SelectItem value="nurse">Nurse / Assistant</SelectItem>
                    <SelectItem value="allied_health">Allied Healthcare</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {inviteRole === 'allied_health' && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#616161] uppercase">Specialty</Label>
                  <Select value={inviteSpecialty} onValueChange={setInviteSpecialty}>
                    <SelectTrigger className="h-10 bg-[#FAFAFA] border-[#EDEBE9] rounded-xl text-sm font-medium">
                      <SelectValue placeholder="Select specialty" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-[#EDEBE9] rounded-xl">
                      {SPECIALTIES.map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#616161] uppercase">Data Access Level</Label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { id: 'clinical_full', label: 'Full Clinical', desc: 'Can read/write SOAP notes, prescriptions, investigations.' },
                    { id: 'clinical_limited', label: 'Limited Access', desc: 'Can read vitals and interaction logs. Restricted records.' },
                    { id: 'administrative', label: 'Administrative', desc: 'Demographics and scheduling only.' },
                  ].map((lvl) => (
                    <button
                      key={lvl.id}
                      onClick={() => setInviteAccess(lvl.id as any)}
                      className={`text-left p-3 rounded-xl border transition-all ${inviteAccess === lvl.id ? 'border-[#0078D4] bg-[#F3F9FD] ring-2 ring-[#0078D4]/10' : 'border-[#EDEBE9] hover:bg-[#FAFAFA]'}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] font-bold text-[#242424]">{lvl.label}</span>
                        {inviteAccess === lvl.id && <Check className="h-4 w-4 text-[#0078D4]" />}
                      </div>
                      <p className="text-[11px] text-[#616161] mt-0.5">{lvl.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setIsInviteOpen(false)} className="text-[12px] font-bold">Cancel</Button>
              <Button 
                onClick={handleInvite} 
                disabled={actionLoading === 'invite'}
                className="bg-[#107C10] hover:bg-[#0E6D0E] text-white text-[12px] font-bold rounded-xl h-10 px-6 shadow-md shadow-[#107C10]/10"
              >
                {actionLoading === 'invite' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Assignment'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent className="p-0 flex-1 flex flex-col min-h-0 bg-[#FAFAFA]/30">
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-3">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-40 opacity-30">
                <Loader2 className="h-8 w-8 animate-spin text-[#0078D4]" />
              </div>
            ) : members.length > 0 ? (
              <AnimatePresence>
                {members.map((member, idx) => {
                  const Icon = getRoleIcon(member.userRole);
                  return (
                    <motion.div
                      key={member.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="bg-white border border-[#EDEBE9] rounded-xl p-3 shadow-sm hover:border-[#0078D4]/30 hover:shadow-md transition-all group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className={`p-2 rounded-lg bg-[#DEECF9] text-[#0078D4]`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex items-center gap-1">
                          {getAccessBadge(member.accessLevel)}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 rounded-md text-[#BDBDBD] hover:text-[#D13438] hover:bg-[#FDE7E9] opacity-0 group-hover:opacity-100 transition-all"
                            onClick={() => handleRemove(member.id)}
                            disabled={actionLoading === member.id}
                          >
                            {actionLoading === member.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-0.5">
                        <h4 className="text-[13px] font-black text-[#242424] truncate">
                          {member.userSpecialty || member.userRole.replace('_', ' ').toUpperCase()}
                        </h4>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-[#A19F9D] uppercase tracking-tight">Active Team Member</span>
                          <div className="h-1 w-1 rounded-full bg-[#107C10]" />
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-[#F3F2F1] flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-[9px] font-black text-[#A19F9D] uppercase tracking-widest">
                          <Clock className="h-3 w-3" />
                          Joined Care Circle
                        </div>
                        <span className="text-[9px] font-black text-[#242424] opacity-40">
                          {member.assignedAt?.seconds ? new Date(member.assignedAt.seconds * 1000).toLocaleDateString() : 'Active'}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            ) : (
              <div className="h-60 flex flex-col items-center justify-center text-center p-6 space-y-4 bg-[#FAFAFA] rounded-2xl border border-dashed border-[#EDEBE9] mx-4 my-2">
                <Users className="h-10 w-10 text-[#BDBDBD] opacity-30" />
                <div>
                  <p className="text-[11px] font-black uppercase tracking-widest text-[#616161]">No Staff Assigned</p>
                  <p className="text-[9px] font-bold text-[#A19F9D] mt-2 max-w-[180px]">All patient data currently locked to default admin access levels.</p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setIsInviteOpen(true)}
                  className="h-8 border-[#EDEBE9] text-[10px] font-black uppercase tracking-tight hover:bg-white rounded-lg px-4"
                >
                  Assign Provider
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
