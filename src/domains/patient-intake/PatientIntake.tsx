import { RegistrationFlow } from './RegistrationFlow';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Users } from 'lucide-react';

export function PatientIntake({ onComplete, onCancel }: { onComplete: (id: string) => void, onCancel: () => void }) {
  const handleComplete = (patientId: string) => {
    onComplete(patientId);
  };

  const handleCancel = () => {
    onCancel();
  };

  return (
    <div className="flex flex-col gap-6 py-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner">
          <Users className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Patient Onboarding</h1>
          <p className="text-muted-foreground text-sm">Follow the guided process to register a new clinical participant.</p>
        </div>
      </div>

      <RegistrationFlow onComplete={handleComplete} onCancel={handleCancel} />
    </div>
  );
}
