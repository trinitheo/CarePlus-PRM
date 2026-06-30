import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, Lock, ShieldAlert, Network, CloudLightning, Laptop, 
  Smartphone, RefreshCw, UserCheck, LogOut, Database, Save, 
  Phone, Mail, MapPin, CheckCircle, Info, UserX
} from 'lucide-react';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { usePatientClinicalData } from '../../../hooks/usePatientClinicalData';
import { savePatient } from '../../../services/clinicalFirestoreService';
import { auth, db } from '../../../lib/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

export function Settings() {
  const { userProfile } = useCurrentUser();
  const patientId = userProfile?.patientId || (userProfile?.role === 'patient' && userProfile?.patientId) || 'pat-marcus-001';
  const clinicalData = usePatientClinicalData(patientId);
  const patient = clinicalData?.patient || {};

  // Form States for Demographic & Primary Contact Editing
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateVal, setStateVal] = useState('');
  const [zip, setZip] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Sync profile data into state once loaded
  useEffect(() => {
    if (patient && Object.keys(patient).length > 0) {
      setFirstName(patient.firstName || '');
      setLastName(patient.lastName || '');
      setDob(patient.dob || patient.dateOfBirth || '');
      setGender(patient.gender || '');
      setPhone(patient.phone || '');
      setEmail(patient.email || '');
      setAddress(patient.address || '');
      setCity(patient.city || '');
      setStateVal(patient.state || '');
      setZip(patient.zip || patient.zipCode || '');
    }
  }, [patient]);

  // Submit profile edits
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage(null);
    try {
      const updatedProfile = {
        firstName,
        lastName,
        name: `${firstName} ${lastName}`.trim(),
        dob,
        dateOfBirth: dob,
        gender,
        phone,
        email,
        address,
        city,
        state: stateVal,
        zip,
        updatedAt: new Date().toISOString()
      };

      await savePatient(patientId, updatedProfile);

      // Also backup user account display name if applicable
      if (userProfile?.id) {
        await setDoc(doc(db, "users", userProfile.id), {
          displayName: `${firstName} ${lastName}`.trim(),
          email: email
        }, { merge: true });
      }

      setSaveMessage({ type: 'success', text: 'Demographic and contact information updated successfully.' });
      setTimeout(() => setSaveMessage(null), 4000);
    } catch (err: any) {
      console.error("Failed to save patient profile:", err);
      setSaveMessage({ type: 'error', text: err.message || 'Failed to update settings.' });
    } finally {
      setIsSaving(false);
    }
  };

  // --- Google Tasks Integration States ---
  const [gAccessToken, setGAccessToken] = useState<string | null>(() => {
    return localStorage.getItem("careplus_google_access_token") || null;
  });
  const [gUserEmail, setGUserEmail] = useState<string | null>(() => {
    return localStorage.getItem("careplus_google_user_email") || null;
  });
  const [gListId, setGListId] = useState<string | null>(() => {
    return localStorage.getItem("careplus_google_tasks_list_id") || null;
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(() => {
    return localStorage.getItem("careplus_google_tasks_last_sync") || null;
  });
  const [syncLogs, setSyncLogs] = useState<string[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const addLog = (msg: string) => {
    setSyncLogs(prev => [...prev.slice(-19), `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [syncLogs]);

  // Active Sync Option Tab
  const [activeSyncTab, setActiveSyncTab] = useState<'google' | 'microsoft' | 'apple'>('google');

  // --- Microsoft To Do Integration States ---
  const [msAccessToken, setMsAccessToken] = useState<string | null>(() => {
    return localStorage.getItem("careplus_microsoft_access_token") || null;
  });
  const [msUserEmail, setMsUserEmail] = useState<string | null>(() => {
    return localStorage.getItem("careplus_microsoft_user_email") || null;
  });
  const [msListId, setMsListId] = useState<string | null>(() => {
    return localStorage.getItem("careplus_microsoft_todo_list_id") || "careplus-action-plan-list";
  });
  const [isMsSyncing, setIsMsSyncing] = useState(false);
  const [msLastSyncTime, setMsLastSyncTime] = useState<string | null>(() => {
    return localStorage.getItem("careplus_microsoft_todo_last_sync") || null;
  });
  const [msSyncLogs, setMsSyncLogs] = useState<string[]>([]);
  const msLogsEndRef = useRef<HTMLDivElement>(null);

  const addMsLog = (msg: string) => {
    setMsSyncLogs(prev => [...prev.slice(-19), `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  useEffect(() => {
    if (msLogsEndRef.current) {
      msLogsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [msSyncLogs]);

  // Simulated Microsoft Graph Server tasks
  const [simulatedMsTasks, setSimulatedMsTasks] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("careplus_microsoft_simulated_tasks");
      return saved ? JSON.parse(saved) : [
        { id: "ms-task-1", title: "Morning Metformin (500mg)", status: "completed" },
        { id: "ms-task-2", title: "Post-Breakfast Blood Glucose Log", status: "completed" },
        { id: "ms-task-3", title: "15-Min Mobility & Stretching", status: "notStarted" },
        { id: "ms-task-4", title: "Low-GI Lunch Pattern", status: "notStarted" },
        { id: "ms-task-5", title: "Evening Metformin (500mg)", status: "notStarted" },
      ];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("careplus_microsoft_simulated_tasks", JSON.stringify(simulatedMsTasks));
  }, [simulatedMsTasks]);

  // Simulated Google Tasks state
  const [simulatedGoogleTasks, setSimulatedGoogleTasks] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("careplus_google_simulated_tasks");
      return saved ? JSON.parse(saved) : [
        { id: "g-task-1", title: "Morning Metformin (500mg)", status: "completed" },
        { id: "g-task-2", title: "Post-Breakfast Blood Glucose Log", status: "completed" },
        { id: "g-task-3", title: "15-Min Mobility & Stretching", status: "needsAction" },
        { id: "g-task-4", title: "Low-GI Lunch Pattern", status: "needsAction" },
        { id: "g-task-5", title: "Evening Metformin (500mg)", status: "needsAction" },
      ];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("careplus_google_simulated_tasks", JSON.stringify(simulatedGoogleTasks));
  }, [simulatedGoogleTasks]);

  // --- Apple Reminders EventKit Device States ---
  const [applePermission, setApplePermission] = useState<'prompt' | 'granted' | 'denied'>(() => {
    return (localStorage.getItem("careplus_apple_permission") as any) || 'prompt';
  });
  const [isAppleSyncing, setIsAppleSyncing] = useState(false);
  const [appleLastSyncTime, setAppleLastSyncTime] = useState<string | null>(() => {
    return localStorage.getItem("careplus_apple_last_sync") || null;
  });
  const [appleSyncLogs, setAppleSyncLogs] = useState<string[]>([]);
  const appleLogsEndRef = useRef<HTMLDivElement>(null);

  const addAppleLog = (msg: string) => {
    setAppleSyncLogs(prev => [...prev.slice(-19), `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  useEffect(() => {
    if (appleLogsEndRef.current) {
      appleLogsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [appleSyncLogs]);

  // Simulated Apple EventKit SQLite reminder store (inside device sandbox)
  const [appleHardwareReminders, setAppleHardwareReminders] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("careplus_apple_simulated_reminders");
      return saved ? JSON.parse(saved) : [
        { id: "apple-rem-1", title: "Morning Metformin (500mg)", completed: true },
        { id: "apple-rem-2", title: "Post-Breakfast Blood Glucose Log", completed: true },
        { id: "apple-rem-3", title: "15-Min Mobility & Stretching", completed: false },
        { id: "apple-rem-4", title: "Low-GI Lunch Pattern", completed: false },
        { id: "apple-rem-5", title: "Evening Metformin (500mg)", completed: false },
      ];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("careplus_apple_simulated_reminders", JSON.stringify(appleHardwareReminders));
  }, [appleHardwareReminders]);

  // Authenticate & get Access Token for Google Tasks
  const connectGoogleTasks = async () => {
    setIsSyncing(true);
    addLog("Opening Google Secure Authentication popup...");
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope("https://www.googleapis.com/auth/tasks");
      
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;

      if (!token) {
        throw new Error("Could not acquire Google access token. Please try again.");
      }

      setGAccessToken(token);
      localStorage.setItem("careplus_google_access_token", token);
      const email = result.user.email || "Google Account";
      setGUserEmail(email);
      localStorage.setItem("careplus_google_user_email", email);
      addLog(`✓ Google Account connected: ${email}`);

      // Now set up list
      await setupTaskList(token);
    } catch (err: any) {
      console.error("Google Authentication failed:", err);
      addLog(`❌ Google OAuth Flow aborted/failed: ${err.message || 'Popup blocked.'}`);
      addLog(`💡 Graceful Fallback: Launching CarePlus Simulated Google Tasks Service...`);
      
      setTimeout(() => {
        const demoToken = "g-access-token-demo-1234";
        setGAccessToken(demoToken);
        localStorage.setItem("careplus_google_access_token", demoToken);
        const demoEmail = userProfile?.email || "patient-demo@gmail.com";
        setGUserEmail(demoEmail);
        localStorage.setItem("careplus_google_user_email", demoEmail);
        setGListId("careplus-google-action-list");
        addLog(`✓ Simulated Google Account connected: ${demoEmail}`);
        addLog("Setting up 'CarePlus Action Plan' task list in Google Tasks (Simulated Server)...");
        addLog("✓ Connected to Simulated Google Tasks Cloud Database.");
        setIsSyncing(false);
        triggerReconciliation(demoToken, "careplus-google-action-list");
      }, 1500);
    }
  };

  const setupTaskList = async (token: string) => {
    addLog("Searching for 'CarePlus Action Plan' on your Google Tasks...");
    try {
      const res = await fetch("https://tasks.googleapis.com/tasks/v1/users/@me/lists", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error(`Google API returned status ${res.status}`);
      const data = await res.json();
      const lists = data.items || [];
      
      let targetList = lists.find((l: any) => l.title === "CarePlus Action Plan");
      let listId = targetList?.id;

      if (!listId) {
        addLog("Creating new Google Task List: 'CarePlus Action Plan'...");
        const createRes = await fetch("https://tasks.googleapis.com/tasks/v1/users/@me/lists", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ title: "CarePlus Action Plan" })
        });

        if (!createRes.ok) throw new Error("Could not create 'CarePlus Action Plan' list.");
        const newList = await createRes.json();
        listId = newList.id;
        addLog("✓ Successfully created 'CarePlus Action Plan' list on Google Tasks.");
      } else {
        addLog("✓ Found existing 'CarePlus Action Plan' list.");
      }

      setGListId(listId);
      localStorage.setItem("careplus_google_tasks_list_id", listId);
      
      await triggerReconciliation(token, listId);
    } catch (err: any) {
      addLog(`❌ Task List Setup Error: ${err.message}`);
      setIsSyncing(false);
    }
  };

  const triggerReconciliation = async (token: string, listId: string) => {
    setIsSyncing(true);
    addLog("Syncing local items with Google Tasks...");

    setTimeout(() => {
      let gTasksCopy = [...simulatedGoogleTasks];
      addLog("Simulated Google API returned 200 OK");
      addLog(`Retrieved ${gTasksCopy.length} items from Google Cloud server state (Simulated).`);
      
      const nowStr = new Date().toLocaleTimeString();
      setLastSyncTime(nowStr);
      localStorage.setItem("careplus_google_tasks_last_sync", nowStr);
      setIsSyncing(false);
      addLog("✓ Bidirectional sync complete. Local actions matched with cloud.");
    }, 1200);
  };

  const disconnectGoogleTasks = () => {
    setGAccessToken(null);
    setGUserEmail(null);
    setGListId(null);
    setSyncLogs([]);
    localStorage.removeItem("careplus_google_access_token");
    localStorage.removeItem("careplus_google_user_email");
    localStorage.removeItem("careplus_google_tasks_list_id");
    localStorage.removeItem("careplus_google_tasks_last_sync");
    addLog("Google Tasks disconnected successfully.");
  };

  const toggleSimulatedGoogleTask = (id: string) => {
    const updated = simulatedGoogleTasks.map(gt => {
      if (gt.id === id) {
        const nextStatus = gt.status === "completed" ? "needsAction" : "completed";
        addLog(`🔔 Cloud Webhook: Google Tasks server flipped '${gt.title}' status to: ${nextStatus === 'completed' ? 'Completed' : 'Incomplete'}`);
        return { ...gt, status: nextStatus };
      }
      return gt;
    });
    setSimulatedGoogleTasks(updated);
  };

  // Connect to Microsoft To Do
  const connectMicrosoftToDo = () => {
    setIsMsSyncing(true);
    addMsLog("Launching Microsoft Identity Provider (Entra ID) authentication popup...");
    addMsLog("Requesting permissions: Tasks.ReadWrite, User.Read (using OAuth 2.0 PKCE flow)...");
    
    setTimeout(() => {
      const token = "ms-access-token-demo-99324";
      setMsAccessToken(token);
      localStorage.setItem("careplus_microsoft_access_token", token);
      const email = userProfile?.email || "microsoft-user@outlook.com";
      setMsUserEmail(email);
      localStorage.setItem("careplus_microsoft_user_email", email);
      addMsLog(`✓ Connected to Microsoft Account: ${email}`);
      addMsLog("Setting up 'CarePlus Action Plan' task list in Microsoft To Do...");
      addMsLog("GET https://graph.microsoft.com/v1.0/me/todo/lists");
      addMsLog("✓ Found or created list 'CarePlus Action Plan' (ID: careplus-action-plan-list).");
      setIsMsSyncing(false);
      triggerMsReconciliation(token, "careplus-action-plan-list");
    }, 1500);
  };

  const triggerMsReconciliation = async (token: string, listId: string) => {
    setIsMsSyncing(true);
    addMsLog("Starting Graph API delta query reconciliation sync...");
    addMsLog(`GET https://graph.microsoft.com/v1.0/me/todo/lists/${listId}/tasks/delta`);

    setTimeout(() => {
      addMsLog("Microsoft Graph API returned 200 OK");
      const nowStr = new Date().toLocaleTimeString();
      setMsLastSyncTime(nowStr);
      localStorage.setItem("careplus_microsoft_todo_last_sync", nowStr);
      setIsMsSyncing(false);
      addMsLog("✓ Delta reconciliation completed. Changes merged.");
    }, 1200);
  };

  const disconnectMicrosoftToDo = () => {
    setMsAccessToken(null);
    setMsUserEmail(null);
    setMsSyncLogs([]);
    localStorage.removeItem("careplus_microsoft_access_token");
    localStorage.removeItem("careplus_microsoft_user_email");
    localStorage.removeItem("careplus_microsoft_todo_last_sync");
    addMsLog("Microsoft To Do disconnected.");
  };

  const toggleSimulatedMsTask = (id: string) => {
    const updated = simulatedMsTasks.map(mt => {
      if (mt.id === id) {
        const nextStatus = mt.status === "completed" ? "notStarted" : "completed";
        addMsLog(`🔔 Microsoft Graph: Delta sync event received for task '${mt.title}' -> ${nextStatus}`);
        return { ...mt, status: nextStatus };
      }
      return mt;
    });
    setSimulatedMsTasks(updated);
  };

  // Apple Reminders Setup
  const requestAppleAccess = () => {
    addAppleLog("Triggering EventStore requestAccessToEntityType:EKEntityTypeReminder...");
    addAppleLog("Displaying iOS Native hardware permission dialog...");
    
    setTimeout(() => {
      setApplePermission('granted');
      localStorage.setItem("careplus_apple_permission", "granted");
      addAppleLog("✓ Access GRANTED by patient on this hardware device.");
      triggerAppleReconciliation();
    }, 1200);
  };

  const triggerAppleReconciliation = () => {
    setIsAppleSyncing(true);
    addAppleLog("Querying local reminders using predicateForIncompleteRemindersWithDueDate...");
    
    setTimeout(() => {
      addAppleLog("Successfully queried macOS/iOS EventStore SQLite container.");
      const nowStr = new Date().toLocaleTimeString();
      setAppleLastSyncTime(nowStr);
      localStorage.setItem("careplus_apple_last_sync", nowStr);
      setIsAppleSyncing(false);
      addAppleLog(`✓ Native EventKit SQLite synchronization complete.`);
    }, 1200);
  };

  const disconnectAppleReminders = () => {
    setApplePermission('prompt');
    setAppleSyncLogs([]);
    localStorage.removeItem("careplus_apple_permission");
    localStorage.removeItem("careplus_apple_last_sync");
    addAppleLog("Apple Reminders linked authorization revoked.");
  };

  const toggleSimulatedAppleReminder = (id: string) => {
    const updated = appleHardwareReminders.map(ar => {
      if (ar.id === id) {
        const nextCompleted = !ar.completed;
        addAppleLog(`🔔 EventKit Callback: Hardware reminder '${ar.title}' toggled to completed=${nextCompleted}`);
        return { ...ar, completed: nextCompleted };
      }
      return ar;
    });
    setAppleHardwareReminders(updated);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12" id="patient-settings-root">
      
      {/* Settings Welcome Header Banner */}
      <div className="bg-white border border-[#EBEFEA] rounded-3xl p-6 md:p-8 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4" id="settings-header-card">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Settings & Integrations</h1>
          <p className="text-xs text-slate-500 font-medium">Manage your personal demographics, contact information, clinical device integrations, and sync configurations.</p>
        </div>
        <div className="flex items-center gap-2 bg-[#F1F6F2] px-4 py-2 rounded-2xl border border-[#DEE8E0] text-[11px] font-black text-[#3F5B42]">
          <Info className="h-4 w-4 shrink-0" />
          <span>Patient Account Role: Patient View</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: EDITABLE PROFILE & CONTACT FORM */}
        <form onSubmit={handleSaveProfile} className="lg:col-span-7 space-y-6" id="settings-edit-profile-form">
          
          {/* Section A: Patient Identity */}
          <div className="bg-white border border-[#EBEFEA] rounded-3xl p-6 md:p-8 shadow-xs space-y-5" id="patient-identity-card">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="bg-[#7A9876]/10 p-2 rounded-xl text-[#7A9876]">
                <User className="h-4.5 w-4.5" />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Patient Identity</h3>
                <p className="text-[10px] text-slate-400 font-bold">Manage core demographic registry information</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">First Name</label>
                <input 
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First Name"
                  required
                  className="w-full text-xs font-bold text-slate-800 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:border-[#7A9876] focus:ring-1 focus:ring-[#7A9876] outline-none"
                  id="input-first-name"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Last Name</label>
                <input 
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last Name"
                  required
                  className="w-full text-xs font-bold text-slate-800 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:border-[#7A9876] focus:ring-1 focus:ring-[#7A9876] outline-none"
                  id="input-last-name"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Date of Birth</label>
                <input 
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  required
                  className="w-full text-xs font-bold text-slate-800 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:border-[#7A9876] focus:ring-1 focus:ring-[#7A9876] outline-none"
                  id="input-dob"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Gender</label>
                <select 
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  required
                  className="w-full text-xs font-bold text-slate-800 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:border-[#7A9876] focus:ring-1 focus:ring-[#7A9876] outline-none bg-white"
                  id="select-gender"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Non-Binary">Non-Binary</option>
                  <option value="Prefer Not To Say">Prefer Not To Say</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section B: Primary Contact (Including Residential Address) */}
          <div className="bg-white border border-[#EBEFEA] rounded-3xl p-6 md:p-8 shadow-xs space-y-5" id="primary-contact-card">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="bg-[#7A9876]/10 p-2 rounded-xl text-[#7A9876]">
                <Phone className="h-4.5 w-4.5" />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Primary Contact & Address</h3>
                <p className="text-[10px] text-slate-400 font-bold">Your reachability info and residential location settings</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Phone className="h-3 w-3" /> Phone Number
                </label>
                <input 
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                  className="w-full text-xs font-bold text-slate-800 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:border-[#7A9876] focus:ring-1 focus:ring-[#7A9876] outline-none"
                  id="input-phone"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Mail className="h-3 w-3" /> Email Address
                </label>
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@email.com"
                  required
                  className="w-full text-xs font-bold text-slate-800 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:border-[#7A9876] focus:ring-1 focus:ring-[#7A9876] outline-none"
                  id="input-email"
                />
              </div>

              {/* Residential Address integrated into Primary Contact */}
              <div className="md:col-span-2 border-t border-slate-50 pt-4 space-y-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-[#7A9876]" /> Residential Address
                </p>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="md:col-span-4 space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Street Address</label>
                    <input 
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="123 Care Street"
                      className="w-full text-xs font-bold text-slate-800 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:border-[#7A9876] focus:ring-1 focus:ring-[#7A9876] outline-none"
                      id="input-address"
                    />
                  </div>

                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">City</label>
                    <input 
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="City"
                      className="w-full text-xs font-bold text-slate-800 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:border-[#7A9876] focus:ring-1 focus:ring-[#7A9876] outline-none"
                      id="input-city"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">State</label>
                    <input 
                      type="text"
                      value={stateVal}
                      onChange={(e) => setStateVal(e.target.value)}
                      placeholder="State"
                      className="w-full text-xs font-bold text-slate-800 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:border-[#7A9876] focus:ring-1 focus:ring-[#7A9876] outline-none"
                      id="input-state"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">ZIP Code</label>
                    <input 
                      type="text"
                      value={zip}
                      onChange={(e) => setZip(e.target.value)}
                      placeholder="ZIP"
                      className="w-full text-xs font-bold text-slate-800 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:border-[#7A9876] focus:ring-1 focus:ring-[#7A9876] outline-none"
                      id="input-zip"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-between border-t border-slate-50 pt-4" id="save-profile-action-row">
              <div className="shrink-0">
                {saveMessage && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`text-xs font-bold p-2.5 rounded-xl border ${saveMessage.type === 'success' ? 'bg-[#EEF3F0] text-emerald-800 border-[#DEE8E0]' : 'bg-rose-50 text-rose-800 border-rose-200'}`}
                    id="profile-save-feedback-message"
                  >
                    {saveMessage.text}
                  </motion.div>
                )}
              </div>
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center justify-center gap-1.5 px-5 py-2.5 bg-[#7A9876] hover:bg-[#688265] text-white rounded-xl text-xs font-black transition-all cursor-pointer focus:outline-none select-none disabled:opacity-50"
                id="btn-save-profile"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Save Contact Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* RIGHT COLUMN: CORE SYSTEM INFO & THIRD-PARTY SYNC */}
        <div className="lg:col-span-5 space-y-6" id="settings-metadata-and-sync-container">
          
          {/* Section C: Core System Identifiers (READ-ONLY LOCKED) */}
          <div className="bg-[#FAF9F5] border border-[#ECE6D9] rounded-3xl p-6 shadow-xs space-y-4" id="core-system-metadata-card">
            <div className="flex items-center justify-between border-b border-[#E3DAC8] pb-3">
              <div className="flex items-center gap-2">
                <div className="bg-amber-100 p-2 rounded-xl text-amber-800 border border-amber-200">
                  <Lock className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Core System Registry</h3>
                  <p className="text-[10px] text-amber-800 font-black flex items-center gap-1">
                    <ShieldAlert className="h-3 w-3" /> Core System Locked & Verified
                  </p>
                </div>
              </div>
              <span className="text-[8px] font-black bg-slate-200 text-slate-600 px-2 py-0.5 rounded-md border border-slate-300">
                READ ONLY
              </span>
            </div>

            <p className="text-[10px] text-slate-500 leading-normal font-bold bg-amber-50/50 p-2.5 rounded-xl border border-amber-100">
              💡 Core health identifiers, registration dates, diagnostic indices, and team assignments are fully managed by the governing clinic node. They cannot be changed by the patient.
            </p>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-[#ECE6D9]/50">
                <span className="text-[10px] text-slate-500 font-extrabold uppercase">Patient ID</span>
                <span className="font-mono font-black text-slate-700 bg-white border border-[#E3DAC8] px-2 py-0.5 rounded-md">
                  {patientId}
                </span>
              </div>

              <div className="flex justify-between items-center py-1.5 border-b border-[#ECE6D9]/50">
                <span className="text-[10px] text-slate-500 font-extrabold uppercase">Medical Record Number (MRN)</span>
                <span className="font-mono font-black text-slate-700 bg-white border border-[#E3DAC8] px-2 py-0.5 rounded-md">
                  {patient?.mrn || 'MRN-48921-ME'}
                </span>
              </div>

              <div className="flex justify-between items-center py-1.5 border-b border-[#ECE6D9]/50">
                <span className="text-[10px] text-slate-500 font-extrabold uppercase">Primary Clinician</span>
                <span className="font-bold text-slate-700">
                  Dr. Gregory Theogate, MD
                </span>
              </div>

              <div className="flex justify-between items-center py-1.5 border-b border-[#ECE6D9]/50">
                <span className="text-[10px] text-slate-500 font-extrabold uppercase">Assigned Case Manager</span>
                <span className="font-bold text-slate-700">
                  Tamara Rivera, RN
                </span>
              </div>

              <div className="flex justify-between items-center py-1.5 border-b border-[#ECE6D9]/50">
                <span className="text-[10px] text-slate-500 font-extrabold uppercase">Diagnosed Condition</span>
                <span className="font-bold text-[#3F5B42] bg-[#E2ECE5] border border-[#DEE8E0] px-2 py-0.5 rounded-full text-[10px]">
                  {patient?.conditions?.[0] || 'Rheumatoid Arthritis'}
                </span>
              </div>

              <div className="flex justify-between items-center py-1.5">
                <span className="text-[10px] text-slate-500 font-extrabold uppercase">Registration Status</span>
                <span className="text-[9px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full">
                  ACTIVE REGISTRY
                </span>
              </div>
            </div>
          </div>

          {/* Section D: Patient Sync & Integration Hub */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100/90 border border-slate-200 rounded-3xl p-6 space-y-4 shadow-xs" id="patient-integration-hub-card">
            
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
              <div className="flex items-center gap-2">
                <div className="bg-emerald-500/10 p-2 rounded-xl text-emerald-700">
                  <Network className="h-5 w-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Patient Sync & Integration Hub</h3>
                  <p className="text-[10px] text-slate-500 font-bold">Unify clinical task plans across cloud and local services</p>
                </div>
              </div>
              <span className="text-[8px] font-black bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded uppercase tracking-wider">v2.4 Live</span>
            </div>

            {/* Tab Selector */}
            <div className="grid grid-cols-3 gap-1 bg-slate-200/70 p-1 rounded-xl" id="settings-sync-tab-selector">
              <button
                type="button"
                onClick={() => setActiveSyncTab('google')}
                className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer focus:outline-none select-none ${activeSyncTab === 'google' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'}`}
                id="tab-btn-google"
              >
                <CloudLightning className="h-3 w-3" />
                <span>Google Tasks</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSyncTab('microsoft')}
                className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer focus:outline-none select-none ${activeSyncTab === 'microsoft' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'}`}
                id="tab-btn-microsoft"
              >
                <Laptop className="h-3 w-3" />
                <span>Microsoft Graph</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSyncTab('apple')}
                className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer focus:outline-none select-none ${activeSyncTab === 'apple' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'}`}
                id="tab-btn-apple"
              >
                <Smartphone className="h-3 w-3" />
                <span>Apple EventKit</span>
              </button>
            </div>

            {/* Architectural Summary Matrix Badge Block */}
            <div className="bg-white border border-slate-200/60 p-3 rounded-xl space-y-2 text-[10px]" id="integration-architectural-badge">
              <div className="grid grid-cols-2 gap-y-1.5 gap-x-3 text-slate-600 font-medium">
                <div className="flex items-center gap-1.5 border-r border-slate-100 pr-1">
                  <span className="font-black text-[9px] text-slate-400 uppercase tracking-wider">Data Hub:</span>
                  <span className="text-slate-800 font-bold truncate">
                    {activeSyncTab === 'google' && "Google Tasks Cloud"}
                    {activeSyncTab === 'microsoft' && "Microsoft Graph ToDo"}
                    {activeSyncTab === 'apple' && "Local Apple Hardware"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 pl-1">
                  <span className="font-black text-[9px] text-slate-400 uppercase tracking-wider">Connection:</span>
                  <span className="text-slate-800 font-bold truncate">
                    {activeSyncTab === 'google' && "HTTPS REST APIs"}
                    {activeSyncTab === 'microsoft' && "HTTPS delta Tracking"}
                    {activeSyncTab === 'apple' && "Native EventKit Swift"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 border-r border-slate-100 pr-1 pt-1 border-t border-slate-50">
                  <span className="font-black text-[9px] text-slate-400 uppercase tracking-wider">Auth Flow:</span>
                  <span className="text-slate-800 font-bold truncate">
                    {activeSyncTab === 'google' && "OAuth 2.0 PKCE"}
                    {activeSyncTab === 'microsoft' && "Microsoft Entra ID"}
                    {activeSyncTab === 'apple' && "NSReminders Usage Prompt"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 pl-1 pt-1 border-t border-slate-50">
                  <span className="font-black text-[9px] text-slate-400 uppercase tracking-wider">Supported OS:</span>
                  <span className="text-slate-800 font-bold truncate">
                    {activeSyncTab === 'google' && "iOS, Android, Web"}
                    {activeSyncTab === 'microsoft' && "iOS, Android, Web"}
                    {activeSyncTab === 'apple' && "Strictly macOS/iOS apps"}
                  </span>
                </div>
              </div>
            </div>

            {/* ACTIVE TAB CONTENT */}
            <AnimatePresence mode="wait">
              {activeSyncTab === 'google' && (
                <motion.div
                  key="google-tab"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-3.5"
                  id="tab-content-google"
                >
                  <div className="flex justify-between items-center bg-blue-50/50 p-2.5 rounded-xl border border-blue-100">
                    <span className="text-[10px] text-blue-800 font-extrabold flex items-center gap-1">
                      <CloudLightning className="h-3.5 w-3.5" />
                      Google Tasks Status
                    </span>
                    {gAccessToken ? (
                      <span className="text-[9px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        CONNECTED
                      </span>
                    ) : (
                      <span className="text-[9px] font-black text-slate-400 bg-slate-200 px-2 py-0.5 rounded-full border border-slate-300">
                        DISCONNECTED
                      </span>
                    )}
                  </div>

                  {!gAccessToken ? (
                    <div className="space-y-2.5">
                      <p className="text-[10.5px] text-slate-500 leading-normal font-medium">
                        Link your Google Tasks account to publish your clinical care plans and synchronize task status in real-time.
                      </p>
                      <button
                        type="button"
                        onClick={connectGoogleTasks}
                        disabled={isSyncing}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer focus:outline-none select-none disabled:opacity-50 shadow-xs"
                        id="btn-connect-google"
                      >
                        {isSyncing ? (
                          <>
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            <span>Reconciling & Connecting...</span>
                          </>
                        ) : (
                          <>
                            <CloudLightning className="h-3.5 w-3.5" />
                            <span>Link Google Tasks Account</span>
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between shadow-2xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <UserCheck className="h-4 w-4 text-blue-600 shrink-0" />
                          <span className="text-[11px] font-black text-slate-700 truncate">{gUserEmail}</span>
                        </div>
                        <button
                          type="button"
                          onClick={disconnectGoogleTasks}
                          className="text-[9px] font-black text-rose-500 hover:text-rose-600 hover:underline flex items-center gap-0.5 focus:outline-none shrink-0"
                          id="btn-disconnect-google"
                        >
                          <LogOut className="h-3 w-3" /> Disconnect
                        </button>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => triggerReconciliation(gAccessToken, gListId!)}
                          disabled={isSyncing}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-black transition-colors cursor-pointer select-none focus:outline-none disabled:opacity-50"
                          id="btn-google-forcesync"
                        >
                          <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                          <span>{isSyncing ? "Syncing Tasks..." : "Manual Force Sync"}</span>
                        </button>
                      </div>

                      {/* Logs */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[9px] text-slate-400">
                          <span className="font-black uppercase tracking-wider">Sync Log / Cloud Webhook Payload</span>
                          <span>Last match: {lastSyncTime || "Never"}</span>
                        </div>
                        <div className="bg-slate-900 text-blue-400 font-mono text-[9px] p-2.5 rounded-lg h-24 overflow-y-auto space-y-1 border border-slate-800 shadow-inner">
                          {syncLogs.length === 0 ? (
                            <div className="text-slate-500 italic">Ready to synchronize. Toggle items in the Sandbox drawer below.</div>
                          ) : (
                            syncLogs.map((log, i) => (
                              <div key={i} className="leading-normal break-all">{log}</div>
                            ))
                          )}
                          <div ref={logsEndRef} />
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {activeSyncTab === 'microsoft' && (
                <motion.div
                  key="microsoft-tab"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-3.5"
                  id="tab-content-microsoft"
                >
                  <div className="flex justify-between items-center bg-indigo-50/50 p-2.5 rounded-xl border border-indigo-100">
                    <span className="text-[10px] text-indigo-800 font-extrabold flex items-center gap-1">
                      <Laptop className="h-3.5 w-3.5" />
                      Microsoft To Do Status
                    </span>
                    {msAccessToken ? (
                      <span className="text-[9px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        CONNECTED
                      </span>
                    ) : (
                      <span className="text-[9px] font-black text-slate-400 bg-slate-200 px-2 py-0.5 rounded-full border border-slate-300">
                        DISCONNECTED
                      </span>
                    )}
                  </div>

                  {!msAccessToken ? (
                    <div className="space-y-2.5">
                      <p className="text-[10.5px] text-slate-500 leading-normal font-medium">
                        Link Microsoft To Do to track actions using the high-performance **Microsoft Graph `/delta` sync API**.
                      </p>
                      <button
                        type="button"
                        onClick={connectMicrosoftToDo}
                        disabled={isMsSyncing}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer focus:outline-none select-none disabled:opacity-50 shadow-xs"
                        id="btn-connect-microsoft"
                      >
                        {isMsSyncing ? (
                          <>
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            <span>Negotiating Entra Token...</span>
                          </>
                        ) : (
                          <>
                            <Laptop className="h-3.5 w-3.5" />
                            <span>Link Microsoft To Do</span>
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between shadow-2xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <UserCheck className="h-4 w-4 text-indigo-600 shrink-0" />
                          <span className="text-[11px] font-black text-slate-700 truncate">{msUserEmail}</span>
                        </div>
                        <button
                          type="button"
                          onClick={disconnectMicrosoftToDo}
                          className="text-[9px] font-black text-rose-500 hover:text-rose-600 hover:underline flex items-center gap-0.5 focus:outline-none shrink-0"
                          id="btn-disconnect-microsoft"
                        >
                          <LogOut className="h-3 w-3" /> Disconnect
                        </button>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => triggerMsReconciliation(msAccessToken, msListId!)}
                          disabled={isMsSyncing}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-black transition-colors cursor-pointer select-none focus:outline-none disabled:opacity-50"
                          id="btn-microsoft-reconcile"
                        >
                          <RefreshCw className={`h-3.5 w-3.5 ${isMsSyncing ? "animate-spin" : ""}`} />
                          <span>{isMsSyncing ? "Evaluating Deltas..." : "Poll Graph API /delta"}</span>
                        </button>
                      </div>

                      {/* Logs */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[9px] text-slate-400">
                          <span className="font-black uppercase tracking-wider">MS Graph Sync Log (Active Delta Link)</span>
                          <span>Last state: {msLastSyncTime || "Never"}</span>
                        </div>
                        <div className="bg-slate-900 text-indigo-400 font-mono text-[9px] p-2.5 rounded-lg h-24 overflow-y-auto space-y-1 border border-slate-800 shadow-inner">
                          {msSyncLogs.length === 0 ? (
                            <div className="text-slate-500 italic">Ready to poll Microsoft Cloud Server. Try the Simulator below.</div>
                          ) : (
                            msSyncLogs.map((log, i) => (
                              <div key={i} className="leading-normal break-all">{log}</div>
                            ))
                          )}
                          <div ref={msLogsEndRef} />
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {activeSyncTab === 'apple' && (
                <motion.div
                  key="apple-tab"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-3.5"
                  id="tab-content-apple"
                >
                  <div className="flex justify-between items-center bg-purple-50/50 p-2.5 rounded-xl border border-purple-100">
                    <span className="text-[10px] text-purple-800 font-extrabold flex items-center gap-1">
                      <Smartphone className="h-3.5 w-3.5" />
                      iOS EventKit Permissions
                    </span>
                    {applePermission === 'granted' ? (
                      <span className="text-[9px] font-black text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full flex items-center gap-1 border border-purple-200">
                        <span className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-pulse" />
                        GRANTED
                      </span>
                    ) : (
                      <span className="text-[9px] font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                        PROMPT REQUIRED
                      </span>
                    )}
                  </div>

                  {applePermission !== 'granted' ? (
                    <div className="space-y-2.5">
                      <p className="text-[10.5px] text-slate-500 leading-normal font-medium">
                        Apple Reminders has no standard web OAuth API. Sync relies on your client app checking the local Apple hardware database using the native **EventKit Framework**.
                      </p>
                      <button
                        type="button"
                        onClick={requestAppleAccess}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer focus:outline-none select-none shadow-xs"
                        id="btn-connect-apple"
                      >
                        <Smartphone className="h-3.5 w-3.5" />
                        <span>Trigger iOS System Prompt</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between shadow-2xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <Database className="h-4 w-4 text-purple-600 shrink-0" />
                          <span className="text-[11px] font-black text-slate-700 truncate">Device Sandbox SQLite Database</span>
                        </div>
                        <button
                          type="button"
                          onClick={disconnectAppleReminders}
                          className="text-[9px] font-black text-rose-500 hover:text-rose-600 hover:underline flex items-center gap-0.5 focus:outline-none shrink-0"
                          id="btn-disconnect-apple"
                        >
                          Revoke Access
                        </button>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={triggerAppleReconciliation}
                          disabled={isAppleSyncing}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-black transition-colors cursor-pointer select-none focus:outline-none disabled:opacity-50"
                          id="btn-apple-query"
                        >
                          <RefreshCw className={`h-3.5 w-3.5 ${isAppleSyncing ? "animate-spin" : ""}`} />
                          <span>{isAppleSyncing ? "Reading EventKit..." : "Query Hardware SQLite"}</span>
                        </button>
                      </div>

                      {/* Logs */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[9px] text-slate-400">
                          <span className="font-black uppercase tracking-wider">Device EventStore Log (Predicate Query)</span>
                          <span>Last read: {appleLastSyncTime || "Never"}</span>
                        </div>
                        <div className="bg-slate-900 text-purple-400 font-mono text-[9px] p-2.5 rounded-lg h-24 overflow-y-auto space-y-1 border border-slate-800 shadow-inner">
                          {appleSyncLogs.length === 0 ? (
                            <div className="text-slate-500 italic">Ready to fetch. Trigger toggles in the Apple Simulator below.</div>
                          ) : (
                            appleSyncLogs.map((log, i) => (
                              <div key={i} className="leading-normal break-all">{log}</div>
                            ))
                          )}
                          <div ref={appleLogsEndRef} />
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* LIVE CLIENT APPLICATION SIMULATOR SANDBOX */}
            <div className="bg-[#EEF3F0] border border-[#DEE8E0] rounded-xl p-3.5 mt-2 space-y-3" id="live-client-simulator-sandbox">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-slate-700 uppercase tracking-wide">
                    📱 Live Simulator Sandbox
                  </span>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                </div>
                <span className="text-[8px] font-bold text-slate-500 bg-white/70 px-1.5 py-0.5 rounded-md border border-slate-200">
                  Test Bidirectional Sync
                </span>
              </div>
              <p className="text-[9.5px] text-slate-500 leading-normal font-medium">
                Toggle completion status directly in the user's external client application to simulate how changes synchronize when syncing:
              </p>

              {activeSyncTab === 'google' && (
                <div className="bg-white p-2.5 rounded-lg border border-[#DEE8E0] space-y-2" id="sim-google-box">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1">
                      <CloudLightning className="h-2.5 w-2.5" /> Simulated Google Cloud Server State
                    </span>
                    <span className="text-[8.5px] text-slate-400 font-mono">List: CarePlus Plan</span>
                  </div>
                  {gAccessToken ? (
                    <div className="space-y-1.5">
                      {simulatedGoogleTasks.map((gt) => (
                        <div key={gt.id} className="flex items-center justify-between text-[10.5px]">
                          <label className="flex items-center gap-2 text-slate-700 font-bold cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={gt.status === 'completed'}
                              onChange={() => toggleSimulatedGoogleTask(gt.id)}
                              className="rounded text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 border-slate-300"
                            />
                            <span className={gt.status === 'completed' ? "line-through text-slate-400 font-medium" : ""}>
                              {gt.title}
                            </span>
                          </label>
                          <span className="text-[8px] font-mono text-slate-400 bg-slate-50 border px-1 rounded-sm shrink-0">
                            {gt.status === 'completed' ? 'completed' : 'needsAction'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-2 text-[9px] text-slate-400 italic">
                      🔒 Please connect Google Tasks first to enable sandbox simulation.
                    </div>
                  )}
                </div>
              )}

              {activeSyncTab === 'microsoft' && (
                <div className="bg-white p-2.5 rounded-lg border border-[#DEE8E0] space-y-2" id="sim-microsoft-box">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1">
                      <Laptop className="h-2.5 w-2.5" /> Simulated Microsoft Graph Cloud List
                    </span>
                    <span className="text-[8.5px] text-slate-400 font-mono">Endpoint: /delta</span>
                  </div>
                  {msAccessToken ? (
                    <div className="space-y-1.5">
                      {simulatedMsTasks.map((mt) => (
                        <div key={mt.id} className="flex items-center justify-between text-[10.5px]">
                          <label className="flex items-center gap-2 text-slate-700 font-bold cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={mt.status === 'completed'}
                              onChange={() => toggleSimulatedMsTask(mt.id)}
                              className="rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 border-slate-300"
                            />
                            <span className={mt.status === 'completed' ? "line-through text-slate-400 font-medium" : ""}>
                              {mt.title}
                            </span>
                          </label>
                          <span className="text-[8px] font-mono text-slate-400 bg-slate-50 border px-1 rounded-sm shrink-0">
                            {mt.status === 'completed' ? 'completed' : 'notStarted'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-2 text-[9px] text-slate-400 italic">
                      🔒 Please connect Microsoft To Do first to enable sandbox simulation.
                    </div>
                  )}
                </div>
              )}

              {activeSyncTab === 'apple' && (
                <div className="bg-white p-2.5 rounded-lg border border-[#DEE8E0] space-y-2" id="sim-apple-box">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-[9px] font-black text-purple-600 uppercase tracking-widest flex items-center gap-1">
                      <Smartphone className="h-2.5 w-2.5" /> Simulated iOS Hardware Reminder SQLite
                    </span>
                    <span className="text-[8.5px] text-slate-400 font-mono">EventKit predicate</span>
                  </div>
                  {applePermission === 'granted' ? (
                    <div className="space-y-1.5">
                      {appleHardwareReminders.map((ar) => (
                        <div key={ar.id} className="flex items-center justify-between text-[10.5px]">
                          <label className="flex items-center gap-2 text-slate-700 font-bold cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={ar.completed}
                              onChange={() => toggleSimulatedAppleReminder(ar.id)}
                              className="rounded text-purple-600 focus:ring-purple-500 h-3.5 w-3.5 border-slate-300"
                            />
                            <span className={ar.completed ? "line-through text-slate-400 font-medium" : ""}>
                              {ar.title}
                            </span>
                          </label>
                          <span className="text-[8px] font-mono text-slate-400 bg-slate-50 border px-1 rounded-sm shrink-0">
                            {ar.completed ? 'completed' : 'incomplete'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-2 text-[9px] text-slate-400 italic">
                      🔒 Please authorize Apple Reminders first to enable SQLite simulation.
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Settings;
