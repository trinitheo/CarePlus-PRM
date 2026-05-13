import { 
  collection, 
  addDoc, 
  getDocs, 
  serverTimestamp,
  doc,
  updateDoc
} from 'firebase/firestore';
import { db, auth } from './clinicalFirestoreService';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function summarizeClinicalNote(noteContent: string) {
  try {
    const prompt = `Summarize the following clinical encounter into a concise paragraph suitable for a handoff or discharge summary:
    
    Content: "${noteContent}"`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt
    });

    return response.text;
  } catch (error) {
    console.error("Summarization Error:", error);
    return null;
  }
}

export async function getTemplates() {
  const snap = await getDocs(collection(db, 'clinical_templates'));
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
