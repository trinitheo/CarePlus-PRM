import type { ICD10Concept } from '../types';

const mockIcd10Db: ICD10Concept[] = [
    { code: 'R51', description: 'Headache' },
    { code: 'M54.5', description: 'Low back pain' },
    { code: 'I10', description: 'Essential (primary) hypertension' },
    { code: 'E11.9', description: 'Type 2 diabetes mellitus without complications' },
    { code: 'J06.9', description: 'Acute upper respiratory infection, unspecified' },
    { code: 'R07.9', description: 'Chest pain, unspecified' },
    { code: 'R10.9', description: 'Unspecified abdominal pain' },
    { code: 'N39.0', description: 'Urinary tract infection, site not specified' },
];

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const icd10Service = {
  async search(query: string): Promise<ICD10Concept[]> {
    await delay(200); // Simulate network latency
    if (!query) {
      return [];
    }
    const lowerCaseQuery = query.toLowerCase();
    return mockIcd10Db.filter(concept =>
      concept.description.toLowerCase().includes(lowerCaseQuery) ||
      concept.code.toLowerCase().includes(lowerCaseQuery)
    );
  },
};
