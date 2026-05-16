import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { X, ArrowLeft, Loader2, Send, ClipboardCheck, AlertCircle, Lock } from 'lucide-react';
import { saveInvestigation } from '../../../services/clinicalFirestoreService';
import { OrderCategorySelection } from './components/OrderCategorySelection';
import { InvestigationOrderForm, OrderCategory, validateInvestigationOrder, isFormValid } from './components/InvestigationOrderForm';
import { RequisitionPreview } from './components/RequisitionPreview';
import { useQueryModel } from '../../../store/eventStore';

interface InvestigationOrderModalProps {
  patientId: string;
  children: React.ReactNode;
  canWrite?: boolean;
}

export function InvestigationOrderModal({ patientId, children, canWrite = true }: InvestigationOrderModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { patients } = useQueryModel();
  const patient = patients[patientId];
  
  // Workflow State
  const [category, setCategory] = useState<OrderCategory>(null);
  const [workflowStep, setWorkflowStep] = useState<'category' | 'form' | 'preview'>('category');

  // Form State
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [otherTestsText, setOtherTestsText] = useState('');
  const [priority, setPriority] = useState('Routine');
  const [indication, setIndication] = useState('');
  const [instructions, setInstructions] = useState('');
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const handleClose = () => {
    setIsOpen(false);
    setErrorMessage(null);
    setTimeout(() => {
      setCategory(null);
      setWorkflowStep('category');
      setSelectedTests([]);
      setOtherTestsText('');
      setPriority('Routine');
      setIndication('');
      setInstructions('');
      setSubmitAttempted(false);
    }, 200);
  };

  const formErrors = submitAttempted
    ? validateInvestigationOrder(selectedTests, indication)
    : {};

  const getTitle = () => {
    if (workflowStep === 'preview') return "Confirm Requisition";
    if (!category) return "New Investigation Order";
    switch (category) {
      case 'laboratory': return "New Laboratory Order";
      case 'imaging': return "New Imaging Order";
      case 'functional': return "New Functional Study";
      default: return "New Investigation Order";
    }
  };

  const toggleTest = (test: string) => {
    setSelectedTests(prev => 
      prev.includes(test) ? prev.filter(t => t !== test) : [...prev, test]
    );
  };

  const handleNextStep = () => {
    if (workflowStep === 'category' && category) {
      setWorkflowStep('form');
    } else if (workflowStep === 'form') {
      setSubmitAttempted(true);
      const errors = validateInvestigationOrder(selectedTests, indication);
      if (isFormValid(errors)) {
        setWorkflowStep('preview');
      }
    }
  };

  const handleBackStep = () => {
    if (workflowStep === 'preview') {
      setWorkflowStep('form');
    } else if (workflowStep === 'form') {
      setWorkflowStep('category');
      setCategory(null);
    }
  };

  const parsedTests = [
    ...selectedTests.map(t => ({ testName: t })),
    ...otherTestsText
      .split('\n')
      .map(t => t.trim())
      .filter(t => t.length > 0)
      .map(name => ({ testName: name }))
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open ? handleClose() : setIsOpen(true)}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent showCloseButton={false} className={`p-0 overflow-hidden bg-[#FAFAFA] border-[#EDEBE9] rounded-2xl flex flex-col transition-all duration-300 focus:outline-none ${workflowStep === 'category' ? 'sm:max-w-[600px] w-[95vw] shadow-lg' : 'sm:max-w-[900px] w-[95vw] h-[85vh] shadow-xl'}`}>
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EDEBE9] shrink-0 bg-white">
          <DialogHeader className="p-0">
            <div className="flex items-center gap-3">
                {workflowStep !== 'category' && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={handleBackStep}
                      className="h-8 w-8 rounded-full text-[#616161] hover:bg-[#F3F2F1] -ml-2 transition-colors"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                )}
              <DialogTitle className="text-[18px] font-bold tracking-tight text-[#242424]">
                {getTitle()}
              </DialogTitle>
            </div>
          </DialogHeader>
          <DialogClose asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleClose} 
              className="h-8 w-8 rounded-md text-[#A19F9D] hover:bg-[#F3F2F1] hover:text-[#242424] transition-colors"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogClose>
        </div>

        <div className="flex-1 overflow-y-auto bg-[#FAFAFA] relative z-20 pointer-events-auto">
          <div className="p-6 h-full">
              {workflowStep === 'category' && (
                <OrderCategorySelection onSelectCategory={(cat) => {
                  setCategory(cat);
                  setWorkflowStep('form');
                }} />
              )}
              
              {workflowStep === 'form' && category && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  <InvestigationOrderForm 
                    category={category}
                    selectedTests={selectedTests}
                    otherTestsText={otherTestsText}
                    indication={indication}
                    instructions={instructions}
                    priority={priority}
                    errors={formErrors}
                    onToggleTest={toggleTest}
                    onOtherTestsTextChange={setOtherTestsText}
                    onIndicationChange={setIndication}
                    onInstructionsChange={setInstructions}
                    onPriorityChange={setPriority}
                  />
                </div>
              )}

              {workflowStep === 'preview' && (
                <RequisitionPreview 
                  patient={patient}
                  category={category!}
                  tests={parsedTests}
                  priority={priority}
                  indication={indication}
                  instructions={instructions}
                />
              )}
          </div>
        </div>

        {/* Footer */}
        {workflowStep !== 'category' && (
          <DialogFooter className="px-6 py-4 bg-white border-t border-[#EDEBE9] flex justify-between items-center shrink-0">
          <DialogClose asChild>
            <Button 
              variant="ghost"
              onClick={handleClose}
              className="text-[#616161] hover:text-[#242424] hover:bg-[#F3F2F1] font-semibold text-[13px] px-4 h-9"
            >
              Cancel
            </Button>
          </DialogClose>
            
            {workflowStep === 'form' && (
              <Button 
                onClick={handleNextStep}
                className="bg-[#0078D4] hover:bg-[#005A9E] text-white font-bold text-[13px] rounded-lg px-8 h-10 shadow-sm transition-all"
              >
                Review Requisition
              </Button>
            )}

            {workflowStep === 'preview' && (
              <div className="flex flex-col gap-3 w-full">
                {errorMessage && (
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase text-[#A4262C] bg-[#FDE7E9] px-4 py-2 rounded-lg">
                    <AlertCircle className="h-3 w-3" />
                    {errorMessage}
                  </div>
                )}
                <div className="flex justify-end gap-3 w-full">
                  <DialogClose asChild>
                    <Button 
                      variant="ghost"
                      onClick={handleClose}
                      className="text-[#616161] hover:text-[#242424] hover:bg-[#F3F2F1] font-semibold text-[13px] px-4 h-9"
                    >
                      Cancel
                    </Button>
                  </DialogClose>
                  {canWrite ? (
                    <Button 
                      disabled={isSubmitting}
                      onClick={async () => {
                        setIsSubmitting(true);
                        setErrorMessage(null);
                        try {
                          await saveInvestigation(patientId, {
                            category,
                            tests: parsedTests,
                            priority,
                            indication,
                            instructions
                          });
                          handleClose();
                        } catch (e: any) {
                          console.error("Failed to save", e);
                          setErrorMessage(e.message?.includes('permission') ? 'Security: Access Denied' : 'Sync error: Order not sent');
                        } finally {
                          setIsSubmitting(false);
                        }
                      }}
                      className="bg-[#107C10] hover:bg-[#0B590B] text-white font-bold text-[13px] rounded-lg px-8 h-10 shadow-sm transition-all disabled:opacity-50"
                    >
                      {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                      Confirm & Send Requisition
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2 bg-[#F3F2F1] px-6 py-2 rounded-lg border border-[#EDEBE9]">
                      <Lock className="h-4 w-4 text-[#616161]" />
                      <span className="text-[11px] font-black uppercase text-[#616161]">Read Only</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}


