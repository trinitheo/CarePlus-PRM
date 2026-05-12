import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface MedAsrResult {
  title: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  workingDiagnoses: string[];
}

/**
 * Simulates Google Health AI MedASR functionality using Gemini with a specialized medical prompt.
 * This function processes a conversation transcript and generates a structured SOAP note.
 */
export async function processMedicalConversation(transcript: string): Promise<MedAsrResult> {
  try {
    const prompt = `Act as a Google Health AI MedASR (Medical Automatic Speech Recognition) and Clinical Documentation assistant.
    
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
      model: "gemini-flash-latest",
      contents: prompt,
    });

    const text = response.text;
    const cleanedText = text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error("MedASR Processing Error:", error);
    throw new Error("Failed to process conversation with MedASR.");
  }
}
