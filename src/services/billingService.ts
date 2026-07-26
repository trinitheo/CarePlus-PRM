import { auth, clinicalService } from './clinicalFirestoreService';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface Charge {
  id: string;
  patientId: string;
  encounterId?: string;
  clinicianId: string;
  capturedBy?: string;
  code: string;
  description: string;
  amount: number;
  status: 'captured' | 'pending_review' | 'billed' | 'void';
}

export async function suggestClinicalCodes(clinicalNote: string) {
  try {
    const prompt = `Act as an expert medical billing and coding assistant.
    Review the following clinical note and suggest the most appropriate:
    1. ICD-10 (Diagnosis) codes
    2. CPT (Procedure) codes
    
    Clinical Note: "${clinicalNote}"
    
    Return the response in JSON format:
    {
      "icd10": [{ "code": "string", "description": "string", "rationale": "string" }],
      "cpt": [{ "code": "string", "description": "string", "rationale": "string" }]
    }`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) return { icd10: [], cpt: [] };
    return JSON.parse(text);
  } catch (error) {
    console.error("Coding Suggestions Error:", error);
    return { icd10: [], cpt: [] };
  }
}

export async function captureCharge(data: Omit<Charge, 'id'>) {
  const currentUserUid = auth.currentUser?.uid || 'system';
  return clinicalService.addItem('charges', {
    capturedBy: currentUserUid,
    ...data,
    clinicianId: data.clinicianId || currentUserUid,
    status: data.status || 'captured'
  });
}

export async function createInvoice(patientId: string, chargeIds: string[]) {
  const charges = await clinicalService.getCollection('charges');
  let total = 0;
  charges.forEach((d: any) => {
    if (chargeIds.includes(d.id)) {
      total += d.amount;
    }
  });

  return clinicalService.addItem('invoices', {
    patientId,
    chargeIds,
    totalAmount: total,
    paidAmount: 0,
    status: 'sent',
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  });
}

