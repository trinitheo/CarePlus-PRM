import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface TranscriptionResult {
  title: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  workingDiagnoses: string[];
}

/**
 * Simulates Google Health AI transcription functionality using Gemini with a specialized medical prompt.
 * This function processes a conversation transcript and generates a structured SOAP note.
 */
export async function processMedicalConversation(transcript: string): Promise<TranscriptionResult> {
  try {
    const prompt = `Act as a Google Health AI clinical documentation and Transcription assistant.
    
    Task: Convert the provided medical conversation transcript into a professionally structured SOAP note.
    
    Conversation:
    """
    ${transcript}
    """
    
    Requirements:
    1. Extract clinical findings into Subjective, Objective, Assessment, and Plan (SOAP) sections.
    2. Suggest a concise, descriptive title for the note.
    3. Identify potential ICD-10 working diagnoses based on the encounter.
    
    Respond STRICTLY with a JSON object in this format:
    {
      "title": "Short title",
      "subjective": "Detailed subjective findings",
      "objective": "Measured objective findings (vitals, exam)",
      "assessment": "Clinical assessment and reasoning",
      "plan": "Follow-up, medications, and next steps",
      "workingDiagnoses": ["Diagnosis Name 1", "Diagnosis Name 2"]
    }
    
    Return ONLY the JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI model");
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Transcription Processing Error:", error);
    // If it's a 400 (INVALID_ARGUMENT) or 403 (PERMISSION_DENIED), we re-throw to be caught by UI
    throw error;
  }
}
