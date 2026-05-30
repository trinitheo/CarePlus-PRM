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
    return "Instructions currently unavailable. Please consult your physician.";
  }
}

export async function checkDrugInteractions(medications: string[], context?: string) {
  try {
    const prompt = `Act as a senior clinical pharmacist. Analyze the following list of medications for potential drug-drug interactions or contraindications.
    Medications: ${medications.join(", ")}
    ${context ? `Patient Context: ${context}` : ""}
    
    Provide a structured response:
    1. Severity (Critical, Warning, or Low)
    2. Description of the interaction
    3. Recommended action for the clinician
    
    Be precise and evidence-based. If no major interactions are found, state that the combination appears safe under standard monitoring.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("Interaction Check Error:", error);
    return "Unable to perform interaction check at this time.";
  }
}

export async function generateClinicalMedicationReview(medications: string[], conditions: string[]) {
  try {
    const prompt = `Provide a high-level clinical review for a patient with the following conditions and medication regimen.
    Conditions: ${conditions.join(", ")}
    Medications: ${medications.join(", ")}
    
    Key Focus:
    - Therapeutic alignment (Are conditions appropriately covered?)
    - Potential gaps in care
    - Optimization suggestions (e.g., dosage timing, newer alternatives)
    
    Output format: 2-3 concise clinical bullet points.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("Clinical Review Error:", error);
    return "Clinical review generation failed.";
  }
}

export async function checkLabMonitoringRequirements(medicationName: string) {
  try {
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
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    try {
      const cleanedText = response.text.replace(/```json|```/g, "").trim();
      return JSON.parse(cleanedText);
    } catch (e) {
      console.error("Failed to parse Lab Correlation JSON:", response.text);
      return { required: false };
    }
  } catch (error) {
    console.error("Lab Monitoring Check Error:", error);
    return { required: false };
  }
}

export async function generateAdherenceSimulationReport(adherenceLevel: number, conditions: string[], medications: string[]) {
  try {
    const prompt = `Act as an encouraging health coach and medical supervisor. A patient has a current simulated adherence rate of ${adherenceLevel}% to their treatment plan.
    Patient Conditions: ${conditions.join(', ')}
    Medications: ${medications.join(', ')}

    Analyze this virtual level of adherence (${adherenceLevel}%). Show:
    1. Chronological progression and likely outcomes of continuing at this rate (risk vs success).
    2. Specific lifestyle recommendations and behavioral modifications to improve adherence or manage symptoms (nutrition, tracking).
    3. An encouraging, empathetic clinical summary.
    
    Make the tone accessible, empathetic, but scientifically grounded. Return clean, concise markdown output with brief headers and bullet points. Keep it to around 150 words.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("Adherence Report Generation Error:", error);
    return "Simulation report currently unavailable. Please continue taking your medications as prescribed and check in with your provider.";
  }
}

export async function generatePlainLanguageSummary(soapNote: {
  title?: string;
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  icd10Codes?: string[];
  content?: string;
}) {
  try {
    const prompt = `As a compassionate primary care physician, convert this highly technical clinician-only SOAP Encounter Note into a friendly, clear, plain-language patient summary.

    Encounter Title: ${soapNote.title || 'Clinical Consultation'}
    Subjective (Patient's reported context): ${soapNote.subjective || soapNote.content || 'None reported'}
    Objective (Clinician physical observations & vitals): ${soapNote.objective || 'None logged'}
    Assessment (Medical diagnosis & clinical understanding): ${soapNote.assessment || 'None logged'}
    Plan (Treatment instructions, tests, next steps): ${soapNote.plan || 'No plan specified'}
    ICD-10 Diagnostic Codes: ${(soapNote.icd10Codes || []).join(', ') || 'None'}

    Follow these rules:
    - REDACT and do NOT mention any overly dry clinical jargon or sensitive internal clinician-only shorthand in its raw form. Convert them explaining what they mean in normal human words.
    - Translate any ICD-10 codes into plain, comforting terms (e.g., E08/E11 means Type 2 Diabetes, E28.2 means PCOS) and explain them briefly in 1 sentence.
    - Provide an encouraging "Patient-Facing Summary" explaining:
      1. What We Discussed/What You Reported
      2. What We Measured/Observed
      3. What This Means (Our Assessment in simple terms)
      4. Your Simple Action Plan (Step-by-step next steps)
    - Keep the tone empathetic, accessible, clear, and reassuring. Keep the total word count under 250 words, using clean markdown with bullet points.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("Plain Language Generation Error:", error);
    return "Plain English summary is currently being compiled. Please refer to your Action Plan or contact your care team.";
  }
}

