import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateFriendlyInstructions(medication: string, dosage: string, frequency: string) {
  try {
    const prompt = `Convert the following medical prescription into clear, friendly, and easy-to-understand instructions for a patient. 
    Medication: ${medication}
    Dosage: ${dosage}
    Frequency: ${frequency}
    
    The instructions should be encouraging, explain how to take it simply, and mention any common simple precautions (like taking with food or water). Keep it concise (2-3 sentences).`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("AI Generation Error:", error);
    return null;
  }
}
