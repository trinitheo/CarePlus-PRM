// src/types/patient.ts

export interface AIMicroGoal {
  id: string;
  type: 'clinical_directive' | 'ai_micro_goal'; // Differentiates standard vs AI tasks
  title: string;
  description: string;
  expirationTimestamp: number; // Unix timestamp for JITAI time-bounding
  completed: boolean;
}

export interface InterventionNudge {
  tabTarget: 'Mindful' | 'Metabolic' | 'Steps' | 'Rest';
  message: string;
  timestamp: number;
}

export interface PatientState {
  healthScore: number;
  biometrics: Record<string, any>;
  activeNudge?: InterventionNudge;
  actionPlan: AIMicroGoal[];
}
