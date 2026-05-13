import { GoogleGenAI } from "@google/genai";

const FLASH_MODEL = "gemini-2.0-flash";
let aiClient: GoogleGenAI | null = null;

function getAiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined in environment. Please add it in Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

export async function generateFriendlyInstructions(medication: string, dosage: string, frequency: string) {
  try {
    const ai = getAiClient();
    const prompt = `Convert the following medical prescription into clear, friendly, and easy-to-understand instructions for a patient. 
    Medication: ${medication}
    Dosage: ${dosage}
    Frequency: ${frequency}
    
    The instructions should be encouraging, explain how to take it simply, and mention any common simple precautions (like taking with food or water). Keep it concise (2-3 sentences).`;

    const response = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: prompt
    });

    return response.text;
  } catch (error) {
    console.error("AI Generation Error:", error);
    return "Instructions currently unavailable. Please consult your physician.";
  }
}

export async function checkDrugInteractions(medications: string[], context?: string) {
  try {
    const ai = getAiClient();
    const prompt = `Act as a senior clinical pharmacist. Analyze the following list of medications for potential drug-drug interactions or contraindications.
    Medications: ${medications.join(", ")}
    ${context ? `Patient Context: ${context}` : ""}
    
    Provide a structured response:
    1. Severity (Critical, Warning, or Low)
    2. Description of the interaction
    3. Recommended action for the clinician
    
    Be precise and evidence-based. If no major interactions are found, state that the combination appears safe under standard monitoring.`;

    const response = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: prompt
    });

    return response.text;
  } catch (error) {
    console.error("Interaction Check Error:", error);
    return "Unable to perform interaction check at this time.";
  }
}

export interface TranscriptionResult {
  title: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  workingDiagnoses: string[];
}

export async function processMedicalConversation(transcript: string): Promise<TranscriptionResult> {
  try {
    const ai = getAiClient();
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
      model: FLASH_MODEL,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    
    const text = response.text;
    if (!text) throw new Error("No response from AI model");
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Transcription Processing Error:", error);
    throw error;
  }
}

export async function generateClinicalMedicationReview(medications: string[], conditions: string[]) {
  try {
    const ai = getAiClient();
    const prompt = `Provide a high-level clinical review for a patient with the following conditions and medication regimen.
    Conditions: ${conditions.join(", ")}
    Medications: ${medications.join(", ")}
    
    Key Focus:
    - Therapeutic alignment (Are conditions appropriately covered?)
    - Potential gaps in care
    - Optimization suggestions (e.g., dosage timing, newer alternatives)
    
    Output format: 2-3 concise clinical bullet points.`;

    const response = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: prompt
    });

    return response.text;
  } catch (error) {
    console.error("Clinical Review Error:", error);
    return "Clinical review generation failed.";
  }
}

export async function checkLabMonitoringRequirements(medicationName: string) {
  try {
    const ai = getAiClient();
    const prompt = `As a clinical decision support system, identify if the medication "${medicationName}" requires specific periodic laboratory monitoring (e.g., Warfarin requires INR, Statins require LFTs, Lithium requires serum levels).
    
    If monitoring is required, respond with a JSON object:
    {
      "required": true,
      "testName": "Exact Name of Lab Test",
      "rationale": "Brief clinical reason",
      "frequency": "Recommended frequency"
    }
    
    If no specific lab monitoring is standard for this drug, respond with:
    { "required": false }
    
    Return ONLY the JSON.`;

    const response = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: prompt
    });

    try {
      const text = response.text;
      const cleanedText = text.replace(/```json|```/g, "").trim();
      return JSON.parse(cleanedText);
    } catch (e) {
      console.error("Failed to parse Lab Correlation JSON");
      return { required: false };
    }
  } catch (error) {
    console.error("Lab Monitoring Check Error:", error);
    return { required: false };
  }
}
