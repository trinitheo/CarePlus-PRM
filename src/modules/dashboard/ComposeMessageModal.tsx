import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { createMessage } from '../../services/clinicalFirestoreService';
import { useQueryModel } from '../../store/eventStore';
import { Send, User, Search, MessageSquarePlus } from 'lucide-react';
import { collection, query, getDocs, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface ComposeMessageModalProps {
  replyTo?: any;
  trigger?: React.ReactNode;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ComposeMessageModal({ replyTo, trigger, isOpen: controlledOpen, onOpenChange }: ComposeMessageModalProps) {
  const { userProfile } = useCurrentUser();
  const { patients } = useQueryModel();
  const [isOpen, setIsOpen] = useState(false);
  const [toUserId, setToUserId] = useState(replyTo?.fromUserId || '');
  const [subject, setSubject] = useState(replyTo ? `Re: ${replyTo.subject}` : '');
  const [body, setBody] = useState('');
  const [patientId, setPatientId] = useState(replyTo?.patientId || '');
  const [loading, setLoading] = useState(false);
  const [availableRecipients, setAvailableRecipients] = useState<any[]>([]);

  const isControlled = controlledOpen !== undefined;
  const actualOpen = isControlled ? controlledOpen : isOpen;
  const actualSetOpen = isControlled ? onOpenChange : setIsOpen;

  useEffect(() => {
    if (actualOpen) {
      fetchRecipients();
    }
  }, [actualOpen]);

  const fetchRecipients = async () => {
    try {
      // For demo, list some staff or patients
      const q = query(collection(db, 'users'), limit(50));
      const snap = await getDocs(q);
      const list = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(u => u.id !== userProfile?.id);
      setAvailableRecipients(list);
    } catch (e) {
      console.error('Failed to fetch recipients:', e);
    }
  };

  const handleSend = async () => {
    if (!toUserId || !subject || !body || !userProfile) return;
    setLoading(true);
    try {
      const recipient = availableRecipients.find(r => r.id === toUserId);
      const patient = patientId ? patients[patientId] : null;

      await createMessage({
        fromUserId: userProfile.id,
        fromUserName: userProfile.displayName,
        fromRole: userProfile.role,
        toUserId,
        toUserName: recipient?.displayName || 'Recipient',
        toRole: recipient?.role || 'staff',
        subject,
        body,
        patientId: patientId || null,
        patientName: patient?.name || null,
        read: false,
      });
      
      setBody('');
      setSubject('');
      setToUserId('');
      setPatientId('');
      actualSetOpen?.(false);
    } catch (e) {
      console.error('Failed to send message:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={actualOpen} onOpenChange={actualSetOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2 rounded-full border-[#DEECF9] text-[#0078D4] hover:bg-[#DEECF9]">
            <MessageSquarePlus className="h-4 w-4" />
            Compose
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-[32px] border-none shadow-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-[20px] font-black text-[#1A1A1A] tracking-tight flex items-center gap-2">
            <Send className="h-5 w-5 text-[#0078D4]" />
            {replyTo ? 'Reply to Message' : 'New Secure Message'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-[#757370] uppercase tracking-widest pl-1">Recipient</label>
            <Select value={toUserId} onValueChange={setToUserId}>
              <SelectTrigger className="rounded-2xl border-[#EDEBE9] bg-[#FAFAFA] h-11">
                <SelectValue placeholder="Select Recipient" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-xl">
                {availableRecipients.map(r => (
                  <SelectItem key={r.id} value={r.id}>
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 rounded-full bg-[#EDEBE9] flex items-center justify-center text-[9px] font-black">
                        {r.displayName?.[0] || '?'}
                      </div>
                      <span>{r.displayName} ({r.role?.replace('_', ' ')})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-[#757370] uppercase tracking-widest pl-1">Related Patient (Optional)</label>
            <Select value={patientId} onValueChange={setPatientId}>
              <SelectTrigger className="rounded-2xl border-[#EDEBE9] bg-[#FAFAFA] h-11">
                <SelectValue placeholder="Link to Patient Profile" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-xl">
                <SelectItem value="none">None</SelectItem>
                {Object.values(patients).map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-[#757370] uppercase tracking-widest pl-1">Subject</label>
            <Input 
              placeholder="Message subject" 
              value={subject} 
              onChange={e => setSubject(e.target.value)}
              className="rounded-2xl border-[#EDEBE9] bg-[#FAFAFA] h-11 focus-visible:ring-[#0078D4]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-[#757370] uppercase tracking-widest pl-1">Message</label>
            <Textarea 
              placeholder="Type your secure message here..." 
              value={body}
              onChange={e => setBody(e.target.value)}
              className="rounded-2xl border-[#EDEBE9] bg-[#FAFAFA] focus-visible:ring-[#0078D4] min-h-[120px] resize-none"
            />
          </div>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={handleSend} 
            disabled={loading || !toUserId || !subject || !body}
            className="flex-1 rounded-full bg-[#0078D4] hover:bg-[#005A9E] text-white font-black text-[13px] h-12 shadow-md gap-2"
          >
            {loading ? 'Sending...' : <><Send className="h-4 w-4" /> Send Securely</>}
          </Button>
          <Button variant="outline" onClick={() => actualSetOpen?.(false)} className="rounded-full border-[#EDEBE9] text-[#444441] font-black text-[13px] h-12 px-6">
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
