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
import { HeartHandshake, DollarSign, Accessibility, MessagesSquare, Stethoscope, Users, Loader2 } from 'lucide-react';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { saveInteraction } from '../../services/clinicalFirestoreService';

interface InteractionEntryModalProps {
  patientId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function InteractionEntryModal({ patientId, isOpen, onClose }: InteractionEntryModalProps) {
  const dispatch = useCommandDispatcher();
  const { userProfile, loading: userLoading } = useCurrentUser();
  const [type, setType] = useState<'clinical' | 'nursing' | 'pt' | 'social_care' | 'financial' | 'support_group'>('clinical');
  const [role, setRole] = useState<'doctor' | 'nurse' | 'pt' | 'social_worker' | 'financial_counselor' | 'community_lead'>('doctor');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setRole(userProfile.role);
      // Auto-assign type based on role
      switch (userProfile.role) {
        case 'doctor': setType('clinical'); break;
        case 'nurse': setType('nursing'); break;
        case 'pt': setType('pt'); break;
        case 'social_worker': setType('social_care'); break;
        case 'financial_counselor': setType('financial'); break;
        case 'community_lead': setType('support_group'); break;
      }
    }
  }, [userProfile, isOpen]);

  const handleSubmit = async () => {
    if (!content.trim() || !userProfile) return;

    setIsSubmitting(true);
    try {
      const payload = {
        patientId,
        authorId: userProfile.id,
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
    } catch (error) {
      console.error('Error saving interaction:', error);
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
                  <SelectItem value="doctor">Clinician / MD</SelectItem>
                  <SelectItem value="nurse">Nurse / RN</SelectItem>
                  <SelectItem value="pt">Physical Therapist</SelectItem>
                  <SelectItem value="social_worker">Social Worker</SelectItem>
                  <SelectItem value="financial_counselor">Financial Counselor</SelectItem>
                  <SelectItem value="community_lead">Community Lead</SelectItem>
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
                  <SelectItem value="financial">Financial Guidance</SelectItem>
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

        <DialogFooter className="bg-[#F8F8F8] p-4 flex gap-3 border-t border-[#EDEBE9]">
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
