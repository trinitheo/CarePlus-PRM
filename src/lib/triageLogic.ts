
export type Priority = 'immediate' | 'urgent' | 'routine';

interface TriageResult {
  priority: Priority;
  color: string;
}

const KEYWORDS = {
  immediate: ['chest pain', 'shortness of breath', 'difficulty breathing', 'unconscious', 'severe bleeding', 'seizure', 'stroke'],
  urgent: ['fever', 'abdominal pain', 'moderate pain', 'fracture', 'vbe', 'infection', 'bloods'],
};

export function calculatePriority(reason: string): TriageResult {
  const normalizedReason = reason.toLowerCase();

  for (const keyword of KEYWORDS.immediate) {
    if (normalizedReason.includes(keyword)) {
      return { priority: 'immediate', color: '#D13438' }; // Red
    }
  }

  for (const keyword of KEYWORDS.urgent) {
    if (normalizedReason.includes(keyword)) {
      return { priority: 'urgent', color: '#CA5010' }; // Orange
    }
  }

  return { priority: 'routine', color: '#107C10' }; // Green
}
