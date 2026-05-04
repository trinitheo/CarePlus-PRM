import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { X, ArrowLeft, Loader2 } from 'lucide-react';
import { saveInvestigation } from '../../services/clinicalFirestoreService';
import { OrderCategorySelection } from './components/OrderCategorySelection';
import { InvestigationOrderForm, OrderCategory } from './components/InvestigationOrderForm';

interface InvestigationOrderModalProps {
  patientId: string;
  children: React.ReactNode;
}

export function InvestigationOrderModal({ patientId, children }: InvestigationOrderModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Workflow State
  const [category, setCategory] = useState<OrderCategory>(null);

  // Form State
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [priority, setPriority] = useState('Routine');
  const [indication, setIndication] = useState('');
  const [instructions, setInstructions] = useState('');

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => {
      setCategory(null);
      setSelectedTests([]);
      setSearchQuery('');
      setPriority('Routine');
      setIndication('');
      setInstructions('');
    }, 200);
  };

  const getTitle = () => {
    if (!category) return "New Investigation Order";
    switch (category) {
      case 'laboratory': return "New Laboratory Order";
      case 'imaging': return "New Imaging Order";
      case 'functional': return "New Functional Study";
    }
  };

  const toggleTest = (test: string) => {
    setSelectedTests(prev => 
      prev.includes(test) ? prev.filter(t => t !== test) : [...prev, test]
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open ? handleClose() : setIsOpen(true)}>
      <DialogTrigger render={children} />
      <DialogContent showCloseButton={false} className={`p-0 overflow-hidden bg-[#FAFAFA] border-[#EDEBE9] rounded-2xl flex flex-col transition-all duration-300 focus:outline-none ${!category ? 'sm:max-w-[600px] w-[95vw] shadow-lg' : 'sm:max-w-[900px] w-[95vw] h-[85vh] shadow-xl'}`}>
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EDEBE9] shrink-0 bg-white">
          <DialogHeader className="p-0">
            <div className="flex items-center gap-3">
                {category && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setCategory(null)}
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
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleClose} 
            className="h-8 w-8 rounded-md text-[#A19F9D] hover:bg-[#F3F2F1] hover:text-[#242424] transition-colors"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto bg-[#FAFAFA] relative z-20 pointer-events-auto">
          <div className="p-6 h-full">
              {!category ? (
                <OrderCategorySelection onSelectCategory={setCategory} />
              ) : (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  <InvestigationOrderForm 
                    category={category}
                    selectedTests={selectedTests}
                    searchQuery={searchQuery}
                    indication={indication}
                    instructions={instructions}
                    priority={priority}
                    onSearchChange={setSearchQuery}
                    onToggleTest={toggleTest}
                    onIndicationChange={setIndication}
                    onInstructionsChange={setInstructions}
                    onPriorityChange={setPriority}
                  />
                </div>
              )}
          </div>
        </div>

        {/* Footer */}
        {category && (
          <DialogFooter className="px-6 py-4 bg-white border-t border-[#EDEBE9] flex justify-between items-center shrink-0">
            <button 
              type="button"
              onClick={handleClose}
              className="text-[#616161] hover:text-[#242424] font-semibold text-[13px] px-4 h-9 transition-colors border-none bg-transparent outline-none cursor-pointer"
            >
              Cancel
            </button>
              <Button 
                disabled={isSubmitting || selectedTests.length === 0 || !indication}
                onClick={async () => {
                  setIsSubmitting(true);
                  try {
                    await saveInvestigation(patientId, {
                      category,
                      tests: selectedTests.map(t => ({ testName: t })),
                      priority,
                      indication,
                      instructions
                    });
                    handleClose();
                  } catch (e) {
                    console.error("Failed to save", e);
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
                className="bg-[#0078D4] hover:bg-[#005A9E] text-white font-bold text-[13px] rounded-lg px-8 h-10 shadow-sm transition-all disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Place Order ({selectedTests.length})
              </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}


