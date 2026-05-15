import { mockDbService } from '../lib/mockDatabase';
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
  return mockDbService.getCollection('clinical_templates');
}
