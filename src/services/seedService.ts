import { mockDb } from '../lib/mockDatabase';
import { db } from '../lib/firebase';
import { doc, setDoc, collection } from 'firebase/firestore';
import { AppRole } from './rbacService';
import { faker } from '@faker-js/faker';
import { savePatient, saveUserProfile, addToCareTeam, saveClinicalIntake, updatePatientVitals } from './clinicalFirestoreService';

export interface SeedProgress {
  step: string;
  count: number;
  total: number;
}

export type SeedCallback = (progress: SeedProgress) => void;

export const SeedService = {
  /**
   * Seeds the default neurosurgical clinical graph with 3 providers and 10 patients.
   */
  async seedCareNetwork(onProgress?: SeedCallback) {
    console.log('Seeding Graph Network...');
    
    // --- 1. CREATE PROVIDER NODES ---
    const providerCount = 3;
    const providerIds: string[] = [];
    const specialties = ['Neurosurgery', 'Neurology', 'Critical Care'];

    for (let i = 0; i < providerCount; i++) {
      const id = `prov-${faker.string.uuid().slice(0, 8)}`;
      const name = i === 0 ? 'Dr. James Wilson' : `Dr. ${faker.person.fullName()}`;
      const specialty = specialties[i] || 'Neurosurgery';
      
      const providerData = {
        id,
        displayName: name,
        email: faker.internet.email().toLowerCase(),
        role: 'clinician' as AppRole,
        specialty,
        bio: `${specialty} specialist with focus on clinical precision.`,
        createdAt: new Date().toISOString()
      };

      await saveUserProfile(id, providerData);
      providerIds.push(id);
      
      onProgress?.({ step: 'Creating Providers', count: i + 1, total: providerCount });
    }

    // --- 2. CREATE PATIENT NODES ---
    const patientCount = 10;
    const conditions = ['Subdural Hematoma', 'Glioblastoma', 'Trigeminal Neuralgia', 'Spinal Stenosis', 'Hydrocephalus'];
    const patientIds: string[] = [];

    for (let i = 0; i < patientCount; i++) {
      const id = `pt-${faker.string.uuid().slice(0, 8)}`;
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const condition = conditions[faker.number.int({ min: 0, max: conditions.length - 1 })];
      const birthDate = faker.date.birthdate({ min: 18, max: 90, mode: 'age' });

      const patientData = {
        id,
        mrn: `MRN-${faker.number.int({ min: 10000, max: 99999 })}-${firstName[0]}${lastName[0]}`,
        firstName,
        lastName,
        name: `${firstName} ${lastName}`,
        email: faker.internet.email({ firstName, lastName }).toLowerCase(),
        gender: faker.person.sexType() === 'female' ? 'Female' : 'Male',
        dob: birthDate.toISOString().split('T')[0],
        phone: faker.phone.number(),
        status: 'active',
        conditions: [condition],
        chiefComplaint: `Referred for evaluation of ${condition}.`,
        createdAt: new Date().toISOString()
      };

      await savePatient(id, patientData);
      patientIds.push(id);
      
      await updatePatientVitals(id, {
        hr: faker.number.int({ min: 60, max: 100 }),
        bp: `${faker.number.int({ min: 110, max: 140 })}/${faker.number.int({ min: 70, max: 90 })}`,
        temp: faker.number.float({ min: 36.5, max: 37.8, multipleOf: 0.1 }),
        heading_vitals: true,
        rr: faker.number.int({ min: 12, max: 20 }),
        spo2: faker.number.int({ min: 96, max: 99 }),
        timestamp: Date.now()
      });

      onProgress?.({ step: 'Creating Patients', count: i + 1, total: patientCount });
    }

    // --- 3. DRAW EDGES (Relationships) ---
    for (const [index, patientId] of patientIds.entries()) {
      const providerId = providerIds[faker.number.int({ min: 0, max: providerIds.length - 1 })];
      
      const edgeData = {
        role: 'primary_clinician',
        assignedBy: 'system',
        priority: 'high',
        careNetwork: 'Neurosurgery-Specialized'
      };

      await addToCareTeam(patientId, providerId, edgeData);
      
      const intakeId = `intake-${faker.string.uuid().slice(0, 8)}`;
      await saveClinicalIntake(patientId, intakeId, {
        id: intakeId,
        patientId,
        providerId,
        chiefComplaint: `Clinical evaluation for Graph Projection.`,
        historyOfPresentIllness: `Patient establishing care within the Graph Network.`,
        timestamp: Date.now()
      });

      onProgress?.({ step: 'Drawing Relationships', count: index + 1, total: patientCount });
    }

    console.log('Seeding Complete. Knowledge Graph updated.');
  },

  /**
   * Seeds Marcus Everett's clinical case exactly with the model patient JSON.
   */
  async seedMarcusEverettCase(onProgress?: SeedCallback) {
    console.log('Seeding Marcus Everett rheumatoid arthritis model patient...');
    const patientId = 'pat-marcus-001';

    const mapId = (id: string): string => {
      if (id === 'user-theogate-001') return 'uid-clinician-001';
      if (id === 'user-nurse-rivera-001' || id === 'user-alwayson-001') return 'uid-nurse-001';
      if (id === 'uid-marcus-portal-001') return 'uid-patient-001';
      return id;
    };

    const mapName = (name: string): string => {
      if (!name) return name;
      if (name.includes('Theogate')) return 'Dr. Gregory Theogate, MD';
      if (name.includes('Rivera') || name.includes('Alwayson')) return 'Tamara Rivera, RN';
      return name;
    };

    const mapObject = (obj: any): any => {
      if (!obj) return obj;
      const res = { ...obj };
      if (res.authorId) res.authorId = mapId(res.authorId);
      if (res.authorName) res.authorName = mapName(res.authorName);
      if (res.providerId) res.providerId = mapId(res.providerId);
      if (res.providerName) res.providerName = mapName(res.providerName);
      if (res.fromProvider) {
        if (res.fromProvider.includes('Theogate')) {
          res.fromProvider = 'Dr. Gregory Theogate, MD — Rheumatology';
        }
      }
      if (res.toProvider) {
        if (res.toProvider.includes('Alwayson') || res.toProvider.includes('Rivera')) {
          res.toProvider = 'Tamara Rivera, RN';
        }
      }
      return res;
    };

    // --- 1. PROVIDERS & USER PROFILES ---
    // Dr. Gregory Theogate, MD
    const theogateObj = {
      id: "uid-clinician-001",
      email: "g.theogate@careplus.health",
      displayName: "Dr. Gregory Theogate, MD",
      role: "clinician" as AppRole,
      specialty: "Rheumatology",
      phone: "(555) 456-7890",
      npi: "1982736450",
      dea: "XT9872543",
      createdAt: "2024-09-01T08:00:00Z"
    };

    // Elena Rostova (Front Desk)
    const frontdeskObj = {
      id: "uid-frontdesk-001",
      email: "e.rostova@careplus.health",
      displayName: "Elena Rostova",
      role: "front_desk" as AppRole,
      phone: "(555) 234-5678",
      createdAt: "2025-01-08T09:00:00Z"
    };

    // Tamara Rivera, RN (Nurse)
    const riveraObj = {
      id: "uid-nurse-001",
      email: "t.rivera@careplus.health",
      displayName: "Tamara Rivera, RN",
      role: "nurse" as AppRole,
      phone: "(555) 345-6789",
      licenseNumber: "RN-482019",
      createdAt: "2024-09-01T08:00:00Z"
    };

    // Arthur Pendelton (Admin)
    const adminObj = {
      id: "uid-admin-001",
      email: "a.pendelton@careplus.health",
      displayName: "Arthur Pendelton",
      role: "admin" as AppRole,
      phone: "(555) 567-8901",
      createdAt: "2024-09-01T08:00:00Z"
    };

    // Marcus Everett (Patient Portal User Access)
    const marcusPortalUser = {
      id: "uid-patient-001",
      email: "m.everett@personal.com",
      displayName: "Marcus Everett",
      role: "patient" as AppRole,
      createdAt: "2025-01-08T09:10:00Z"
    };

    const usersToSeed = [theogateObj, frontdeskObj, riveraObj, adminObj, marcusPortalUser];
    for (let idx = 0; idx < usersToSeed.length; idx++) {
      const u = usersToSeed[idx];
      // Save in mock DB cache
      mockDb.users[u.id] = u;
      mockDb.roles[u.id] = { userId: u.id, role: u.role, assignedBy: 'system' };
      
      // Sync to Firestore for RBAC verification and login listing
      await setDoc(doc(db, 'users', u.id), u);
      await setDoc(doc(db, 'roles', u.id), { userId: u.id, role: u.role, assignedBy: 'system' });
      await setDoc(doc(db, 'registered_users', u.id), {
        id: u.id,
        displayName: u.displayName,
        email: u.email.toLowerCase(),
        role: u.role,
        patientId: u.role === 'patient' ? 'pat-marcus-001' : undefined,
        avatar: u.role === 'patient' 
          ? 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=200&auto=format&fit=crop'
          : u.id === 'uid-clinician-001'
            ? 'https://images.unsplash.com/photo-1622253692010-333f2da60710?q=80&w=200&auto=format&fit=crop'
            : u.id === 'uid-nurse-001'
              ? 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?q=80&w=200&auto=format&fit=crop'
              : u.id === 'uid-frontdesk-001'
                ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop'
                : 'https://images.unsplash.com/photo-1537368910025-7003507965b6?q=80&w=200&auto=format&fit=crop',
        status: 'Active',
        createdAt: u.createdAt
      });

      onProgress?.({ step: 'Injecting Case Users & Roles', count: idx + 1, total: usersToSeed.length });
    }

    // --- 2. THE PATIENT RECORD (FLATTENED EXCLUDING PRIVATE METADATA) ---
    const patientObj = {
      id: patientId,
      firstName: "Marcus",
      lastName: "Everett",
      dateOfBirth: "1985-03-14",
      gender: "Male",
      authorId: "uid-clinician-001",
      patientId: patientId,
      authorizedUserIds: [],
      appleHealthConnected: true,
      appleHealthConnectedAt: "2025-01-10T14:22:00Z",
      appleHealthPlatform: "Apple Health",
      appleHealthPermissionsGranted: ["HeartRate", "BloodPressure", "BodyMass", "BloodGlucose", "RestingHeartRate", "StepCount", "SleepAnalysis", "OxygenSaturation"],
      appleHealthLastSyncedAt: "2025-05-29T07:30:00Z",
      appleHealthDeviceModel: "Apple Watch Series 9 + iPhone 15 Pro",
      appleHealthDataSourceId: "com.apple.health::uid-patient-001",
      createdAt: "2025-01-08T09:10:00Z"
    };

    mockDb.patients[patientId] = patientObj;
    await setDoc(doc(db, 'patients', patientId), patientObj);
    onProgress?.({ step: 'Creating Patient Node', count: 1, total: 1 });

    // --- 3. SUBCOLLECTIONS AND CONNECTIVITY SHARDS ---
    
    // Clinical Care Teams Edge
    await setDoc(doc(db, 'patients', patientId, 'care_teams', 'uid-clinician-001'), {
      userId: 'uid-clinician-001',
      patientId: patientId,
      role: 'primary_clinician',
      status: 'active',
      joinedAt: new Date().toISOString()
    });
    await setDoc(doc(db, 'patients', patientId, 'care_teams', 'uid-nurse-001'), {
      userId: 'uid-nurse-001',
      patientId: patientId,
      role: 'case_manager',
      status: 'active',
      joinedAt: new Date().toISOString()
    });
    mockDb.care_teams[patientId] = [
      { userId: 'uid-clinician-001', role: 'primary_clinician', status: 'active' },
      { userId: 'uid-nurse-001', role: 'case_manager', status: 'active' }
    ];

    // Vitals Sequence (9 Dense Readings)
    const vitalsData = [
      {
        id: "vit-001",
        patientId: "pat-marcus-001",
        authorId: "user-theogate-001",
        hr: 82,
        bp: "128/84",
        temp: 37.1,
        rr: 16,
        spo2: 98,
        glucose: 5.6,
        weight: 88.4,
        height: 178,
        bmi: 27.9,
        hba1c: null,
        gcs: "15/15",
        source: "clinical",
        timestamp: 1736330400000,
        createdAt: "2025-01-08T09:30:00Z"
      },
      {
        id: "vit-002",
        patientId: "pat-marcus-001",
        authorId: "user-theogate-001",
        hr: 88,
        bp: "132/86",
        temp: 37.4,
        rr: 17,
        spo2: 97,
        glucose: 5.8,
        weight: 87.9,
        height: 178,
        bmi: 27.7,
        hba1c: 5.7,
        gcs: "15/15",
        source: "clinical",
        timestamp: 1738749000000,
        createdAt: "2025-02-05T10:15:00Z"
      },
      {
        id: "vit-003",
        patientId: "pat-marcus-001",
        authorId: "uid-marcus-portal-001",
        hr: 79,
        bp: "127/83",
        temp: null,
        rr: null,
        spo2: 98,
        glucose: null,
        weight: 88.1,
        height: 178,
        bmi: 27.8,
        hba1c: null,
        gcs: null,
        source: "apple_health",
        device: "Apple Watch Series 9",
        timestamp: 1739001600000,
        createdAt: "2025-02-08T07:20:00Z"
      },
      {
        id: "vit-004",
        patientId: "pat-marcus-001",
        authorId: "uid-marcus-portal-001",
        hr: 76,
        bp: "126/82",
        temp: null,
        rr: null,
        spo2: 98,
        glucose: null,
        weight: 87.5,
        height: 178,
        bmi: 27.6,
        hba1c: null,
        gcs: null,
        source: "apple_health",
        device: "Apple Watch Series 9",
        timestamp: 1740819600000,
        createdAt: "2025-03-01T07:14:00Z"
      },
      {
        id: "vit-005",
        patientId: "pat-marcus-001",
        authorId: "user-theogate-001",
        hr: 75,
        bp: "124/81",
        temp: 37.0,
        rr: 16,
        spo2: 98,
        glucose: 5.5,
        weight: 87.2,
        height: 178,
        bmi: 27.5,
        hba1c: 5.5,
        gcs: "15/15",
        source: "clinical",
        timestamp: 1742382600000,
        createdAt: "2025-03-19T10:00:00Z"
      },
      {
        id: "vit-006",
        patientId: "pat-marcus-001",
        authorId: "uid-marcus-portal-001",
        hr: 73,
        bp: "123/81",
        temp: null,
        rr: null,
        spo2: 98,
        glucose: null,
        weight: 87.0,
        height: 178,
        bmi: 27.5,
        hba1c: null,
        gcs: null,
        source: "apple_health",
        device: "Apple Watch Series 9",
        timestamp: 1743120000000,
        createdAt: "2025-03-28T06:40:00Z"
      },
      {
        id: "vit-007",
        patientId: "pat-marcus-001",
        authorId: "uid-marcus-portal-001",
        hr: 72,
        bp: "122/80",
        temp: null,
        rr: null,
        spo2: 99,
        glucose: null,
        weight: 86.8,
        height: 178,
        bmi: 27.4,
        hba1c: null,
        gcs: null,
        source: "apple_health",
        device: "Apple Watch Series 9",
        timestamp: 1744452000000,
        createdAt: "2025-04-12T06:55:00Z"
      },
      {
        id: "vit-008",
        patientId: "pat-marcus-001",
        authorId: "uid-marcus-portal-001",
        hr: 70,
        bp: "121/79",
        temp: null,
        rr: null,
        spo2: 99,
        glucose: null,
        weight: 86.5,
        height: 178,
        bmi: 27.3,
        hba1c: null,
        gcs: null,
        source: "apple_health",
        device: "Apple Watch Series 9",
        timestamp: 1746230400000,
        createdAt: "2025-05-03T07:10:00Z"
      },
      {
        id: "vit-009",
        patientId: "pat-marcus-001",
        authorId: "uid-marcus-portal-001",
        hr: 69,
        bp: "120/78",
        temp: null,
        rr: null,
        spo2: 99,
        glucose: null,
        weight: 86.2,
        height: 178,
        bmi: 27.2,
        hba1c: null,
        gcs: null,
        source: "apple_health",
        device: "Apple Watch Series 9",
        timestamp: 1747699200000,
        createdAt: "2025-05-20T07:02:00Z"
      }
    ];

    const mappedVitals = vitalsData.map(mapObject);
    mockDb.vitals[patientId] = mappedVitals;
    for (const v of mappedVitals) {
      await setDoc(doc(db, 'patients', patientId, 'vitals', v.id), v);
    }
    onProgress?.({ step: 'Ingesting Biomarkers & Vitals', count: vitalsData.length, total: vitalsData.length });

    // Clinical Records (3 Longitudinal SOAP Notes showing resolution path)
    const clinicalRecordsData = [
      {
        id: "cr-001",
        patientId: patientId,
        authorId: "user-theogate-001",
        title: "Initial Rheumatology Screening",
        authorName: "Dr. G. Theogate",
        specialty: "Rheumatology",
        status: "signed",
        subjective: "Mr. Everett, a 39-year-old male, presents with a 4-month history of bilateral symmetrical joint pain and morning stiffness lasting more than 1 hour, predominantly affecting the MCP and PIP joints of both hands and both wrists. He reports fatigue and mild swelling. No known family history of autoimmune disease. Non-smoker. Reports difficulty gripping objects and opening jars. Stiffness improves with activity throughout the day.",
        objective: "Bilateral MCP and PIP joint tenderness on palpation — right > left. Soft tissue swelling noted at bilateral wrists. No warmth or erythema over joints. Grip strength reduced bilaterally (right 22 kg, left 19 kg; normal >35 kg). Full ROM preserved at larger joints. No nodules. Rheumatoid Factor and Anti-CCP ordered. X-rays of hands and wrists ordered.",
        assessment: "Bilateral symmetrical polyarthritis with prolonged morning stiffness in an adult male. Clinical picture is suspicious for early Rheumatoid Arthritis. Differential includes: (1) Rheumatoid Arthritis, (2) Psoriatic Arthritis — no skin lesions noted, (3) Reactive Arthritis — no recent infection history. Serology and imaging pending to confirm.",
        plan: "1. Order RF, Anti-CCP, ESR, CRP, FBC, LFTs, UEC. 2. Order X-ray bilateral hands and wrists. 3. NSAIDs for symptomatic relief pending diagnosis — Naproxen 500mg BD PRN. 4. Follow-up in 4 weeks with investigation results. 5. Patient education re: joint protection, activity modification. 6. Refer to physiotherapy for baseline assessment.",
        icd10Codes: ["M13.0", "R68.89"],
        createdAt: "2025-01-08T10:05:00Z",
        updatedAt: "2025-01-08T10:45:00Z"
      },
      {
        id: "cr-002",
        patientId: patientId,
        authorId: "user-theogate-001",
        title: "Rheumatoid Arthritis Treatment Initiation",
        authorName: "Dr. G. Theogate",
        specialty: "Rheumatology",
        status: "signed",
        subjective: "Mr. Everett returns with investigation results. Morning stiffness persists, averaging 90 minutes. He has been taking Naproxen 500mg BD with partial relief. Fatigue remains significant. Reports difficulty with fine motor tasks at work as a data analyst. Denies rash, eye symptoms, or bowel changes.",
        objective: "RF: 148 IU/mL (positive, reference <14). Anti-CCP: 112 U/mL (strongly positive, reference <7). CRP: 28 mg/L (elevated). ESR: 54 mm/hr (elevated). FBC: mild normocytic anaemia (Hb 11.8 g/dL). LFTs and UEC: within normal limits. X-ray bilateral hands: periarticular osteopenia at MCP joints bilaterally, no erosions — consistent with early RA. Active synovitis bilateral MCP joints (2,3,4), bilateral PIP joints (2,3), bilateral wrists. DAS28-CRP score: 5.1 (high disease activity).",
        assessment: "Rheumatoid Arthritis, seropositive, bilateral hand and wrist involvement, high disease activity (DAS28-CRP 5.1). No erosions at this stage — early intervention critical to prevent joint destruction. Mild anaemia of chronic disease.",
        plan: "1. Commence Methotrexate 10mg orally once weekly. 2. Prescribe Folic Acid 5mg orally once weekly (24h post-MTX). 3. Prescribe Prednisolone 10mg daily — bridge therapy, taper over 6 weeks. 4. Cease Naproxen. 5. e-Prescriptions sent to ITH Pharmacy. 6. LFTs and FBC in 4 weeks, then every 3 months. 7. Formal physiotherapy referral to Michelle Alwayson. 8. Follow-up in 6 weeks. 9. Apple Health integration confirmed — continue daily monitoring via Apple Watch.",
        icd10Codes: ["M05.79", "D63.8"],
        createdAt: "2025-02-05T10:50:00Z",
        updatedAt: "2025-02-05T11:30:00Z"
      },
      {
        id: "cr-003",
        patientId: patientId,
        authorId: "user-theogate-001",
        title: "Rheumatoid Arthritis 3-Month Follow-Up",
        authorName: "Dr. G. Theogate",
        specialty: "Rheumatology",
        status: "signed",
        subjective: "3-month review. Mr. Everett reports significant improvement. Morning stiffness now 15–20 minutes (down from 90 minutes at diagnosis). Managing full work days with ergonomic adaptations in place. No adverse effects from Methotrexate. Prednisolone taper completed without flare. Fatigue much improved. Apple Health HR trend shared — resting HR tracking from 88 bpm down to 70 bpm over the past 10 weeks.",
        objective: "Joint examination: Reduced synovitis — 3 active joints vs 9 at diagnosis (bilateral MCP 2–3, right wrist). Grip strength R 32kg / L 29kg (improved from 22/19 at baseline). DAS28-CRP: 3.1 (moderate disease activity — down from 5.1). CRP: 9 mg/L (improving). FBC: Hb 12.6 g/dL (anaemia resolving). LFTs: within normal limits — Methotrexate well tolerated. Musculoskeletal ultrasound April 15: reduced synovial thickening bilaterally, no erosions identified.",
        assessment: "Rheumatoid Arthritis, seropositive — responding well to Methotrexate. DAS28 reduced from 5.1 to 3.1 at 10 weeks. Target is DAS28 <2.6 (remission). Escalate Methotrexate dose. Anaemia of chronic disease resolving. Continue physiotherapy.",
        plan: "1. Escalate Methotrexate to 15mg weekly — e-prescription sent to ITH Pharmacy. 2. Continue Folic Acid 5mg weekly. 3. Prednisolone course completed — do not restart unless flare. 4. Repeat LFTs, FBC, CRP in 3 months. 5. MRI bilateral hands ordered to assess subclinical synovitis and cartilage integrity. 6. Continue physiotherapy with Michelle Alwayson — monthly maintenance. 7. Target: DAS28 <2.6 at 6-month review. 8. Apple Health monitoring to continue — patient to flag HR spikes or sleep disruption as early flare indicators.",
        icd10Codes: ["M05.79"],
        createdAt: "2025-03-19T10:45:00Z",
        updatedAt: "2025-03-19T11:10:00Z"
      }
    ];

    const mappedCR = clinicalRecordsData.map(mapObject);
    mockDb.clinical_records[patientId] = mappedCR;
    for (const cr of mappedCR) {
      await setDoc(doc(db, 'patients', patientId, 'clinical_records', cr.id), cr);
    }
    onProgress?.({ step: 'Generating SOAP Case Summary', count: clinicalRecordsData.length, total: clinicalRecordsData.length });

    // Investigations (inv-007 transitioned to Complete + inv-008, inv-009 active)
    const investigationsData = [
      {
        id: "inv-001",
        patientId: patientId,
        authorId: "user-theogate-001",
        category: "Serology",
        testName: "Rheumatoid Factor (RF)",
        priority: "routine",
        indication: "Bilateral symmetrical polyarthritis — rule out Rheumatoid Arthritis",
        instructions: "Fasting not required. Collect serum.",
        status: "completed",
        createdAt: "2025-01-08T10:10:00Z"
      },
      {
        id: "inv-002",
        patientId: patientId,
        authorId: "user-theogate-001",
        category: "Serology",
        testName: "Anti-Cyclic Citrullinated Peptide (Anti-CCP)",
        priority: "routine",
        indication: "Bilateral symmetrical polyarthritis — RA-specific autoantibody screen",
        instructions: "Serum. Order with RF.",
        status: "completed",
        createdAt: "2025-01-08T10:10:00Z"
      },
      {
        id: "inv-003",
        patientId: patientId,
        authorId: "user-theogate-001",
        category: "Inflammatory Markers",
        testName: "ESR & CRP (Inflammatory Panel)",
        priority: "routine",
        indication: "Inflammatory arthritis — quantify systemic inflammation",
        instructions: "EDTA tube for ESR; serum for CRP.",
        status: "completed",
        createdAt: "2025-01-08T10:10:00Z"
      },
      {
        id: "inv-004",
        patientId: patientId,
        authorId: "user-theogate-001",
        category: "Haematology",
        testName: "Full Blood Count (FBC)",
        priority: "routine",
        indication: "Baseline — anaemia of chronic disease screen; pre-DMARD baseline",
        instructions: "EDTA tube.",
        status: "completed",
        createdAt: "2025-01-08T10:10:00Z"
      },
      {
        id: "inv-005",
        patientId: patientId,
        authorId: "user-theogate-001",
        category: "Biochemistry",
        testName: "Liver Function Tests (LFTs) & Urea/Electrolytes/Creatinine (UEC)",
        priority: "routine",
        indication: "Baseline liver and renal function — required prior to Methotrexate initiation",
        instructions: "Serum. Fasting not required.",
        status: "completed",
        createdAt: "2025-01-08T10:10:00Z"
      },
      {
        id: "inv-006",
        patientId: patientId,
        authorId: "user-theogate-001",
        category: "Radiology",
        testName: "X-Ray Bilateral Hands and Wrists (PA view)",
        priority: "routine",
        indication: "Suspected RA — assess for periarticular osteopenia, joint space narrowing, erosions",
        instructions: "Both hands in PA projection. Compare bilateral.",
        status: "completed",
        createdAt: "2025-01-08T10:15:00Z"
      },
      {
        id: "inv-007",
        patientId: patientId,
        authorId: "user-theogate-001",
        category: "Monitoring",
        testName: "FBC, LFTs, CRP — Methotrexate Safety Panel (4-week)",
        priority: "routine",
        indication: "4-week Methotrexate monitoring — hepatotoxicity and myelosuppression screen",
        instructions: "Fasting not required. Results reviewed at Visit 3.",
        status: "completed",
        createdAt: "2025-02-05T11:15:00Z"
      },
      {
        id: "inv-008",
        patientId: patientId,
        authorId: "user-theogate-001",
        category: "Monitoring",
        testName: "FBC, LFTs, CRP — Methotrexate Safety Panel (3-month)",
        priority: "routine",
        indication: "Quarterly Methotrexate monitoring following dose escalation to 15mg weekly",
        instructions: "Fasting not required. Collect within 2 weeks. Bring results to 6-month rheumatology review.",
        status: "pending",
        createdAt: "2025-03-19T11:00:00Z"
      },
      {
        id: "inv-009",
        patientId: patientId,
        authorId: "user-theogate-001",
        category: "Radiology",
        testName: "MRI Bilateral Hands and Wrists with Contrast",
        priority: "routine",
        indication: "RA disease monitoring — assess subclinical synovitis, cartilage integrity, and early erosive change not detectable on plain film",
        instructions: "Gadolinium contrast required. Renal function confirmed normal. No metal implants. Patient to fast 4 hours prior.",
        status: "ordered",
        createdAt: "2025-03-19T11:05:00Z"
      }
    ];

    const mappedInv = investigationsData.map(mapObject);
    mockDb.investigations[patientId] = mappedInv;
    for (const inv of mappedInv) {
      await setDoc(doc(db, 'patients', patientId, 'investigations', inv.id), inv);
    }
    onProgress?.({ step: 'Generating Diagnostic Orders', count: investigationsData.length, total: investigationsData.length });

    // Prescriptions (Excluding unrequested underscore prefixes)
    const prescriptionsData = [
      {
        id: "rx-001",
        patientId: patientId,
        authorId: "user-theogate-001",
        pharmacy: "ITH Pharmacy",
        prescriptionType: "ePrescription",
        medicationName: "Naproxen",
        dosage: "500mg",
        route: "oral",
        frequency: "Twice daily (BD)",
        duration: "4",
        durationUnit: "weeks",
        refills: 0,
        sig: "Take one 500mg tablet by mouth twice daily with food as needed for joint pain. Cease if gastrointestinal discomfort occurs. Not for long-term use.",
        status: "completed",
        createdAt: "2025-01-08T10:20:00Z"
      },
      {
        id: "rx-002",
        patientId: patientId,
        authorId: "user-theogate-001",
        pharmacy: "ITH Pharmacy",
        prescriptionType: "ePrescription",
        medicationName: "Methotrexate",
        dosage: "15mg",
        route: "oral",
        frequency: "Once weekly (every Monday)",
        duration: "3",
        durationUnit: "months",
        refills: 2,
        sig: "Take three 5mg tablets (15mg total) by mouth ONCE WEEKLY on Monday. Do NOT take daily — weekly dosing only. Take with food. Escalated from 10mg at 3-month review. Dispense via ITH Pharmacy e-prescription.",
        status: "active",
        createdAt: "2025-03-19T11:15:00Z"
      },
      {
        id: "rx-003",
        patientId: patientId,
        authorId: "user-theogate-001",
        pharmacy: "ITH Pharmacy",
        prescriptionType: "ePrescription",
        medicationName: "Folic Acid",
        dosage: "5mg",
        route: "oral",
        frequency: "Once weekly (every Tuesday)",
        duration: "3",
        durationUnit: "months",
        refills: 2,
        sig: "Take one 5mg tablet by mouth once weekly on Tuesday — 24 hours after Methotrexate dose. This reduces Methotrexate side effects. Do not miss doses. Dispense via ITH Pharmacy e-prescription.",
        status: "active",
        createdAt: "2025-03-19T11:15:00Z"
      },
      {
        id: "rx-004",
        patientId: patientId,
        authorId: "user-theogate-001",
        pharmacy: "ITH Pharmacy",
        prescriptionType: "ePrescription",
        medicationName: "Prednisolone",
        dosage: "10mg",
        route: "oral",
        frequency: "Once daily (OD)",
        duration: "6",
        durationUnit: "weeks",
        refills: 0,
        sig: "Take one 10mg tablet by mouth once daily with breakfast. TAPER: 10mg x 2 weeks, then 7.5mg x 2 weeks, then 5mg x 1 week, then 2.5mg x 1 week, then cease. Do NOT stop abruptly. Dispense via ITH Pharmacy e-prescription.",
        status: "completed",
        createdAt: "2025-02-05T11:20:00Z"
      }
    ];

    const mappedP = prescriptionsData.map(mapObject);
    mockDb.prescriptions[patientId] = mappedP;
    for (const p of mappedP) {
      await setDoc(doc(db, 'patients', patientId, 'prescriptions', p.id), p);
    }
    onProgress?.({ step: 'Issuing Pharmacotherapeutic Scripts', count: prescriptionsData.length, total: prescriptionsData.length });

    // Referrals (ref-001 marked completed as sessions happened, ref-002 active)
    const referralsData = [
      {
        id: "ref-001",
        patientId: patientId,
        authorId: "user-theogate-001",
        fromProvider: "Dr. G. Theogate — Rheumatology",
        toProvider: "Michelle Alwayson — Physiotherapy",
        specialty: "Physiotherapy",
        reason: "Baseline physiotherapy assessment for suspected inflammatory arthritis. Joint protection education, hand exercise program, and functional capacity evaluation requested.",
        urgency: "routine",
        notes: "Patient is a data analyst — significant bilateral hand and wrist involvement. Morning stiffness >1 hour. Diagnosis pending serology; assessment valuable regardless.",
        status: "completed",
        createdAt: "2025-01-08T10:30:00Z"
      },
      {
        id: "ref-002",
        patientId: patientId,
        authorId: "user-theogate-001",
        fromProvider: "Dr. G. Theogate — Rheumatology",
        toProvider: "Michelle Alwayson — Physiotherapy",
        specialty: "Physiotherapy",
        reason: "Confirmed Rheumatoid Arthritis (M05.79), high disease activity (DAS28-CRP 5.1). Structured RA physiotherapy program: hand and wrist strengthening, ROM, fatigue management, workplace ergonomics for sedentary desk role.",
        urgency: "routine",
        notes: "Patient commenced Methotrexate 10mg weekly and Prednisolone bridge. Avoid aggressive loading during flares. Coordinate monitoring with Dr. Theogate.",
        status: "accepted",
        createdAt: "2025-02-05T11:35:00Z"
      }
    ];

    const mappedR = referralsData.map(mapObject);
    mockDb.referrals[patientId] = mappedR;
    for (const r of mappedR) {
      await setDoc(doc(db, 'patients', patientId, 'referrals', r.id), r);
    }
    onProgress?.({ step: 'Registering Referrals', count: referralsData.length, total: referralsData.length });

    // Procedures (Including Next Horizon MRI hand scheduled)
    const proceduresData = [
      {
        id: "proc-001",
        patientId: patientId,
        authorId: "user-theogate-001",
        procedureName: "Musculoskeletal Ultrasound — Bilateral Hands and Wrists",
        priority: "routine",
        targetDate: "2025-04-15",
        preparation: "No preparation required. Wear loose-fitting clothing. Bring previous X-ray results.",
        notes: "Assess for active synovitis, tenosynovitis, and early erosive change not visible on plain film. Results used to guide treatment decisions at 3-month review.",
        status: "completed",
        createdAt: "2025-02-05T11:40:00Z"
      },
      {
        id: "proc-002",
        patientId: patientId,
        authorId: "user-theogate-001",
        procedureName: "MRI Bilateral Hands and Wrists with Contrast",
        priority: "routine",
        targetDate: "2025-06-18",
        preparation: "Fast 4 hours prior. Gadolinium contrast will be administered. No metal implants — confirmed. Renal function confirmed satisfactory. Wear comfortable clothing with no metal fasteners.",
        notes: "Ordered at 3-month review to assess subclinical synovitis and cartilage integrity ahead of 6-month DAS28 target evaluation.",
        status: "scheduled",
        createdAt: "2025-03-19T11:05:00Z"
      }
    ];

    const mappedPr = proceduresData.map(mapObject);
    mockDb.procedures[patientId] = mappedPr;
    for (const pr of mappedPr) {
      await setDoc(doc(db, 'patients', patientId, 'procedures', pr.id), pr);
    }
    onProgress?.({ step: 'Scheduling Procedures', count: proceduresData.length, total: proceduresData.length });

    // Interactions (8 entries with specific categories: PT, Clinical, Nursing, Social Care)
    const interactionsData = [
      {
        id: "int-001",
        patientId: patientId,
        authorId: "user-alwayson-001",
        authorRole: "pt",
        type: "pt",
        category: "Initial Assessment",
        content: "Initial physiotherapy assessment for Mr. Everett. Diagnosis pending — referred by Dr. Theogate for suspected inflammatory arthritis. Bilateral hand grip strength significantly reduced (R: 22kg, L: 19kg). DASH score: 41/100 (moderate disability). Active ROM wrists: Flexion R 55°/L 50°, Extension R 48°/L 44°. MCP and PIP joints tender bilaterally. Patient reports difficulty with keyboard use, mouse handling, and driving. Posture: mild forward head posture and rounded shoulders — likely compensatory. Education provided: joint protection principles, activity pacing, heat/cold therapy. Home exercise programme established: wrist circles, finger tendon gliding, intrinsic hand stretches. Apple Health step count reviewed — averaging 4,200 steps/day, target set at 6,000. Follow-up bi-weekly.",
        createdAt: "2025-01-22T11:00:00Z"
      },
      {
        id: "int-002",
        patientId: patientId,
        authorId: "user-alwayson-001",
        authorRole: "pt",
        type: "pt",
        category: "Treatment Session",
        content: "Second session — diagnosis confirmed as Rheumatoid Arthritis (M05.79), high disease activity. Patient commenced MTX and Prednisolone. Morning stiffness 60 minutes today (improved from 90 min). Grip strength: R 24kg / L 21kg. DASH: 38/100. Progressed to TheraBand (green) wrist and hand strengthening, functional grip training, wrist stabilisation. Workplace ergonomics reviewed — recommended ergonomic keyboard, vertical mouse, adjustable desk. Fatigue management strategies discussed. Apple Health data reviewed with patient — resting HR trending down (88→76 bpm), step count 5,400/day. Goal: 7,000 steps/day by 8 weeks.",
        createdAt: "2025-02-19T11:00:00Z"
      },
      {
        id: "int-003",
        patientId: patientId,
        authorId: "user-alwayson-001",
        authorRole: "pt",
        type: "pt",
        category: "Treatment Session",
        content: "Third session. Patient typing for 90-minute blocks with adaptive equipment. Morning stiffness 30–40 minutes. Grip strength: R 28kg / L 25kg. DASH: 29/100. Progressed to yellow TheraBand, added wrist proprioception drills and shoulder girdle mobility for compensatory posture. Apple Health: avg resting HR 74 bpm, step count 6,200/day. Sleep averaging 6.2h — fatigue counselling reinforced. Interim report to Dr. Theogate at 3-month mark.",
        createdAt: "2025-03-12T11:00:00Z"
      },
      {
        id: "int-004",
        patientId: patientId,
        authorId: "user-alwayson-001",
        authorRole: "pt",
        type: "pt",
        category: "Review Session",
        content: "3-month physiotherapy review. Morning stiffness now 15–20 minutes. Grip strength: R 32kg / L 29kg — approaching normal range. DASH: 18/100 (mild disability). Wrist ROM: Flexion R 68°/L 64°, Extension R 60°/L 57°. Patient managing full work days. Apple Health: resting HR 70 bpm, steps 7,100/day, weight 86.8kg. Sleep 7.1h avg. Ultrasound April 15 — reduced synovial thickening bilaterally, no erosions. Interim PT report submitted to Dr. Theogate. Reducing to monthly sessions; introducing hydrotherapy next session.",
        createdAt: "2025-04-16T11:00:00Z"
      },
      {
        id: "int-005",
        patientId: patientId,
        authorId: "user-alwayson-001",
        authorRole: "pt",
        type: "pt",
        category: "Maintenance Session",
        content: "Monthly maintenance session. Morning stiffness <15 minutes. Grip strength: R 34kg / L 31kg. DASH: 12/100 — approaching minimal disability. Hydrotherapy introduced (pool session 30 min) — patient responded well. Apple Health: HR 69 bpm, weight 86.2kg, steps 7,800/day. Resting HR over 4 months: 88→76→74→70→69 — consistent cardiovascular improvement. Patient reports high satisfaction. Plan: monthly sessions; review at 6-month rheumatology appointment.",
        createdAt: "2025-05-21T11:00:00Z"
      },
      {
        id: "int-006",
        patientId: patientId,
        authorId: "user-theogate-001",
        authorRole: "clinician" as AppRole,
        type: "clinical",
        category: "Pharmacy Communication",
        content: "e-Prescriptions transmitted to ITH Pharmacy on 2025-02-05. Scripts issued: Methotrexate 10mg weekly, Folic Acid 5mg weekly, Prednisolone 10mg daily (tapering course). ITH Pharmacy confirmed receipt. Pharmacist counselling flag set: weekly-only MTX dosing — critical safety instruction. Patient advised to collect within 48 hours and to contact clinic immediately if adverse effects occur (nausea, mouth sores, unusual bruising, shortness of breath).",
        createdAt: "2025-02-06T09:00:00Z"
      },
      {
        id: "int-007",
        patientId: patientId,
        authorId: "user-nurse-rivera-001",
        authorRole: "nurse" as AppRole,
        type: "nursing",
        category: "Medication Review",
        content: "Nursing medication review call — 4 weeks post-MTX initiation. Patient tolerated Methotrexate 10mg weekly with mild nausea on day of dose, resolving by evening. No mouth sores, no hair loss, no shortness of breath reported. Taking Folic Acid correctly on the following day. Prednisolone tapering as prescribed — currently on 7.5mg. Patient confirmed collecting all medications from ITH Pharmacy. Reminded patient: do not miss Folic Acid doses, avoid alcohol while on MTX, use effective contraception if applicable. Safety bloods (inv-007) confirmed collected and reviewed by Dr. Theogate — results satisfactory. No dose changes at this stage.",
        createdAt: "2025-03-05T14:00:00Z"
      },
      {
        id: "int-008",
        patientId: patientId,
        authorId: "user-alwayson-001",
        authorRole: "social_worker",
        type: "social_care",
        category: "Workplace & Psychosocial Support",
        content: "Social care check-in at patient request. Mr. Everett raised concerns about the impact of RA diagnosis on his career as a data analyst — anxious about long-term hand function and job security. Explored coping strategies and signposted to local RA support group (Arthritis Foundation chapter). Discussed workplace accommodations: ergonomic equipment in place, patient eligible for reasonable adjustments under disability discrimination legislation. Encouraged disclosure to employer if comfortable. Patient expressed financial concern about ongoing medication costs — directed to pharmaceutical assistance programme for Methotrexate and connected to financial counselling if required. Mood: mildly anxious but engaged and proactive. Follow-up in 8 weeks or sooner if needed.",
        createdAt: "2025-04-02T13:00:00Z"
      }
    ];

    const mappedI = interactionsData.map(mapObject);
    mockDb.interactions[patientId] = mappedI;
    for (const i of mappedI) {
      await setDoc(doc(db, 'patients', patientId, 'interactions', i.id), i);
    }
    
    const rawAppt1 = {
      id: "appt-marcus-001",
      patientId: patientId,
      providerId: "user-theogate-001",
      providerName: "Dr. Gregory Theogate, MD",
      time: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      reason: "Rheumatoid Arthritis 6-Month Review",
      status: 'scheduled',
      visitType: 'in_clinic',
      priority: 'routine'
    };
    const rawAppt2 = {
      id: "appt-marcus-002",
      patientId: patientId,
      providerId: "user-alwayson-001",
      providerName: "Tamara Rivera, RN",
      time: new Date(Date.now() + 86400000 * 2).toISOString(), // In 2 days
      reason: "Hand & Wrist MSK Physical Therapy Routine",
      status: 'scheduled',
      visitType: 'in_clinic',
      priority: 'routine'
    };
    const apptObj1 = mapObject(rawAppt1);
    const apptObj2 = mapObject(rawAppt2);

    mockDb.appointments = mockDb.appointments.filter(a => a.patientId !== patientId);
    mockDb.appointments.push(apptObj1, apptObj2);
    await setDoc(doc(db, 'appointments', apptObj1.id), apptObj1);
    await setDoc(doc(db, 'appointments', apptObj2.id), apptObj2);

    onProgress?.({ step: 'Generating Rehabilitation Interactions', count: interactionsData.length, total: interactionsData.length });

    import('../lib/mockDatabase').then(m => m.persistMockDb());
    console.log('Seeding Marcus Everett Case Completed perfectly.');
  }
};
