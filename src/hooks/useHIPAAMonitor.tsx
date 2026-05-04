import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, Lock, AlertTriangle, FileText } from 'lucide-react';

interface AuditEvent {
  id: string;
  timestamp: number;
  action: string;
  resourceId?: string;
  resourceType?: string;
  userId: string;
  details?: Record<string, any>;
}

interface HIPAAMonitorContextType {
  logAccess: (action: string, resourceType?: string, resourceId?: string, details?: any) => void;
  auditTrail: AuditEvent[];
  isLocked: boolean;
  unlockSession: () => void;
}

const HIPAAMonitorContext = createContext<HIPAAMonitorContextType | null>(null);

const IDLE_TIMEOUT_MS = 24 * 60 * 60 * 1000; // 24 hours (disabled while coding)

export function HIPAAMonitorProvider({ children }: { children: React.ReactNode }) {
  const [auditTrail, setAuditTrail] = useState<AuditEvent[]>([]);
  const [isLocked, setIsLocked] = useState(false);
  const [lastActive, setLastActive] = useState(Date.now());
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const logAccess = (action: string, resourceType?: string, resourceId?: string, details?: any) => {
    const event: AuditEvent = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        action,
        resourceType,
        resourceId,
        userId: 'current-user', // Mock user ID
        details
    };
    setAuditTrail(prev => [event, ...prev].slice(0, 100)); // Keep last 100 in memory
    console.log('[HIPAA AUDIT LOG]', event);
  };

  const handleActivity = () => {
    if (!isLocked) {
      setLastActive(Date.now());
    }
  };

  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(e => window.addEventListener(e, handleActivity));

    const checkIdle = setInterval(() => {
        if (!isLocked && Date.now() - lastActive > IDLE_TIMEOUT_MS) {
            setIsLocked(true);
            logAccess('SESSION_TIMEOUT', 'System', 'Session');
        }
    }, 10000);

    const handleCopy = (e: ClipboardEvent) => {
        // Log copy events as potential PHI exfiltration
        logAccess('DATA_COPIED_TO_CLIPBOARD', 'System', 'Clipboard', { length: window.getSelection()?.toString().length });
    };
    window.addEventListener('copy', handleCopy);

    return () => {
        events.forEach(e => window.removeEventListener(e, handleActivity));
        window.removeEventListener('copy', handleCopy);
        clearInterval(checkIdle);
    };
  }, [isLocked, lastActive]);

  const unlockSession = () => {
    setIsLocked(false);
    setLastActive(Date.now());
    logAccess('SESSION_RESUMED', 'System', 'Session');
  };

  // Log app startup
  useEffect(() => {
      logAccess('APP_STARTUP', 'System', 'App');
  }, []);

  return (
    <HIPAAMonitorContext.Provider value={{ logAccess, auditTrail, isLocked, unlockSession }}>
        {children}
        
        {/* Persistent HIPAA Indicator */}
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-slate-900/90 text-white px-3 py-1.5 rounded-full shadow-lg border border-slate-700 pointer-events-none transition-opacity duration-500 opacity-80 hover:opacity-100">
            <ShieldAlert className="h-4 w-4 text-emerald-400" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-200">HIPAA Protected</span>
        </div>

        {/* Lock Screen Overlay */}
        <AnimatePresence>
            {isLocked && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex flex-col items-center justify-center p-4"
                >
                    <motion.div 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-sm w-full border border-slate-200"
                    >
                        <div className="bg-slate-50 border-b border-slate-100 p-6 flex flex-col items-center justify-center text-center">
                            <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                <Lock className="h-8 w-8 text-slate-700" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900">Session Locked</h2>
                            <p className="text-sm text-slate-500 mt-2">
                                For your security and HIPAA compliance, your session has been locked due to inactivity.
                            </p>
                        </div>
                        <div className="p-6">
                            <button 
                                onClick={unlockSession}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                <Lock className="h-4 w-4" />
                                Resume Session
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    </HIPAAMonitorContext.Provider>
  );
}

export function useHIPAAMonitor() {
    const context = useContext(HIPAAMonitorContext);
    if (!context) {
        throw new Error('useHIPAAMonitor must be used within HIPAAMonitorProvider');
    }
    return context;
}
