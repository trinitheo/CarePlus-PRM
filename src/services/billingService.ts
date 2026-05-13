import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  serverTimestamp,
  doc,
  updateDoc
} from 'firebase/firestore';
import { db, auth } from './clinicalFirestoreService';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface Charge {
  id: string;
  patientId: string;
  encounterId?: string;
  clinicianId: string;
  code: string;
  description: string;
  amount: number;
  status: 'captured' | 'pending_review' | 'billed' | 'void';
}

/**
 * Uses Gemini to suggest CPT and ICD-10 codes based on clinical documentation.
 */
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
  const adminId = auth.currentUser?.uid;
  return await addDoc(collection(db, 'charges'), {
    ...data,
    clinicianId: adminId,
    status: 'captured',
    createdAt: serverTimestamp()
  });
}

export async function createInvoice(patientId: string, chargeIds: string[]) {
  // 1. Get charges to calculate total
  const chargesSnap = await getDocs(collection(db, 'charges'));
  let total = 0;
  chargesSnap.forEach(d => {
    if (chargeIds.includes(d.id)) {
      total += d.data().amount;
    }
  });

  return await addDoc(collection(db, 'invoices'), {
    patientId,
    chargeIds,
    totalAmount: total,
    paidAmount: 0,
    status: 'sent',
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    createdAt: serverTimestamp()
  });
}
