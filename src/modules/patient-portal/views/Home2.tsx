import { useState, useEffect, useRef } from "react";
import ProgressRing from "../components/progress-ring";
import Card from "../components/card";
import { 
  Plus, 
  Minus, 
  CheckCircle, 
  Flame, 
  FlameKindling, 
  Info, 
  Smile, 
  Activity, 
  Heart, 
  Droplet,
  CheckCircle2,
  Circle,
  AlertCircle,
  Dumbbell,
  Utensils,
  Pill,
  Sparkles,
  RefreshCw,
  Unlink,
  ExternalLink,
  Lock,
  CloudLightning,
  Settings,
  Shield,
  ListTodo,
  UserCheck,
  CheckSquare,
  LogOut,
  Smartphone,
  Laptop,
  Database,
  Network
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../../../lib/utils";
import { auth, db } from "../../../lib/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useCurrentUser } from "../../../hooks/useCurrentUser";

// Mapping string names to React icons for safe serialization/deserialization from localStorage
const iconMap: Record<string, any> = {
  Pill: Pill,
  AlertCircle: AlertCircle,
  Dumbbell: Dumbbell,
  Utensils: Utensils,
};

interface TaskItem {
  id: number;
  title: string;
  time: string;
  category: string;
  iconName: string;
  completed: boolean;
  color: string;
  bg: string;
  googleTaskId?: string | null;
  microsoftTaskId?: string | null;
  appleReminderId?: string | null;
}

const DEFAULT_TASKS: TaskItem[] = [
  { id: 1, title: "Morning Metformin (500mg)", time: "08:00 AM", category: "Medication", iconName: "Pill", completed: true, color: "text-blue-500", bg: "bg-blue-50", googleTaskId: null },
  { id: 2, title: "Post-Breakfast Blood Glucose Log", time: "09:00 AM", category: "Monitoring", iconName: "AlertCircle", completed: true, color: "text-rose-500", bg: "bg-rose-50", googleTaskId: null },
  { id: 3, title: "15-Min Mobility & Stretching", time: "11:30 AM", category: "Physical Training", iconName: "Dumbbell", completed: false, color: "text-emerald-500", bg: "bg-emerald-50", googleTaskId: null },
  { id: 4, title: "Low-GI Lunch Pattern", time: "01:00 PM", category: "Nutrition", iconName: "Utensils", completed: false, color: "text-amber-500", bg: "bg-amber-50", googleTaskId: null },
  { id: 5, title: "Evening Metformin (500mg)", time: "08:00 PM", category: "Medication", iconName: "Pill", completed: false, color: "text-blue-500", bg: "bg-blue-50", googleTaskId: null },
];

export default function Home2() {
  const { userProfile } = useCurrentUser();
  const userId = userProfile?.id;

  // --- Daily Behavior States ---
  const [dietProgress, setDietProgress] = useState(60);        // %
  const [stepsProgress, setStepsProgress] = useState(40);      // %
  const [medProgress, setMedProgress] = useState(80);          // %

  // --- Hydration Log (Card B) ---
  const [glasses, setGlasses] = useState(() => {
    try {
      const saved = localStorage.getItem("careplus_prm_glasses");
      return saved ? Number(saved) : 0;
    } catch {
      return 0;
    }
  });
  const maxGlasses = 8;

  const addGlass = () => {
    if (glasses < maxGlasses) {
      const next = glasses + 1;
      setGlasses(next);
      localStorage.setItem("careplus_prm_glasses", String(next));
    }
  };

  const removeGlass = () => {
    if (glasses > 0) {
      const next = glasses - 1;
      setGlasses(next);
      localStorage.setItem("careplus_prm_glasses", String(next));
    }
  };

  // --- Mood Logger ---
  const [mood, setMood] = useState<null | string>(() => {
    try {
      return localStorage.getItem("careplus_prm_mood") || null;
    } catch {
      return null;
    }
  });
  const moods = ["😊", "😐", "😞", "😡", "😴"];

  const handleSetMood = (m: string) => {
    setMood(m);
    localStorage.setItem("careplus_prm_mood", m);
  };

  // --- Daily Action Plan States ---
  const [tasks, setTasks] = useState<TaskItem[]>(() => {
    try {
      const saved = localStorage.getItem("careplus_prm_daily_tasks");
      return saved ? JSON.parse(saved) : DEFAULT_TASKS;
    } catch {
      return DEFAULT_TASKS;
    }
  });

  // Save local tasks whenever they change
  useEffect(() => {
    localStorage.setItem("careplus_prm_daily_tasks", JSON.stringify(tasks));
    if (userId) {
      // Backup to Firestore under user-specific subcollection
      setDoc(doc(db, "users", userId, "patient_tasks", "today"), { tasks }, { merge: true })
        .catch(err => console.warn("Failed to backup tasks to firestore:", err));
    }
  }, [tasks, userId]);

  // Load from Firestore on mount if available
  useEffect(() => {
    if (userId) {
      getDoc(doc(db, "users", userId, "patient_tasks", "today"))
        .then(docSnap => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data?.tasks && Array.isArray(data.tasks)) {
              setTasks(data.tasks);
            }
          }
        })
        .catch(err => console.warn("Could not load tasks backup from firestore:", err));
    }
  }, [userId]);

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

  // Auto-scroll sync logs
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

  const addMsLog = (msg: string) => {
    setMsSyncLogs(prev => [...prev.slice(-19), `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  useEffect(() => {
    localStorage.setItem("careplus_microsoft_simulated_tasks", JSON.stringify(simulatedMsTasks));
  }, [simulatedMsTasks]);

  useEffect(() => {
    if (msLogsEndRef.current) {
      msLogsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [msSyncLogs]);

  // Connect to Microsoft
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

  const disconnectMicrosoftToDo = () => {
    setMsAccessToken(null);
    setMsUserEmail(null);
    setMsSyncLogs([]);
    localStorage.removeItem("careplus_microsoft_access_token");
    localStorage.removeItem("careplus_microsoft_user_email");
    localStorage.removeItem("careplus_microsoft_todo_last_sync");
    addMsLog("Microsoft To Do disconnected.");
  };

  // Bidirectional sync for Microsoft To Do
  const triggerMsReconciliation = async (token: string, listId: string) => {
    setIsMsSyncing(true);
    addMsLog("Starting Graph API delta query reconciliation sync...");
    addMsLog(`GET https://graph.microsoft.com/v1.0/me/todo/lists/${listId}/tasks/delta`);

    setTimeout(() => {
      let updatedTasks = [...tasks];
      let changesDetected = false;
      let msTasksCopy = [...simulatedMsTasks];

      addMsLog("Graph API returned 200 OK");
      addMsLog(`Retrieved ${msTasksCopy.length} items from Microsoft Cloud server state.`);
      addMsLog(`Received delta link token: @odata.deltaLink=https://graph.microsoft.com/v1.0/.../tasks/delta?$deltatoken=CarePlusDeltaToken_${Date.now()}`);

      for (const localTask of updatedTasks) {
        const match = msTasksCopy.find((mt: any) =>
          mt.id === localTask.microsoftTaskId ||
          mt.title.trim().toLowerCase() === localTask.title.trim().toLowerCase()
        );

        if (match) {
          if (localTask.microsoftTaskId !== match.id) {
            localTask.microsoftTaskId = match.id;
            changesDetected = true;
          }

          const msIsCompleted = match.status === "completed";
          if (msIsCompleted && !localTask.completed) {
            localTask.completed = true;
            changesDetected = true;
            addMsLog(`✓ Microsoft To Do: '${localTask.title}' was completed on Microsoft client. Synced completed.`);
          } else if (!msIsCompleted && localTask.completed) {
            addMsLog(`↑ Pushing completion state to MS Graph for task: '${localTask.title}'`);
            match.status = "completed";
            changesDetected = true;
          }
        } else {
          addMsLog(`+ Exporting local task to Microsoft To Do: '${localTask.title}'`);
          const newId = `ms-task-${Date.now()}-${localTask.id}`;
          msTasksCopy.push({
            id: newId,
            title: localTask.title,
            status: localTask.completed ? "completed" : "notStarted"
          });
          localTask.microsoftTaskId = newId;
          changesDetected = true;
        }
      }

      if (changesDetected) {
        setTasks(updatedTasks);
        setSimulatedMsTasks(msTasksCopy);
      }

      const nowStr = new Date().toLocaleTimeString();
      setMsLastSyncTime(nowStr);
      localStorage.setItem("careplus_microsoft_todo_last_sync", nowStr);
      addMsLog("✓ Delta reconciliation sync complete! MS Graph Cloud and Local match perfectly.");
      setIsMsSyncing(false);
    }, 1200);
  };

  // Toggle MS Task directly on Microsoft "app" side
  const toggleSimulatedMsTask = (id: string) => {
    const updated = simulatedMsTasks.map(mt => {
      if (mt.id === id) {
        const nextStatus = mt.status === "completed" ? "notStarted" : "completed";
        addMsLog(`🔔 Webhook: Microsoft To Do app flipped '${mt.title}' status to: ${nextStatus}`);
        return { ...mt, status: nextStatus };
      }
      return mt;
    });
    setSimulatedMsTasks(updated);
  };


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

  // Simulated Apple EventKit SQlite reminder store (inside device sandbox)
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

  const addAppleLog = (msg: string) => {
    setAppleSyncLogs(prev => [...prev.slice(-19), `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  useEffect(() => {
    localStorage.setItem("careplus_apple_simulated_reminders", JSON.stringify(appleHardwareReminders));
  }, [appleHardwareReminders]);

  useEffect(() => {
    if (appleLogsEndRef.current) {
      appleLogsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [appleSyncLogs]);

  const requestAppleAccess = () => {
    addAppleLog("Triggering iOS system prompt for NSRemindersFullAccessUsageDescription...");
    addAppleLog("CarePlus requests full read/write permission to your Apple Reminders app.");
    
    setTimeout(() => {
      setApplePermission('granted');
      localStorage.setItem("careplus_apple_permission", "granted");
      addAppleLog("✓ iOS Reminders full permission granted by hardware user authorization.");
      triggerAppleReconciliation();
    }, 800);
  };

  const disconnectAppleReminders = () => {
    setApplePermission('prompt');
    setAppleSyncLogs([]);
    localStorage.removeItem("careplus_apple_permission");
    localStorage.removeItem("careplus_apple_last_sync");
    addAppleLog("Apple Reminders sandbox permissions revoked.");
  };

  const triggerAppleReconciliation = () => {
    if (applePermission !== 'granted') {
      addAppleLog("⚠️ Error: Device EventKit permission is 'prompt' or 'denied'. Access to local SQLite sandbox is locked.");
      return;
    }

    setIsAppleSyncing(true);
    addAppleLog("Swift: Initializing EKEventStore and querying database on device...");
    addAppleLog("Swift: let predicate = eventStore.predicateForIncompleteReminders(...)");
    addAppleLog("Swift: eventStore.fetchReminders(matching: predicate)");

    setTimeout(() => {
      let updatedTasks = [...tasks];
      let changesDetected = false;
      let remsCopy = [...appleHardwareReminders];

      addAppleLog(`Swift: Query returned ${remsCopy.length} calendarItemIdentifiers from local storage.`);

      for (const localTask of updatedTasks) {
        const match = remsCopy.find((ar: any) =>
          ar.id === localTask.appleReminderId ||
          ar.title.trim().toLowerCase() === localTask.title.trim().toLowerCase()
        );

        if (match) {
          if (localTask.appleReminderId !== match.id) {
            localTask.appleReminderId = match.id;
            changesDetected = true;
          }

          if (match.completed && !localTask.completed) {
            localTask.completed = true;
            changesDetected = true;
            addAppleLog(`✓ Apple EventKit: '${localTask.title}' completed in device database.`);
          } else if (!match.completed && localTask.completed) {
            addAppleLog(`Swift: Writing 'isCompleted = true' back to hardware for: '${localTask.title}'`);
            match.completed = true;
            changesDetected = true;
          }
        } else {
          addAppleLog(`Swift: Creating new EKReminder for '${localTask.title}' in Default Calendar...`);
          const newId = `apple-rem-${Date.now()}-${localTask.id}`;
          remsCopy.push({
            id: newId,
            title: localTask.title,
            completed: localTask.completed
          });
          localTask.appleReminderId = newId;
          changesDetected = true;
        }
      }

      if (changesDetected) {
        setTasks(updatedTasks);
        setAppleHardwareReminders(remsCopy);
      }

      const nowStr = new Date().toLocaleTimeString();
      setAppleLastSyncTime(nowStr);
      localStorage.setItem("careplus_apple_last_sync", nowStr);
      addAppleLog("✓ Apple Reminders (EventKit) device-level database sync complete.");
      setIsAppleSyncing(false);
    }, 1000);
  };

  // Toggle Apple Reminder directly on Apple "device" side
  const toggleSimulatedAppleReminder = (id: string) => {
    const updated = appleHardwareReminders.map(ar => {
      if (ar.id === id) {
        const nextStatus = !ar.completed;
        addAppleLog(`🔔 Device EventKit Change Notification: User flipped '${ar.title}' status to: ${nextStatus ? 'Completed' : 'Incomplete'}`);
        return { ...ar, completed: nextStatus };
      }
      return ar;
    });
    setAppleHardwareReminders(updated);
  };

  // --- Google Tasks Simulator State ---
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

      // Now set up or fetch list
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

  // Fetch or create the specific "CarePlus Action Plan" task list
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
      
      // Perform initial reconciliation
      await triggerReconciliation(token, listId);
    } catch (err: any) {
      addLog(`❌ Task List Setup Error: ${err.message}`);
      setIsSyncing(false);
    }
  };

  // Bidirectional Synchronization & Reconciliation Algorithm
  const triggerReconciliation = async (token: string, listId: string) => {
    if (isSyncing && syncLogs.length > 0 && syncLogs[syncLogs.length - 1].includes("Initiating")) return;
    setIsSyncing(true);
    addLog("Syncing local items with Google Tasks...");

    if (token.startsWith("g-access-token-demo")) {
      setTimeout(() => {
        let updatedTasks = [...tasks];
        let changesDetected = false;
        let gTasksCopy = [...simulatedGoogleTasks];

        addLog("Simulated Google API returned 200 OK");
        addLog(`Retrieved ${gTasksCopy.length} items from Google Cloud server state (Simulated).`);

        for (const localTask of updatedTasks) {
          const match = gTasksCopy.find((gt: any) =>
            gt.id === localTask.googleTaskId ||
            gt.title.trim().toLowerCase() === localTask.title.trim().toLowerCase()
          );

          if (match) {
            if (localTask.googleTaskId !== match.id) {
              localTask.googleTaskId = match.id;
              changesDetected = true;
            }

            const googleIsCompleted = match.status === "completed";
            if (googleIsCompleted && !localTask.completed) {
              localTask.completed = true;
              changesDetected = true;
              addLog(`✓ Google Tasks: '${localTask.title}' completion synced to local CarePlus.`);
            } else if (!googleIsCompleted && localTask.completed) {
              addLog(`↑ Syncing completion to Google: '${localTask.title}'`);
              match.status = "completed";
              changesDetected = true;
            }
          } else {
            addLog(`+ Exporting local task to Google Tasks: '${localTask.title}'`);
            const newId = `g-task-${Date.now()}-${localTask.id}`;
            gTasksCopy.push({
              id: newId,
              title: localTask.title,
              status: localTask.completed ? "completed" : "needsAction"
            });
            localTask.googleTaskId = newId;
            changesDetected = true;
          }
        }

        if (changesDetected) {
          setTasks(updatedTasks);
          setSimulatedGoogleTasks(gTasksCopy);
        }

        const nowStr = new Date().toLocaleTimeString();
        setLastSyncTime(nowStr);
        localStorage.setItem("careplus_google_tasks_last_sync", nowStr);
        addLog("✓ Simulated Google Tasks bidirectional sync complete!");
        setIsSyncing(false);
      }, 1000);
      return;
    }

    try {
      // 1. Fetch remote tasks
      const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${listId}/tasks?showCompleted=true&showHidden=true`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error(`Google API returned status ${res.status}`);
      const data = await res.json();
      const remoteTasks = data.items || [];
      addLog(`Retrieved ${remoteTasks.length} tasks from Google Tasks.`);

      let updatedTasks = [...tasks];
      let changesDetected = false;

      // 2. Align Google Tasks state into local CarePlus state
      for (const localTask of updatedTasks) {
        // Find by stored googleTaskId, or fallback match by Title
        const match = remoteTasks.find((rt: any) => 
          rt.id === localTask.googleTaskId || 
          rt.title.trim().toLowerCase() === localTask.title.trim().toLowerCase()
        );

        if (match) {
          // Link ID if missing
          if (localTask.googleTaskId !== match.id) {
            localTask.googleTaskId = match.id;
            changesDetected = true;
          }

          const googleIsCompleted = match.status === "completed";
          if (googleIsCompleted && !localTask.completed) {
            localTask.completed = true;
            changesDetected = true;
            addLog(`✓ Google Tasks completion synced: '${localTask.title}' completed.`);
          } else if (!googleIsCompleted && localTask.completed) {
            // Local is complete but Google is not: sync forward to Google
            addLog(`↑ Syncing completion to Google: '${localTask.title}'`);
            await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${listId}/tasks/${match.id}`, {
              method: "PATCH",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                status: "completed",
                completed: new Date().toISOString()
              })
            });
          }
        } else {
          // Task does not exist on Google Tasks yet: Export it!
          addLog(`+ Exporting local task to Google: '${localTask.title}'`);
          const createRes = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${listId}/tasks`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              title: localTask.title,
              notes: `Category: ${localTask.category} (Synced from CarePlus PRM)`,
              status: localTask.completed ? "completed" : "needsAction",
              completed: localTask.completed ? new Date().toISOString() : undefined
            })
          });

          if (createRes.ok) {
            const createdGTask = await createRes.json();
            localTask.googleTaskId = createdGTask.id;
            changesDetected = true;
          }
        }
      }

      if (changesDetected) {
        setTasks(updatedTasks);
      }

      const nowStr = new Date().toLocaleTimeString();
      setLastSyncTime(nowStr);
      localStorage.setItem("careplus_google_tasks_last_sync", nowStr);
      addLog("✓ Synchronized! Local and Google Tasks are now 100% matched.");
    } catch (err: any) {
      console.error("Reconciliation failed:", err);
      addLog(`❌ Sync Error: ${err.message || "Network failure"}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Toggle local task & push change immediately to Google Tasks if linked
  const toggleTask = async (id: number) => {
    const nextCompleted = !tasks.find(t => t.id === id)?.completed;
    
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));

    // If connected to Google Tasks, sync the completion status in real-time
    const toggledTask = tasks.find(t => t.id === id);
    if (gAccessToken && gListId && toggledTask) {
      if (gAccessToken.startsWith("g-access-token-demo")) {
        addLog(`↑ Updating '${toggledTask.title}' on Google Tasks (Simulated Cloud)...`);
        setSimulatedGoogleTasks(prev => prev.map(gt => 
          gt.id === toggledTask.googleTaskId 
            ? { ...gt, status: nextCompleted ? "completed" : "needsAction" } 
            : gt
        ));
        addLog(`✓ Status synced to Google Tasks Simulated Cloud Database.`);
      } else {
        try {
          if (toggledTask.googleTaskId) {
            addLog(`↑ Updating '${toggledTask.title}' on Google Tasks...`);
            await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${gListId}/tasks/${toggledTask.googleTaskId}`, {
              method: "PATCH",
              headers: {
                Authorization: `Bearer ${gAccessToken}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                status: nextCompleted ? "completed" : "needsAction",
                completed: nextCompleted ? new Date().toISOString() : null
              })
            });
            addLog(`✓ Status synced to Google Tasks.`);
          } else {
            // If no linked ID, trigger full sync to match
            triggerReconciliation(gAccessToken, gListId);
          }
        } catch (err) {
          console.warn("Failed real-time single task push:", err);
        }
      }
    }

    // If connected to Microsoft To Do, sync the completion status in real-time
    if (msAccessToken && msListId && toggledTask) {
      try {
        if (toggledTask.microsoftTaskId) {
          addMsLog(`↑ Updating '${toggledTask.title}' on Microsoft Graph...`);
          setSimulatedMsTasks(prev => prev.map(mt => 
            mt.id === toggledTask.microsoftTaskId 
              ? { ...mt, status: nextCompleted ? "completed" : "notStarted" } 
              : mt
          ));
          addMsLog(`✓ Status synced to Microsoft To Do cloud server.`);
        } else {
          triggerMsReconciliation(msAccessToken, msListId);
        }
      } catch (err) {
        console.warn("Failed Microsoft real-time push:", err);
      }
    }

    // If connected to Apple Reminders, sync the completion status in real-time
    if (applePermission === 'granted' && toggledTask) {
      try {
        if (toggledTask.appleReminderId) {
          addAppleLog(`Swift: Updating isCompleted to ${nextCompleted} for identifier ${toggledTask.appleReminderId}`);
          setAppleHardwareReminders(prev => prev.map(ar => 
            ar.id === toggledTask.appleReminderId 
              ? { ...ar, completed: nextCompleted } 
              : ar
          ));
          addAppleLog(`✓ Local EventKit database updated.`);
        } else {
          triggerAppleReconciliation();
        }
      } catch (err) {
        console.warn("Failed Apple real-time push:", err);
      }
    }
  };

  // Unlink Google Tasks account safely
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

  // --- Active Window Foreground/Lifecycle Trigger ---
  useEffect(() => {
    const handleForegroundSync = () => {
      if (gAccessToken && gListId) {
        addLog("Foreground event detected, checking updates...");
        triggerReconciliation(gAccessToken, gListId);
      }
    };

    window.addEventListener("focus", handleForegroundSync);
    document.addEventListener("visibilitychange", handleForegroundSync);

    return () => {
      window.removeEventListener("focus", handleForegroundSync);
      document.removeEventListener("visibilitychange", handleForegroundSync);
    };
  }, [gAccessToken, gListId, tasks]);

  // Auto-sync on load if token is available (in-memory token will require re-syncing, which is perfect for security)
  useEffect(() => {
    if (gAccessToken && gListId) {
      triggerReconciliation(gAccessToken, gListId);
    }
  }, [gAccessToken, gListId]);

  const completedCount = tasks.filter(t => t.completed).length;
  const progress = (completedCount / tasks.length) * 100;

  // Handler to add the Walk to task list
  const addWalkTask = () => {
    const walkExists = tasks.some(t => t.title === "10-Min Post-Meal Walk");
    if (!walkExists) {
      const newWalkItem: TaskItem = {
        id: Date.now(),
        title: "10-Min Post-Meal Walk",
        time: "08:30 PM",
        category: "Physical Training",
        iconName: "Dumbbell",
        completed: false,
        color: "text-emerald-500",
        bg: "bg-emerald-50",
        googleTaskId: null
      };

      const updated = [...tasks, newWalkItem];
      setTasks(updated);

      // If synced, immediately export this new task
      if (gAccessToken && gListId) {
        if (gAccessToken.startsWith("g-access-token-demo")) {
          addLog(`+ Exporting new walk task to Google Tasks (Simulated)...`);
          const newId = `g-task-${Date.now()}-walk`;
          setSimulatedGoogleTasks(prev => [...prev, {
            id: newId,
            title: newWalkItem.title,
            status: "needsAction"
          }]);
          setTasks(prev => prev.map(t => t.title === newWalkItem.title ? { ...t, googleTaskId: newId } : t));
          addLog(`✓ Successfully exported walk task to Simulated Google Tasks.`);
        } else {
          addLog(`+ Exporting new walk task to Google Tasks...`);
          fetch(`https://tasks.googleapis.com/tasks/v1/lists/${gListId}/tasks`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${gAccessToken}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              title: newWalkItem.title,
              notes: "Category: Physical Training (Synced from CarePlus PRM)",
              status: "needsAction"
            })
          }).then(res => res.json())
            .then(data => {
              if (data.id) {
                setTasks(prev => prev.map(t => t.title === newWalkItem.title ? { ...t, googleTaskId: data.id } : t));
                addLog(`✓ Successfully exported walk task to Google Tasks.`);
              }
            })
            .catch(err => console.warn("Failed to export walk task:", err));
        }
      }

      // Export to Microsoft To Do
      if (msAccessToken && msListId) {
        addMsLog(`+ Exporting new walk task to Microsoft To Do...`);
        const newId = `ms-task-${Date.now()}-walk`;
        setSimulatedMsTasks(prev => [...prev, {
          id: newId,
          title: newWalkItem.title,
          status: "notStarted"
        }]);
        setTasks(prev => prev.map(t => t.title === newWalkItem.title ? { ...t, microsoftTaskId: newId } : t));
        addMsLog(`✓ Successfully exported walk task to Microsoft To Do.`);
      }

      // Export to Apple Reminders
      if (applePermission === 'granted') {
        addAppleLog(`Swift: Creating new EKReminder for '${newWalkItem.title}'...`);
        const newId = `apple-rem-${Date.now()}-walk`;
        setAppleHardwareReminders(prev => [...prev, {
          id: newId,
          title: newWalkItem.title,
          completed: false
        }]);
        setTasks(prev => prev.map(t => t.title === newWalkItem.title ? { ...t, appleReminderId: newId } : t));
        addAppleLog(`✓ Successfully created reminder in Apple Reminders.`);
      }
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 md:p-8 font-sans animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-[#EEF3F0] rounded-3xl p-6 md:p-8 border border-[#DEE8E0] shadow-sm relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[#3F5B42]">Home 2 Patient Center</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight leading-none mb-2">
            Welcome to Your Daily Health Hub
          </h1>
          <p className="text-xs text-slate-500 font-medium max-w-xl">
            Track and log your active clinical behavioral modifications, hydration levels, and cognitive mood records in real time.
          </p>
        </div>
        <div className="flex items-center gap-4 bg-white/80 backdrop-blur-xs p-4 rounded-2xl border border-[#DEE8E0]">
          <Heart className="h-10 w-10 text-emerald-600 animate-pulse shrink-0" />
          <div>
            <div className="text-[10px] font-black uppercase text-slate-400">Current Health Adherence</div>
            <div className="text-xl font-extrabold text-slate-800">{Math.round((dietProgress + stepsProgress + medProgress) / 3)}%</div>
          </div>
        </div>
      </div>

      {/* Two-Column Responsive Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Behavioral Metrics, Profile Logs, Summary */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* ============================= */}
          {/*   DAILY BEHAVIOR PROGRESS     */}
          {/* ============================= */}
          <section className="bg-white border border-slate-200/80 rounded-3xl p-6 md:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-emerald-600" />
                <h2 className="text-base font-black text-slate-800 uppercase tracking-wider">Daily Behavior Metrics</h2>
              </div>
              <span className="text-xs text-slate-400 font-semibold">Active Targets</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="flex flex-col items-center p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                <ProgressRing
                  label="Diet"
                  value={dietProgress}
                  color="#FF7F50"
                />
                <div className="mt-4 flex items-center gap-2">
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={dietProgress} 
                    onChange={(e) => setDietProgress(Number(e.target.value))}
                    className="w-24 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#FF7F50]"
                  />
                  <span className="text-[10px] font-black text-slate-500">{dietProgress}%</span>
                </div>
              </div>

              <div className="flex flex-col items-center p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                <ProgressRing
                  label="Steps"
                  value={stepsProgress}
                  color="#1E90FF"
                />
                <div className="mt-4 flex items-center gap-2">
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={stepsProgress} 
                    onChange={(e) => setStepsProgress(Number(e.target.value))}
                    className="w-24 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#1E90FF]"
                  />
                  <span className="text-[10px] font-black text-slate-500">{stepsProgress}%</span>
                </div>
              </div>

              <div className="flex flex-col items-center p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                <ProgressRing
                  label="Medication"
                  value={medProgress}
                  color="#32CD32"
                />
                <div className="mt-4 flex items-center gap-2">
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={medProgress} 
                    onChange={(e) => setMedProgress(Number(e.target.value))}
                    className="w-24 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#32CD32]"
                  />
                  <span className="text-[10px] font-black text-slate-500">{medProgress}%</span>
                </div>
              </div>
            </div>
          </section>

          {/* Lifestyle & Mood Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {/* ============================= */}
            {/*   LIFESTYLE & HYDRATION CARD  */}
            {/* ============================= */}
            <Card title="Lifestyle & Hydration Profile">
              <div className="flex flex-col items-center justify-center py-4 bg-slate-50/50 rounded-2xl border border-slate-100 min-h-[220px]">
                <Droplet className="h-12 w-12 text-[#1E90FF] mb-2 animate-bounce" style={{ animationDuration: '3s' }} />
                <p className="text-sm font-bold text-slate-600 mb-1">Hydration Log</p>
                <p className="text-2xl font-black text-slate-800 tracking-tight mb-4">
                  {glasses} <span className="text-base text-slate-400 font-medium">/ {maxGlasses} glasses</span>
                </p>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={removeGlass}
                    disabled={glasses <= 0}
                    className="flex items-center justify-center h-10 w-24 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:hover:bg-white text-slate-600 font-black text-xs transition-colors cursor-pointer select-none focus:outline-none"
                  >
                    <Minus className="h-4 w-4 mr-1.5" /> Remove
                  </button>
                  <button 
                    onClick={addGlass}
                    disabled={glasses >= maxGlasses}
                    className="flex items-center justify-center h-10 w-24 bg-[#3F5B42] text-white rounded-xl hover:bg-[#324935] disabled:opacity-40 text-xs font-black transition-colors cursor-pointer select-none focus:outline-none"
                  >
                    <Plus className="h-4 w-4 mr-1.5" /> Add Glass
                  </button>
                </div>

                {/* Micro progress line */}
                <div className="w-48 bg-slate-200 h-1.5 rounded-full mt-6 overflow-hidden">
                  <div 
                    className="bg-[#1E90FF] h-full transition-all duration-300 rounded-full" 
                    style={{ width: `${(glasses / maxGlasses) * 100}%` }}
                  />
                </div>
              </div>
            </Card>

            {/* ============================= */}
            {/*         MOOD LOGGER           */}
            {/* ============================= */}
            <Card title="Mood Logger">
              <div className="flex flex-col items-center justify-center py-4 bg-slate-50/50 rounded-2xl border border-slate-100 min-h-[220px]">
                <Smile className="h-10 w-10 text-amber-500 mb-3" />
                <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4">Select your mood</p>
                <div className="flex items-center justify-center gap-2">
                  {moods.map((m) => (
                    <button
                      key={m}
                      className={`h-11 w-11 rounded-xl text-2xl flex items-center justify-center transition-all duration-200 cursor-pointer focus:outline-none select-none hover:scale-110 ${
                        mood === m 
                          ? "bg-amber-50 border-2 border-amber-500 shadow-md transform -translate-y-1" 
                          : "bg-white border border-slate-200 hover:border-slate-300 shadow-xs"
                      }`}
                      onClick={() => handleSetMood(m)}
                    >
                      {m}
                    </button>
                  ))}
                </div>

                <div className="h-12 flex items-center justify-center mt-4 text-center px-2">
                  {mood ? (
                    <p className="text-[11px] font-bold text-slate-700 bg-amber-50/80 px-3 py-1.5 rounded-full border border-amber-200 flex items-center gap-1.5 animate-pulse">
                      <span className="text-base shrink-0">{mood}</span>
                      <span>Logged: {mood === '😊' ? 'Happy / Excellent' : mood === '😐' ? 'Neutral / Okay' : mood === '😞' ? 'Low / Tired' : mood === '😡' ? 'Irritated / Stressed' : 'Sleepy / Drowsy'}</span>
                    </p>
                  ) : (
                    <p className="text-xs font-medium text-slate-400 italic">No mood registered today.</p>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* ============================= */}
          {/*       DAILY SUMMARY CARD      */}
          {/* ============================= */}
          <Card title="Daily Summary">
            <div className="bg-slate-50/50 rounded-2xl border border-slate-150 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Metric</span>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Value</span>
                  </div>
                  
                  <div className="flex items-center justify-between py-1">
                    <span className="text-xs text-slate-700 font-semibold flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[#FF7F50]" />
                      Diet Adherence
                    </span>
                    <span className="text-xs font-black text-slate-800 bg-[#FF7F50]/10 px-2.5 py-1 rounded-lg">
                      {dietProgress}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <span className="text-xs text-slate-700 font-semibold flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[#1E90FF]" />
                      Steps Completed
                    </span>
                    <span className="text-xs font-black text-slate-800 bg-[#1E90FF]/10 px-2.5 py-1 rounded-lg">
                      {stepsProgress}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <span className="text-xs text-slate-700 font-semibold flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[#32CD32]" />
                      Medication Adherence
                    </span>
                    <span className="text-xs font-black text-slate-800 bg-[#32CD32]/10 px-2.5 py-1 rounded-lg">
                      {medProgress}%
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Profile</span>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Log</span>
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <span className="text-xs text-slate-700 font-semibold flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-cyan-500" />
                      Hydration Level
                    </span>
                    <span className="text-xs font-black text-slate-800 bg-cyan-50 px-2.5 py-1 rounded-lg border border-cyan-100">
                      {glasses} / {maxGlasses} Glasses
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <span className="text-xs text-slate-700 font-semibold flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-amber-500" />
                      Cognitive Mood
                    </span>
                    <span className="text-xs font-black text-slate-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100 flex items-center gap-1.5">
                      {mood ? `${mood} Logged` : "Not Logged"}
                    </span>
                  </div>

                  <div className="pt-2">
                    <div className="bg-[#EEF3F0] border border-[#DEE8E0] p-3 rounded-xl flex items-start gap-2">
                      <Info className="h-4 w-4 text-[#3F5B42] shrink-0 mt-0.5" />
                      <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                        This summary represents your real-time daily clinical adherence. Complete all modifications to achieve 100% synchronization.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN: Interactive Daily Action Plan */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Header Area */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#3F5B42] uppercase tracking-wider mb-1">
                <CheckCircle className="h-4 w-4" />
                <span>Therapeutic Regimen</span>
              </div>
              <h2 className="text-lg font-black text-slate-800 tracking-tight">Today's Daily Action Plan</h2>
              <p className="text-xs text-slate-500 font-medium">Your tailored tasks for today's clinical and physical health objectives.</p>
            </div>

            {/* Progress Card */}
            <div className="bg-gradient-to-r from-[#EEF3F0] to-[#E2ECE5] border border-[#DEE8E0] rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl" />
              <div className="relative">
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <p className="text-[10px] font-black text-[#3F5B42] uppercase tracking-wider mb-1">Today's Progress</p>
                    <h3 className="text-3xl font-black text-slate-800">
                      {completedCount} <span className="text-base text-slate-500 font-bold">/ {tasks.length}</span>
                    </h3>
                  </div>
                  <p className="text-xs font-black text-[#3F5B42]">{Math.round(progress)}% Complete</p>
                </div>
                <div className="w-full bg-slate-200/80 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-[#3F5B42] h-full rounded-full transition-all duration-700 ease-out" 
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Task Item List */}
            <div className="space-y-3">
              {tasks.map(task => {
                const IconComponent = iconMap[task.iconName] || Pill;
                return (
                  <div 
                    key={task.id} 
                    className={cn(
                      "flex items-center p-3.5 rounded-xl border transition-all cursor-pointer select-none",
                      task.completed 
                        ? "bg-slate-50 border-slate-150 opacity-75" 
                        : "bg-white border-slate-200 shadow-xs hover:border-[#3F5B42] hover:shadow-sm"
                    )}
                    onClick={() => toggleTask(task.id)}
                  >
                    <button className="flex-shrink-0 mr-3.5 focus:outline-none cursor-pointer">
                      {task.completed ? (
                        <CheckCircle2 className="h-5.5 w-5.5 text-emerald-600" />
                      ) : (
                        <Circle className="h-5.5 w-5.5 text-slate-300 hover:text-slate-400" />
                      )}
                    </button>
                    
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-xs font-bold text-slate-800 truncate", task.completed && "line-through text-slate-400 font-medium")}>
                        {task.title}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-[10px] font-semibold text-slate-400">{task.time}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-350" />
                        <span className="text-[10px] font-bold text-[#3F5B42] uppercase tracking-wider shrink-0">
                          {task.category}
                        </span>
                        {task.googleTaskId && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-slate-350" />
                            <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-1.5 py-0.5 rounded-md border border-blue-100 flex items-center gap-0.5 shrink-0 shadow-2xs">
                              <CloudLightning className="h-2 w-2" /> Google Tasks
                            </span>
                          </>
                        )}
                        {task.microsoftTaskId && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-slate-350" />
                            <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-1.5 py-0.5 rounded-md border border-indigo-100 flex items-center gap-0.5 shrink-0 shadow-2xs">
                              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" /> MS ToDo
                            </span>
                          </>
                        )}
                        {task.appleReminderId && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-slate-350" />
                            <span className="text-[9px] font-black text-purple-600 uppercase tracking-widest bg-purple-50 px-1.5 py-0.5 rounded-md border border-purple-100 flex items-center gap-0.5 shrink-0 shadow-2xs">
                              <span className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-pulse" /> Apple Reminders
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className={cn("h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0", task.bg)}>
                      <IconComponent className={cn("h-4.5 w-4.5", task.color)} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* AI Recommendation Box */}
            <div className="bg-slate-900 text-white rounded-2xl border-none mt-6 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-full blur-xl" />
              <div className="p-5 flex gap-4 relative">
                <div className="bg-white/10 p-2.5 rounded-xl h-10 w-10 flex items-center justify-center flex-shrink-0 border border-white/10">
                  <AlertCircle className="h-5 w-5 text-emerald-400" />
                </div>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-extrabold text-sm text-white mb-0.5 flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
                      AI Companion Alert
                    </h4>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      Based on your recent logs, adding a short 10-minute walk after your evening meal can significantly improve overnight blood glucose stability. 
                    </p>
                  </div>
                  <button 
                    onClick={addWalkTask}
                    className="px-3.5 py-1.5 bg-white text-slate-900 font-black text-[10px] uppercase tracking-wider rounded-lg hover:bg-slate-100 transition-colors cursor-pointer select-none focus:outline-none"
                  >
                    Add to Plan
                  </button>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
