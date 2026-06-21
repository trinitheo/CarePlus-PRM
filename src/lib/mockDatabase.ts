
import { AppRole } from '../services/rbacService';

export interface MockDb {
  users: Record<string, any>;
  roles: Record<string, any>;
  patients: Record<string, any>;
  clinical_records: Record<string, any[]>;
  prescriptions: Record<string, any[]>;
  investigations: Record<string, any[]>;
  procedures: Record<string, any[]>;
  vitals: Record<string, any[]>;
  interactions: Record<string, any[]>;
  appointments: any[];
  clinical_intakes: Record<string, any[]>;
  rooms: any[];
  inventory: any[];
  tasks: any[];
  reminders: any[];
  messages: any[];
  audit_logs: any[];
  sops: any[];
  charges: any[];
  invoices: any[];
  checkins: any[];
  consents: any[];
  clinical_templates: any[];
  results: any[];
  referrals: Record<string, any[]>;
  care_teams: Record<string, any[]>;
}

const INITIAL_DB: MockDb = {
  users: {
    'uid-patient-001': {
      id: 'uid-patient-001',
      email: 'm.everett@personal.com',
      displayName: 'Marcus Everett',
      role: 'patient',
      patientId: 'pat-marcus-001',
      avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=200&auto=format&fit=crop',
      createdAt: '2025-01-08T09:10:00Z'
    },
    'uid-frontdesk-001': {
      id: 'uid-frontdesk-001',
      email: 'e.rostova@careplus.health',
      displayName: 'Elena Rostova',
      role: 'front_desk',
      phone: '(555) 234-5678',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop',
      createdAt: '2025-01-08T09:00:00Z'
    },
    'uid-nurse-001': {
      id: 'uid-nurse-001',
      email: 't.rivera@careplus.health',
      displayName: 'Tamara Rivera, RN',
      role: 'nurse',
      phone: '(555) 345-6789',
      licenseNumber: 'RN-482019',
      avatar: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?q=80&w=200&auto=format&fit=crop',
      createdAt: '2025-01-08T09:00:00Z'
    },
    'uid-clinician-001': {
      id: 'uid-clinician-001',
      email: 'g.theogate@careplus.health',
      displayName: 'Dr. Gregory Theogate, MD',
      role: 'clinician',
      specialty: 'Rheumatology',
      phone: '(555) 456-7890',
      npi: '1982736450',
      dea: 'XT9872543',
      avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da60710?q=80&w=200&auto=format&fit=crop',
      createdAt: '2025-01-08T09:00:00Z'
    },
    'uid-admin-001': {
      id: 'uid-admin-001',
      email: 'a.pendelton@careplus.health',
      displayName: 'Arthur Pendelton',
      role: 'admin',
      phone: '(555) 567-8901',
      avatar: 'https://images.unsplash.com/photo-1537368910025-7003507965b6?q=80&w=200&auto=format&fit=crop',
      createdAt: '2025-01-08T09:00:00Z'
    }
  },
  roles: {
    'uid-patient-001': { userId: 'uid-patient-001', role: 'patient', assignedBy: 'system' },
    'uid-frontdesk-001': { userId: 'uid-frontdesk-001', role: 'front_desk', assignedBy: 'system' },
    'uid-nurse-001': { userId: 'uid-nurse-001', role: 'nurse', assignedBy: 'system' },
    'uid-clinician-001': { userId: 'uid-clinician-001', role: 'clinician', assignedBy: 'system' },
    'uid-admin-001': { userId: 'uid-admin-001', role: 'admin', assignedBy: 'system' }
  },
  patients: {
    'pat-marcus-001': {
      id: 'pat-marcus-001',
      patientId: 'pat-marcus-001',
      firstName: 'Marcus',
      lastName: 'Everett',
      name: 'Marcus Everett',
      dateOfBirth: '1985-03-14',
      dob: '1985-03-14',
      gender: 'Male',
      email: 'm.everett@personal.com',
      phone: '(555) 123-4567',
      status: 'active',
      authorId: 'uid-clinician-001',
      authorizedUserIds: [],
      appleHealthConnected: true,
      appleHealthConnectedAt: '2025-01-10T14:22:00Z',
      appleHealthPlatform: 'Apple Health',
      appleHealthPermissionsGranted: ['HeartRate', 'BloodPressure', 'BodyMass', 'BloodGlucose', 'RestingHeartRate', 'StepCount', 'SleepAnalysis', 'OxygenSaturation'],
      appleHealthLastSyncedAt: '2025-05-29T07:30:00Z',
      appleHealthDeviceModel: 'Apple Watch Series 9 + iPhone 15 Pro',
      appleHealthDataSourceId: 'com.apple.health::uid-patient-001',
      conditions: ['Rheumatoid Arthritis'],
      createdAt: '2025-01-08T09:10:00Z',
      healthScore: 78,
      wearable: {
        sleepHours: { value: 7.2, lastUpdated: Date.now() },
        dailySteps: { value: 8500, lastUpdated: Date.now() },
        bloodGlucose: { value: 5.4, lastUpdated: Date.now() }
      },
      manual: {
        medsDays: { value: 2, lastUpdated: Date.now() },
        aiGoalsCompleted: { value: true, lastUpdated: Date.now() },
        willAttend: { value: true, lastUpdated: Date.now() }
      },
      activeNudge: {
        title: 'Pending Labs',
        description: 'Complete FBC before your next dose',
        type: 'warning',
        actionRequired: true,
        dueDate: new Date(Date.now() + 86400000).toISOString()
      },
      actionPlan: [
        { id: '1', task: 'Take Methotrexate 15mg', completed: false, category: 'Medication' },
        { id: '2', task: 'Complete daily joint exercises', completed: true, category: 'Physical Therapy' }
      ]
    },
    'pat-vance-001': {
      id: 'pat-vance-001',
      patientId: 'pat-vance-001',
      firstName: 'Eleanor',
      lastName: 'Vance',
      name: 'Eleanor Vance',
      dob: '1992-06-15',
      gender: 'Female',
      email: 'e.vance@example.com',
      phone: '(555) 765-4321',
      status: 'active',
      conditions: ['Essential Hypertension'],
      createdAt: '2025-01-08T09:15:00Z'
    },
    'pat-jenkins-001': {
      id: 'pat-jenkins-001',
      patientId: 'pat-jenkins-001',
      firstName: 'Sophia',
      lastName: 'Jenkins',
      name: 'Sophia Jenkins',
      dob: '1961-11-20',
      gender: 'Female',
      email: 's.jenkins@example.com',
      phone: '(555) 321-7654',
      status: 'active',
      conditions: ['Osteoarthritis'],
      createdAt: '2025-01-08T09:20:00Z'
    }
  },
  clinical_records: {
    'pat-marcus-001': [
      {
        id: 'cr-001',
        patientId: 'pat-marcus-001',
        authorId: 'uid-clinician-001',
        title: 'Initial Rheumatology Screening',
        authorName: 'Dr. Gregory Theogate, MD',
        specialty: 'Rheumatology',
        status: 'signed',
        subjective: 'Mr. Everett, a 39-year-old male, presents with a 4-month history of bilateral symmetrical joint pain and morning stiffness lasting more than 1 hour, predominantly affecting the MCP and PIP joints of both hands and both wrists. He reports fatigue and mild swelling. No known family history of autoimmune disease. Non-smoker. Reports difficulty gripping objects and opening jars. Stiffness improves with activity throughout the day.',
        objective: 'Bilateral MCP and PIP joint tenderness on palpation — right > left. Soft tissue swelling noted at bilateral wrists. No warmth or erythema over joints. Grip strength reduced bilaterally (right 22 kg, left 19 kg; normal >35 kg). Full ROM preserved at larger joints. No nodules. Rheumatoid Factor and Anti-CCP ordered. X-rays of hands and wrists ordered.',
        assessment: 'Bilateral symmetrical polyarthritis with prolonged morning stiffness in an adult male. Clinical picture is suspicious for early Rheumatoid Arthritis. Differential includes: (1) Rheumatoid Arthritis, (2) Psoriatic Arthritis — no skin lesions noted, (3) Reactive Arthritis — no recent infection history. Serology and imaging pending to confirm.',
        plan: '1. Order RF, Anti-CCP, ESR, CRP, FBC, LFTs, UEC. 2. Order X-ray bilateral hands and wrists. 3. NSAIDs for symptomatic relief pending diagnosis — Naproxen 500mg BD PRN. 4. Follow-up in 4 weeks with investigation results. 5. Patient education re: joint protection, activity modification. 6. Refer to physiotherapy for baseline assessment.',
        icd10Codes: ['M13.0', 'R68.89'],
        createdAt: { seconds: 1736330700 },
        updatedAt: { seconds: 1736333100 }
      },
      {
        id: 'cr-002',
        patientId: 'pat-marcus-001',
        authorId: 'uid-clinician-001',
        title: 'Rheumatoid Arthritis Treatment Initiation',
        authorName: 'Dr. Gregory Theogate, MD',
        specialty: 'Rheumatology',
        status: 'signed',
        subjective: 'Mr. Everett returns with investigation results. Morning stiffness persists, averaging 90 minutes. He has been taking Naproxen 500mg BD with partial relief. Fatigue remains significant. Reports difficulty with fine motor tasks at work as a data analyst. Denies rash, eye symptoms, or bowel changes.',
        objective: 'RF: 148 IU/mL (positive, reference <14). Anti-CCP: 112 U/mL (strongly positive, reference <7). CRP: 28 mg/L (elevated). ESR: 54 mm/hr (elevated). FBC: mild normocytic anaemia (Hb 11.8 g/dL). LFTs and UEC: within normal limits. X-ray bilateral hands: periarticular osteopenia at MCP joints bilaterally, no erosions — consistent with early RA. Active synovitis bilateral MCP joints (2,3,4), bilateral PIP joints (2,3), bilateral wrists. DAS28-CRP score: 5.1 (high disease activity).',
        assessment: 'Rheumatoid Arthritis, seropositive, bilateral hand and wrist involvement, high disease activity (DAS28-CRP 5.1). No erosions at this stage — early intervention critical to prevent joint destruction. Mild anaemia of chronic disease.',
        plan: '1. Commence Methotrexate 10mg orally once weekly. 2. Prescribe Folic Acid 5mg orally once weekly (24h post-MTX). 3. Prescribe Prednisolone 10mg daily — bridge therapy, taper over 6 weeks. 4. Cease Naproxen. 5. e-Prescriptions sent to ITH Pharmacy. 6. LFTs and FBC in 4 weeks, then every 3 months. 7. Formal physiotherapy referral. 8. Follow-up in 6 weeks. 9. Apple Health integration confirmed — continue daily monitoring via Apple Watch.',
        icd10Codes: ['M05.79', 'D63.8'],
        createdAt: { seconds: 1738752600 },
        updatedAt: { seconds: 1738755000 }
      },
      {
        id: 'cr-003',
        patientId: 'pat-marcus-001',
        authorId: 'uid-clinician-001',
        title: 'Rheumatoid Arthritis 3-Month Follow-Up',
        authorName: 'Dr. Gregory Theogate, MD',
        specialty: 'Rheumatology',
        status: 'signed',
        subjective: '3-month review. Mr. Everett reports significant improvement. Morning stiffness now 15–20 minutes (down from 90 minutes at diagnosis). Managing full work days with ergonomic adaptations in place. No adverse effects from Methotrexate. Prednisolone taper completed without flare. Fatigue much improved. Apple Health HR trend shared — resting HR tracking from 88 bpm down to 70 bpm over the past 10 weeks.',
        objective: 'Joint examination: Reduced synovitis — 3 active joints vs 9 at diagnosis (bilateral MCP 2–3, right wrist). Grip strength R 32kg / L 29kg (improved from 22/19 at baseline). DAS28-CRP: 3.1 (moderate disease activity — down from 5.1). CRP: 9 mg/L (improving). FBC: Hb 12.6 g/dL (anaemia resolving). LFTs: within normal limits — Methotrexate well tolerated. Musculoskeletal ultrasound April 15: reduced synovial thickening bilaterally, no erosions identified.',
        assessment: 'Rheumatoid Arthritis, seropositive — responding well to Methotrexate. DAS28 reduced from 5.1 to 3.1 at 10 weeks. Target is DAS28 <2.6 (remission). Escalate Methotrexate dose. Anaemia of chronic disease resolving. Continue physiotherapy.',
        plan: '1. Escalate Methotrexate to 15mg weekly — e-prescription sent to ITH Pharmacy. 2. Continue Folic Acid 5mg weekly. 3. Prednisolone course completed — do not restart unless flare. 4. Repeat LFTs, FBC, CRP in 3 months. 5. MRI bilateral hands ordered to assess subclinical synovitis and cartilage integrity. 6. Continue physiotherapy — monthly maintenance. 7. Target: DAS28 <2.6 at 6-month review. 8. Apple Health monitoring to continue — patient to flag HR spikes or sleep disruption as early flare indicators.',
        icd10Codes: ['M05.79'],
        createdAt: { seconds: 1742381100 },
        updatedAt: { seconds: 1742382600 }
      }
    ]
  },
  prescriptions: {
    'pat-marcus-001': [
      {
        id: 'rx-001',
        patientId: 'pat-marcus-001',
        authorId: 'uid-clinician-001',
        pharmacy: 'ITH Pharmacy',
        prescriptionType: 'ePrescription',
        medicationName: 'Naproxen',
        dosage: '500mg',
        route: 'oral',
        frequency: 'Twice daily (BD)',
        duration: '4',
        durationUnit: 'weeks',
        refills: 0,
        sig: 'Take one 500mg tablet by mouth twice daily with food as needed for joint pain. Cease if gastrointestinal discomfort occurs. Not for long-term use.',
        status: 'completed',
        createdAt: { seconds: 1736331600 }
      },
      {
        id: 'rx-002',
        patientId: 'pat-marcus-001',
        authorId: 'uid-clinician-001',
        pharmacy: 'ITH Pharmacy',
        prescriptionType: 'ePrescription',
        medicationName: 'Methotrexate',
        dosage: '15mg',
        route: 'oral',
        frequency: 'Once weekly (every Monday)',
        duration: '3',
        durationUnit: 'months',
        refills: 2,
        sig: 'Take three 5mg tablets (15mg total) by mouth ONCE WEEKLY on Monday. Do NOT take daily — weekly dosing only. Take with food. Escalated from 10mg at 3-month review. Dispense via ITH Pharmacy e-prescription.',
        status: 'active',
        createdAt: { seconds: 1742382900 }
      },
      {
        id: 'rx-003',
        patientId: 'pat-marcus-001',
        authorId: 'uid-clinician-001',
        pharmacy: 'ITH Pharmacy',
        prescriptionType: 'ePrescription',
        medicationName: 'Folic Acid',
        dosage: '5mg',
        route: 'oral',
        frequency: 'Once weekly (every Tuesday)',
        duration: '3',
        durationUnit: 'months',
        refills: 2,
        sig: 'Take one 5mg tablet by mouth once weekly on Tuesday — 24 hours after Methotrexate dose. This reduces Methotrexate side effects. Do not miss doses. Dispense via ITH Pharmacy e-prescription.',
        status: 'active',
        createdAt: { seconds: 1742382900 }
      },
      {
        id: 'rx-004',
        patientId: 'pat-marcus-001',
        authorId: 'uid-clinician-001',
        pharmacy: 'ITH Pharmacy',
        prescriptionType: 'ePrescription',
        medicationName: 'Prednisolone',
        dosage: '10mg',
        route: 'oral',
        frequency: 'Once daily (OD)',
        duration: '6',
        durationUnit: 'weeks',
        refills: 0,
        sig: 'Take one 10mg tablet by mouth once daily with breakfast. TAPER: 10mg x 2 weeks, then 7.5mg x 2 weeks, then 5mg x 1 week, then 2.5mg x 1 week, then cease. Do NOT stop abruptly. Dispense via ITH Pharmacy e-prescription.',
        status: 'completed',
        createdAt: { seconds: 1738754400 }
      }
    ]
  },
  investigations: {
    'pat-marcus-001': [
      { id: 'inv-001', patientId: 'pat-marcus-001', authorId: 'uid-clinician-001', category: 'Serology', testName: 'Rheumatoid Factor (RF)', priority: 'routine', indication: 'Bilateral symmetrical polyarthritis — rule out Rheumatoid Arthritis', Instructions: 'Fasting not required. Collect serum.', status: 'completed', createdAt: '2025-01-08T10:10:00Z' },
      { id: 'inv-002', patientId: 'pat-marcus-001', authorId: 'uid-clinician-001', category: 'Serology', testName: 'Anti-Cyclic Citrullinated Peptide (Anti-CCP)', priority: 'routine', indication: 'Bilateral symmetrical polyarthritis — RA-specific autoantibody screen', Instructions: 'Serum. Order with RF.', status: 'completed', createdAt: '2025-01-08T10:10:00Z' },
      { id: 'inv-003', patientId: 'pat-marcus-001', authorId: 'uid-clinician-001', category: 'Inflammatory Markers', testName: 'ESR & CRP (Inflammatory Panel)', priority: 'routine', indication: 'Inflammatory arthritis — quantify systemic inflammation', Instructions: 'EDTA tube for ESR; serum for CRP.', status: 'completed', createdAt: '2025-01-08T10:10:00Z' },
      { id: 'inv-004', patientId: 'pat-marcus-001', authorId: 'uid-clinician-001', category: 'Haematology', testName: 'Full Blood Count (FBC)', priority: 'routine', indication: 'Baseline — anaemia of chronic disease screen; pre-DMARD baseline', Instructions: 'EDTA tube.', status: 'completed', createdAt: '2025-01-08T10:10:00Z' },
      { id: 'inv-005', patientId: 'pat-marcus-001', authorId: 'uid-clinician-001', category: 'Biochemistry', testName: 'Liver Function Tests (LFTs) & UEC', priority: 'routine', indication: 'Baseline liver and renal function — required prior to Methotrexate initiation', Instructions: 'Serum. Fasting not required.', status: 'completed', createdAt: '2025-01-08T10:10:00Z' },
      { id: 'inv-006', patientId: 'pat-marcus-001', authorId: 'uid-clinician-001', category: 'Radiology', testName: 'X-Ray Bilateral Hands and Wrists (PA view)', priority: 'routine', indication: 'Suspected RA — assess for periarticular osteopenia, joint space narrowing, erosions', Instructions: 'Both hands in PA projection. Compare bilateral.', status: 'completed', createdAt: '2025-01-08T10:15:00Z' },
      { id: 'inv-007', patientId: 'pat-marcus-001', authorId: 'uid-clinician-001', category: 'Monitoring', testName: 'FBC, LFTs, CRP (4-week)', priority: 'routine', indication: '4-week Methotrexate monitoring — hepatotoxicity and myelosuppression screen', Instructions: 'Fasting not required.', status: 'completed', createdAt: '2025-02-05T11:15:00Z' },
      { id: 'inv-008', patientId: 'pat-marcus-001', authorId: 'uid-clinician-001', category: 'Monitoring', testName: 'FBC, LFTs, CRP (3-month)', priority: 'routine', indication: 'Quarterly Methotrexate monitoring following dose escalation to 15mg weekly', Instructions: 'Fasting not required.', status: 'pending', createdAt: '2025-03-19T11:00:00Z' },
      { id: 'inv-009', patientId: 'pat-marcus-001', authorId: 'uid-clinician-001', category: 'Radiology', testName: 'MRI Bilateral Hands and Wrists with Contrast', priority: 'routine', indication: 'RA disease monitoring — assess subclinical synovitis, cartilage integrity', Instructions: 'Gadolinium contrast required. Fast 4 hours prior.', status: 'ordered', createdAt: '2025-03-19T11:05:00Z' }
    ]
  },
  procedures: {
    'pat-marcus-001': [
      { id: 'proc-001', patientId: 'pat-marcus-001', authorId: 'uid-clinician-001', procedureName: 'Musculoskeletal Ultrasound — Bilateral Hands and Wrists', priority: 'routine', targetDate: '2025-04-15', preparation: 'No preparation required. Wear loose-fitting clothing.', status: 'completed', createdAt: '2025-02-05T11:40:00Z' },
      { id: 'proc-002', patientId: 'pat-marcus-001', authorId: 'uid-clinician-001', procedureName: 'MRI Bilateral Hands and Wrists with Contrast', priority: 'routine', targetDate: '2025-06-18', preparation: 'Fast 4 hours prior. Gadolinium contrast will be administered. No metal implants.', status: 'scheduled', createdAt: '2025-03-19T11:05:00Z' }
    ]
  },
  vitals: {
    'pat-marcus-001': [
      { id: 'vit-001', patientId: 'pat-marcus-001', authorId: 'uid-clinician-001', hr: 82, bp: '128/84', temp: 37.1, rr: 16, spo2: 98, glucose: 5.6, weight: 88.4, height: 178, bmi: 27.9, source: 'clinical', timestamp: 1736330400000, createdAt: '2025-01-08T09:30:00Z' },
      { id: 'vit-002', patientId: 'pat-marcus-001', authorId: 'uid-clinician-001', hr: 88, bp: '132/86', temp: 37.4, rr: 17, spo2: 97, glucose: 5.8, weight: 87.9, height: 178, bmi: 27.7, hba1c: 5.7, source: 'clinical', timestamp: 1738749000000, createdAt: '2025-02-05T10:15:00Z' },
      { id: 'vit-003', patientId: 'pat-marcus-001', authorId: 'uid-patient-001', hr: 79, bp: '127/83', temp: null, rr: null, spo2: 98, weight: 88.1, height: 178, bmi: 27.8, source: 'apple_health', device: 'Apple Watch Series 9', timestamp: 1739001600000, createdAt: '2025-02-08T07:20:00Z' },
      { id: 'vit-004', patientId: 'pat-marcus-001', authorId: 'uid-patient-001', hr: 76, bp: '126/82', temp: null, rr: null, spo2: 98, weight: 87.5, height: 178, bmi: 27.6, source: 'apple_health', device: 'Apple Watch Series 9', timestamp: 1740819600000, createdAt: '2025-03-01T07:14:00Z' },
      { id: 'vit-005', patientId: 'pat-marcus-001', authorId: 'uid-clinician-001', hr: 75, bp: '124/81', temp: 37.0, rr: 16, spo2: 98, glucose: 5.5, weight: 87.2, height: 178, bmi: 27.5, hba1c: 5.5, source: 'clinical', timestamp: 1742382600000, createdAt: '2025-03-19T10:00:00Z' },
      { id: 'vit-006', patientId: 'pat-marcus-001', authorId: 'uid-patient-001', hr: 73, bp: '123/81', temp: null, rr: null, spo2: 98, weight: 87.0, height: 178, bmi: 27.5, source: 'apple_health', device: 'Apple Watch Series 9', timestamp: 1743120000000, createdAt: '2025-03-28T06:40:00Z' },
      { id: 'vit-007', patientId: 'pat-marcus-001', authorId: 'uid-patient-001', hr: 72, bp: '122/80', temp: null, rr: null, spo2: 99, weight: 86.8, height: 178, bmi: 27.4, source: 'apple_health', device: 'Apple Watch Series 9', timestamp: 1744452000000, createdAt: '2025-04-12T06:55:00Z' },
      { id: 'vit-008', patientId: 'pat-marcus-001', authorId: 'uid-patient-001', hr: 70, bp: '121/79', temp: null, rr: null, spo2: 99, weight: 86.5, height: 178, bmi: 27.3, source: 'apple_health', device: 'Apple Watch Series 9', timestamp: 1746230400000, createdAt: '2025-05-03T07:10:00Z' },
      { id: 'vit-009', patientId: 'pat-marcus-001', authorId: 'uid-patient-001', hr: 69, bp: '120/78', temp: null, rr: null, spo2: 99, weight: 86.2, height: 178, bmi: 27.2, source: 'apple_health', device: 'Apple Watch Series 9', timestamp: 1747699200000, createdAt: '2025-05-20T07:02:00Z' }
    ]
  },
  interactions: {
    'pat-marcus-001': [
      { id: 'int-001', patientId: 'pat-marcus-001', authorId: 'uid-nurse-001', authorRole: 'nurse', type: 'pt', category: 'Initial Assessment', content: 'Initial physiotherapy assessment for Mr. Everett. Bilateral hand grip strength significantly reduced (R: 22kg, L: 19kg). DASH score: 41/100 (moderate disability). MCP and PIP joints tender bilaterally. Education provided: joint protection principles, activity pacing.', createdAt: '2025-01-22T11:00:00Z' },
      { id: 'int-002', patientId: 'pat-marcus-001', authorId: 'uid-nurse-001', authorRole: 'nurse', type: 'pt', category: 'Treatment Session', content: 'Second session. Patient commenced MTX and Prednisolone taper. Morning stiffness 60 minutes today. Grip strength: R 24kg / L 21kg. DASH: 38/100. Progressed to daily joint exercises and ergonomic training.', createdAt: '2025-02-19T11:00:00Z' },
      { id: 'int-003', patientId: 'pat-marcus-001', authorId: 'uid-nurse-001', authorRole: 'nurse', type: 'pt', category: 'Treatment Session', content: 'Third session. Patient typing for 90-minute blocks with adaptive equipment. Morning stiffness 30-40 minutes. Grip strength: R 28kg / L 25kg. DASH: 29/100.', createdAt: '2025-03-12T11:00:00Z' },
      { id: 'int-004', patientId: 'pat-marcus-001', authorId: 'uid-nurse-001', authorRole: 'nurse', type: 'pt', category: 'Review Session', content: '3-month review. Morning stiffness now 15-20 minutes. Grip strength R 32/L 29 kg. DASH: 18/100 (mild disability). Hydrotherapy introduced.', createdAt: '2025-04-16T11:00:00Z' },
      { id: 'int-005', patientId: 'pat-marcus-001', authorId: 'uid-nurse-001', authorRole: 'nurse', type: 'pt', category: 'Maintenance Session', content: 'Monthly maintenance session. Morning stiffness <15 minutes. Grip strength R 34/L 31. DASH: 12/100. Patient highly satisfied.', createdAt: '2025-05-21T11:00:00Z' },
      { id: 'int-006', patientId: 'pat-marcus-001', authorId: 'uid-clinician-001', authorRole: 'clinician', type: 'clinical', category: 'Pharmacy Communication', content: 'e-Prescriptions transmitted to ITH Pharmacy. Scripts issued: Methotrexate 10mg weekly, Folic Acid 5mg weekly, Prednisolone 10mg daily (tapering).', createdAt: '2025-02-06T09:00:00Z' },
      { id: 'int-007', patientId: 'pat-marcus-001', authorId: 'uid-nurse-001', authorRole: 'nurse', type: 'nursing', category: 'Medication Review', content: 'Nursing medication review call. Patient tolerated Methotrexate 10mg weekly with mild nausea on day of dose, resolving by evening. Folic acid taken correctly. Safety bloods satisfactory.', createdAt: '2025-03-05T14:00:00Z' },
      { id: 'int-008', patientId: 'pat-marcus-001', authorId: 'uid-nurse-001', authorRole: 'nurse', type: 'social_care', category: 'Workplace Support', content: 'Social care check-in at patient request. Discussed workplace accommodations: ergonomic equipment in place. Connected patient with local support groups.', createdAt: '2025-04-02T13:00:00Z' }
    ]
  },
  appointments: [
    {
      id: 'appt-marcus-001',
      patientId: 'pat-marcus-001',
      providerId: 'uid-clinician-001',
      providerName: 'Dr. Gregory Theogate, MD',
      time: new Date(new Date().setHours(10, 30, 0, 0)).toISOString(),
      reason: 'Rheumatoid Arthritis 6-Month Review',
      status: 'scheduled',
      visitType: 'in_clinic',
      priority: 'routine'
    },
    {
      id: 'appt-marcus-002',
      patientId: 'pat-marcus-001',
      providerId: 'uid-nurse-001',
      providerName: 'Tamara Rivera, RN',
      time: new Date(Date.now() + 86400000).toISOString(),
      reason: 'Hand & Wrist MSK Physical Therapy Routine',
      status: 'scheduled',
      visitType: 'in_clinic',
      priority: 'routine'
    },
    {
      id: 'appt-vance-001',
      patientId: 'pat-vance-001',
      providerId: 'uid-clinician-001',
      providerName: 'Dr. Gregory Theogate, MD',
      time: new Date(new Date().setHours(8, 15, 0, 0)).toISOString(),
      reason: 'Hypertension Status Assessment',
      status: 'completed',
      visitType: 'in_clinic',
      priority: 'routine'
    },
    {
      id: 'appt-jenkins-001',
      patientId: 'pat-jenkins-001',
      providerId: 'uid-nurse-001',
      providerName: 'Tamara Rivera, RN',
      time: new Date(new Date().setHours(12, 0, 0, 0)).toISOString(),
      reason: 'Osteoarthritis Joint Injections Guidance',
      status: 'checked_in',
      visitType: 'in_clinic',
      priority: 'urgent'
    },
    {
      id: 'appt-marcus-003',
      patientId: 'pat-marcus-001',
      providerId: 'uid-clinician-001',
      providerName: 'Dr. Gregory Theogate, MD',
      time: new Date(new Date().setHours(15, 45, 0, 0)).toISOString(),
      reason: 'Diagnostic MRI Results Discussion',
      status: 'scheduled',
      visitType: 'telehealth',
      priority: 'routine'
    }
  ],
  clinical_intakes: {
    'pat-marcus-001': [
      {
        id: 'initial-intake',
        patientId: 'pat-marcus-001',
        chiefComplaint: 'Management of bilateral symmetrical joint pain and morning stiffness.',
        historyOfPresentIllness: 'Marcus is a 39-year-old male presenting with a 4-month history of bilateral symmetrical rheumatologic symptoms.',
        medicalHistory: 'Early Rheumatoid Arthritis',
        medications: 'Methotrexate, Folic Acid, Prednisolone',
        createdAt: { seconds: 1736331000 }
      }
    ]
  },
  rooms: [
    { id: 'room-101', name: 'Exam Room 101 (Rheumatology Specialty)', status: 'available', currentAppointmentId: null },
    { id: 'room-102', name: 'Exam Room 102 (Nursing Triage)', status: 'available', currentAppointmentId: null }
  ],
  inventory: [
    { id: 'inv-item-001', name: 'Methotrexate 5mg tablets', stock: 1200, unit: 'Tablets', expiryDate: '2027-12-01', location: 'Section B-3', status: 'normal' },
    { id: 'inv-item-002', name: 'Prednisolone 10mg tablets', stock: 800, unit: 'Tablets', expiryDate: '2027-08-15', location: 'Section B-4', status: 'normal' },
    { id: 'inv-item-003', name: 'Naproxen 500mg tablets', stock: 50, unit: 'Tablets', expiryDate: '2026-10-10', location: 'Section B-5', status: 'warning' }
  ],
  tasks: [
    { id: 'task-item-001', title: 'Verify copay & insurance coverage prior to appointment', description: 'Confirm with Blue Shield of California for Marcus Everett.', status: 'pending', assignedTo: 'uid-frontdesk-001', category: 'administrative', dueDate: new Date(Date.now() + 86400000).toISOString() }
  ],
  reminders: [],
  messages: [
    {
      id: 'msg-001',
      fromUserId: 'uid-patient-001',
      fromUserName: 'Marcus Everett',
      fromRole: 'patient',
      toUserId: 'uid-clinician-001',
      toUserName: 'Dr. Gregory Theogate, MD',
      toRole: 'clinician',
      subject: 'Folic Acid Refill Request',
      body: 'Hello Dr. Theogate, I am seeking a refill of my Folic Acid 5mg prescription. The current active course is going very well.',
      read: false,
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      status: 'sent'
    },
    {
      id: 'msg-002',
      fromUserId: 'uid-clinician-001',
      fromUserName: 'Dr. Gregory Theogate, MD',
      fromRole: 'clinician',
      toUserId: 'uid-nurse-001',
      toUserName: 'Tamara Rivera, RN',
      toRole: 'nurse',
      subject: 'Marcus Everett MSK PT Taper',
      body: 'Hi Tamara, please assess Marcus during his PT session today. We may escalate his Methotrexate based on morning stiffness report.',
      read: false,
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      status: 'sent'
    },
    {
      id: 'msg-003',
      fromUserId: 'uid-nurse-001',
      fromUserName: 'Tamara Rivera, RN',
      fromRole: 'nurse',
      toUserId: 'uid-patient-001',
      toUserName: 'Marcus Everett',
      toRole: 'patient',
      subject: 'Upcoming PT Session Prep',
      body: 'Hi Marcus, just a reminder to wear comfortable clothing for our physical therapy assessment today. See you at lunchtime!',
      read: false,
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      status: 'sent'
    },
    {
      id: 'msg-004',
      fromUserId: 'uid-frontdesk-001',
      fromUserName: 'Elena Rostova',
      fromRole: 'front_desk',
      toUserId: 'uid-admin-001',
      toUserName: 'Arthur Pendelton',
      toRole: 'admin',
      subject: 'Governance SOP Review Signed',
      body: 'Arthur, the latest infection control SOP version matches clinical feedback and has been successfully signed by Doctor Theogate. Ready for publishing.',
      read: false,
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      status: 'sent'
    },
    {
      id: 'msg-005',
      fromUserId: 'uid-clinician-001',
      fromUserName: 'Dr. Gregory Theogate, MD',
      fromRole: 'clinician',
      toUserId: 'uid-frontdesk-001',
      toUserName: 'Elena Rostova',
      toRole: 'front_desk',
      subject: 'In-Hand Triage Queue Alert',
      body: 'Elena, we have a high patient volume expected at midday today. Please prioritize copay check-in flow so that Nurse Tamara can intake promptly.',
      read: false,
      createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
      status: 'sent'
    }
  ],
  audit_logs: [],
  sops: [],
  charges: [],
  invoices: [],
  checkins: [],
  consents: [],
  clinical_templates: [],
  results: [],
  referrals: {
    'pat-marcus-001': [
      { id: 'ref-001', patientId: 'pat-marcus-001', authorId: 'uid-clinician-001', fromProvider: 'Dr. Gregory Theogate, MD — Rheumatology', toProvider: 'Tamara Rivera, RN', specialty: 'Physiotherapy & Rehabilitation', reason: 'Structured program for seropositive RA physical therapy.', urgency: 'routine', status: 'completed', createdAt: '2025-01-08T10:30:00Z' }
    ]
  },
  care_teams: {
    'pat-marcus-001': [
      { userId: 'uid-clinician-001', role: 'primary_clinician', status: 'active' },
      { userId: 'uid-nurse-001', role: 'case_manager', status: 'active' }
    ]
  }
};

// Global singleton for the mock DB in development
const globalForMock = globalThis as unknown as { mockDb: MockDb };

function loadMockDb(): MockDb {
  if (globalForMock.mockDb) return globalForMock.mockDb;
  
  try {
    const saved = localStorage.getItem('careplus_mockDb');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn("Failed to load mockDb from localStorage", e);
  }
  return INITIAL_DB;
}

export const mockDb = loadMockDb();
if (process.env.NODE_ENV !== 'production') {
  globalForMock.mockDb = mockDb;
}

export function persistMockDb() {
  try {
    localStorage.setItem('careplus_mockDb', JSON.stringify(mockDb));
  } catch (e) {
    console.warn("Failed to save mockDb to localStorage", e);
  }
}


export const mockDbService = {
  getCollection: (path: keyof MockDb, patientId?: string): any[] => {
    if (patientId) {
      return (mockDb[path] as Record<string, any[]>)[patientId] || [];
    }
    const val = mockDb[path];
    if (Array.isArray(val)) return val;
    return [];
  },
  
  addItem: (path: keyof MockDb, data: any, patientId?: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    const item = { ...data, id, createdAt: { seconds: Math.floor(Date.now() / 1000) } };
    
    if (patientId) {
      if (!(mockDb[path] as Record<string, any[]>)[patientId]) {
        (mockDb[path] as Record<string, any[]>)[patientId] = [];
      }
      (mockDb[path] as Record<string, any[]>)[patientId].unshift(item);
    } else if (Array.isArray(mockDb[path])) {
      (mockDb[path] as any[]).unshift(item);
    }
    
    persistMockDb();
    return id;
  },

  updateItem: (path: keyof MockDb, id: string, data: any, patientId?: string) => {
    if (patientId) {
      const items = (mockDb[path] as Record<string, any[]>)[patientId] || [];
      const index = items.findIndex(i => i.id === id);
      if (index !== -1) {
        items[index] = { ...items[index], ...data, updatedAt: { seconds: Math.floor(Date.now() / 1000) } };
      }
    } else if (Array.isArray(mockDb[path])) {
      const items = mockDb[path] as any[];
      const index = items.findIndex((i: any) => i.id === id);
      if (index !== -1) {
        items[index] = { ...items[index], ...data, updatedAt: { seconds: Math.floor(Date.now() / 1000) } };
      }
    } else if (mockDb[path] && typeof mockDb[path] === 'object' && !Array.isArray(mockDb[path])) {
      (mockDb[path] as Record<string, any>)[id] = { ...(mockDb[path] as Record<string, any>)[id], ...data };
    }
    persistMockDb();
  },

  getDoc: (path: keyof MockDb, id: string) => {
    return (mockDb[path] as Record<string, any>)[id];
  }
};
