import { useState, useEffect } from 'react';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter 
} from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '../../components/ui/select';
import { useCommandDispatcher } from '../../store/eventStore';
import { HeartHandshake, DollarSign, Accessibility, MessagesSquare, Stethoscope, Users, Loader2, AlertCircle } from 'lucide-react';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { saveInteraction } from '../../services/clinicalFirestoreService';

import { UserRole } from '../../types';

interface InteractionEntryModalProps {
  patientId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function InteractionEntryModal({ patientId, isOpen, onClose }: InteractionEntryModalProps) {
  const dispatch = useCommandDispatcher();
  const { userProfile, loading: userLoading } = useCurrentUser();
  const [type, setType] = useState<'clinical' | 'nursing' | 'pt' | 'social_care' | 'billing' | 'support_group'>('clinical');
  const [role, setRole] = useState<UserRole>('clinician');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (userProfile) {
      setRole(userProfile.role);
      // Auto-assign type based on role
      switch (userProfile.role) {
        case 'clinician': setType('clinical'); break;
        case 'nurse': setType('nursing'); break;
        case 'allied_health': setType('pt'); break;
        case 'billing': setType('billing'); break;
        case 'manager': setType('social_care'); break;
        case 'admin': setType('social_care'); break;
        case 'patient': setType('support_group'); break;
      }
    }
  }, [userProfile, isOpen]);

  const handleSubmit = async () => {
    if (!content.trim() || !userProfile) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const payload = {
        patientId,
        authorId: userProfile.id,
        authorName: userProfile.displayName || 'Clinical Provider',
        authorRole: role,
        type,
        content,
        timestamp: Date.now()
      };

      // 1. Save to Firestore for persistence
      await saveInteraction(patientId, payload);

      // 2. Dispatch to local event store for immediate UI feedback
      dispatch({
        type: 'INTERACTION_RECORDED',
        payload: {
          id: `int-${Date.now()}`,
          ...payload
        }
      });

      setContent('');
      onClose();
    } catch (error: any) {
      console.error('Error saving interaction:', error);
      setErrorMessage(error.message?.includes('permission') ? 'Security: Access Denied' : 'Sync error: Entry not saved');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] border-none shadow-2xl rounded-2xl overflow-hidden p-0">
        <DialogHeader className="bg-[#E3008C] p-6 text-white">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Users className="h-5 w-5" />
            Record Care Interaction
          </DialogTitle>
          <p className="text-xs text-white/80 font-medium mt-1">
            Logging as {userProfile?.displayName} ({userProfile?.role.replace('_', ' ')})
          </p>
        </DialogHeader>

        <div className="p-6 space-y-6 bg-white">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[#616161] uppercase tracking-widest">Verification Role</label>
              <Select value={role} onValueChange={(v: any) => setRole(v)}>
                <SelectTrigger className="bg-[#F3F2F1] border-[#EDEBE9] rounded-xl h-11 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="clinician">Clinician / MD</SelectItem>
                  <SelectItem value="nurse">Nurse / RN</SelectItem>
                  <SelectItem value="allied_health">Allied Professional</SelectItem>
                  <SelectItem value="manager">Practice Manager</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                  <SelectItem value="billing">Billing Specialist</SelectItem>
                  <SelectItem value="patient">Patient Self-Entry</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[#616161] uppercase tracking-widest">Context Type</label>
              <Select value={type} onValueChange={(v: any) => setType(v)}>
                <SelectTrigger className="bg-[#F3F2F1] border-[#EDEBE9] rounded-xl h-11 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="clinical">Clinical Consultation</SelectItem>
                  <SelectItem value="nursing">Nursing Support</SelectItem>
                  <SelectItem value="pt">PT / Rehabilitation</SelectItem>
                  <SelectItem value="social_care">Social & Family Care</SelectItem>
                  <SelectItem value="billing">Billing/Financial Guidance</SelectItem>
                  <SelectItem value="support_group">Support Group</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-[#616161] uppercase tracking-widest">Interaction Summary</label>
            <Textarea 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Record the details of the interaction or non-medical support provided..."
              className="bg-[#F3F2F1] border-[#EDEBE9] rounded-xl min-h-[120px] text-sm resize-none focus:ring-2 focus:ring-[#E3008C]"
              disabled={isSubmitting}
            />
          </div>
        </div>

        <DialogFooter className="bg-[#F8F8F8] p-4 flex flex-col gap-3 border-t border-[#EDEBE9]">
          {errorMessage && (
            <div className="flex items-center gap-2 text-[10px] font-black uppercase text-[#A4262C] bg-[#FDE7E9] px-4 py-2 rounded-xl">
              <AlertCircle className="h-3 w-3" />
              {errorMessage}
            </div>
          )}
          <div className="flex gap-3 w-full">
            <Button variant="ghost" onClick={onClose} className="rounded-xl h-11 px-6 font-bold text-[#616161]" disabled={isSubmitting}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting || !content.trim() || userLoading}
              className="rounded-xl h-11 px-8 font-bold bg-[#E3008C] hover:bg-[#C30078] text-white shadow-md shadow-pink-200"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Post Interaction
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
