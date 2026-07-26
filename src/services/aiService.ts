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

export interface SchedulingAgentContext {
  appointments: any[];
  patients: any[];
  providers: any[];
  rooms: any[];
  selectedDate?: string;
  currentUserRole?: string;
}

export interface SchedulingAgentResult {
  summary: string;
  intent: 'SCHEDULE' | 'CANCEL' | 'RESCHEDULE' | 'CHECK_SLOTS' | 'ANALYZE_SCHEDULE' | 'BATCH_CANCEL' | 'GENERAL_QUERY';
  proposedAction?: {
    type: 'create_appointment' | 'cancel_appointment' | 'reschedule_appointment' | 'batch_cancel';
    patientId?: string;
    patientName?: string;
    providerId?: string;
    providerName?: string;
    appointmentId?: string;
    time?: string;
    duration?: number;
    visitType?: 'clinic' | 'virtual' | 'telehealth';
    reason?: string;
    priority?: 'routine' | 'urgent' | 'emergency';
    cancellationReason?: string;
    roomId?: string;
    affectedCount?: number;
    targetDate?: string;
  };
  conflicts?: string[];
  suggestedSlots?: Array<{ time: string; date: string; providerName: string }>;
  insights?: string[];
}

export async function processSchedulingAgentQuery(
  userQuery: string,
  context: SchedulingAgentContext
): Promise<SchedulingAgentResult> {
  try {
    const promptDate = context.selectedDate || new Date().toISOString().split('T')[0];
    
    // Prepare concise context representations
    const patientsList = context.patients.slice(0, 30).map(p => ({
      id: p.id,
      name: p.name || `${p.firstName || ''} ${p.lastName || ''}`.trim() || p.id,
      mrn: p.mrn
    }));

    const providersList = context.providers.map(pr => ({
      id: pr.id || pr.userId,
      name: pr.name || pr.displayName || 'Clinician',
      role: pr.role
    }));

    const activeAppts = context.appointments
      .filter(a => a.status !== 'cancelled')
      .slice(0, 30)
      .map(a => ({
        id: a.id,
        patientId: a.patientId,
        providerId: a.providerId,
        time: a.time,
        status: a.status,
        reason: a.reason,
        visitType: a.visitType
      }));

    const prompt = `You are CarePlus-PRM's Intelligent Scheduling & Cancellation Operations Assistant for Front Desk and Administrative staff.
Context Date for actions: ${promptDate}. Current user role: ${context.currentUserRole || 'front_desk'}.

USER COMMAND / REQUEST: "${userQuery}"

AVAILABLE CLINIC DATA:
- PATIENTS DATABASE (${patientsList.length} items): ${JSON.stringify(patientsList)}
- PROVIDERS / CLINICIANS: ${JSON.stringify(providersList)}
- ACTIVE APPOINTMENTS (Sample): ${JSON.stringify(activeAppts)}
- AVAILABLE ROOMS: ${JSON.stringify(context.rooms.map(r => ({ id: r.id, name: r.name })))}

YOUR TASK:
Analyze the user command and extract the exact administrative intent and parameters.
Determine if the action involves:
1. SCHEDULE (Creating a new appointment for a patient)
2. CANCEL (Cancelling an existing appointment, logging a valid cancellation reason, releasing rooms)
3. RESCHEDULE (Moving an appointment to a new date/time)
4. CHECK_SLOTS (Finding open time slots for a provider or room)
5. BATCH_CANCEL (Cancelling multiple appointments for a provider/day)
6. ANALYZE_SCHEDULE (Summarizing schedule load, cancellation risks, wait times)
7. GENERAL_QUERY (Answering questions about the schedule)

CRITICAL MATCHING RULES:
- Find patient matches by name or MRN from the Patients Database. If exact patient ID isn't found, pick the closest matching patient or specify their name.
- Find provider matches by name from the Providers list.
- For cancellations: locate the matching active appointment ID by patient name or appointment details.
- For dates/times: default to context date (${promptDate}) if relative (e.g. "today", "tomorrow", "next Monday"). Use ISO format (YYYY-MM-DDTHH:mm:ss.000Z).
- Check for potential conflicts (e.g., double booking provider or patient at the same time).

RESPOND ONLY IN VALID JSON matching this exact structure:
{
  "intent": "SCHEDULE" | "CANCEL" | "RESCHEDULE" | "CHECK_SLOTS" | "ANALYZE_SCHEDULE" | "BATCH_CANCEL" | "GENERAL_QUERY",
  "summary": "Clear 1-2 sentence executive explanation of what the agent prepared or determined.",
  "proposedAction": {
    "type": "create_appointment" | "cancel_appointment" | "reschedule_appointment" | "batch_cancel",
    "patientId": "matching patient id",
    "patientName": "patient full name",
    "providerId": "matching provider id",
    "providerName": "provider full name",
    "appointmentId": "matching appt id for cancel/reschedule",
    "time": "ISO date-time string (e.g. 2026-07-26T10:00:00.000Z)",
    "duration": 30,
    "visitType": "clinic" | "telehealth",
    "reason": "Appointment reason or clinical visit notes",
    "priority": "routine" | "urgent" | "emergency",
    "cancellationReason": "Exact cancellation reason or policy code",
    "roomId": "assigned room id or Room-1"
  },
  "conflicts": ["List of any detected time overlap warnings or policy notes"],
  "suggestedSlots": [
    { "time": "09:00 AM", "date": "${promptDate}", "providerName": "Dr. Name" }
  ],
  "insights": [
    "Useful operational tip or patient reminder"
  ]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
    });

    const cleanedText = response.text.replace(/```json|```/g, "").trim();
    const parsed: SchedulingAgentResult = JSON.parse(cleanedText);
    return parsed;
  } catch (error) {
    console.error("Scheduling Agent AI Error:", error);
    return {
      intent: 'GENERAL_QUERY',
      summary: "I analyzed your request, but need clarification to finalize the schedule action. Please verify patient or provider details.",
      insights: ["You can specify patient name, provider, and target time (e.g., 'Cancel John Doe appointment tomorrow at 10 AM')."]
    };
  }
}

