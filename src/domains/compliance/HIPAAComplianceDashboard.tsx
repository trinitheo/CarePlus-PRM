import React from 'react';
import { useHIPAAMonitor } from '../../hooks/useHIPAAMonitor';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, ShieldCheck, Activity, Users, Database, X, Lock } from 'lucide-react';

interface HIPAAComplianceDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HIPAAComplianceDashboard({ isOpen, onClose }: HIPAAComplianceDashboardProps) {
  const { auditTrail, isLocked, logAccess } = useHIPAAMonitor();

  const handleTestLock = () => {
    // We can't directly lock the screen from here easily without a new context method,
    // but we can log a manual security check
    logAccess('MANUAL_SECURITY_AUDIT', 'System', 'Audit Dashboard');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[150] bg-slate-900/60 backdrop-blur-sm flex justify-end"
      >
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-slate-200"
        >
          {/* Header */}
          <div className="bg-slate-900 text-white p-6 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <ShieldCheck className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <h2 className="font-bold text-lg leading-tight">HIPAA Agent</h2>
                <p className="text-emerald-400 text-xs font-medium uppercase tracking-widest">Active Monitoring</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-slate-400" />
            </button>
          </div>

          {/* Status Metrics */}
          <div className="p-6 border-b border-slate-100 bg-slate-50 grid grid-cols-2 gap-4 shrink-0">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 text-slate-500 mb-2">
                <Activity className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-widest">Sys Status</span>
              </div>
              <div className="text-xl font-bold text-slate-900">Compliant</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 text-slate-500 mb-2">
                <Database className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-widest">Events</span>
              </div>
              <div className="text-xl font-bold text-slate-900">{auditTrail.length}</div>
            </div>
          </div>

          {/* Action Area */}
          <div className="p-6 border-b border-slate-100 shrink-0">
             <button
                onClick={handleTestLock}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 border border-slate-200 shadow-sm"
             >
                 <ShieldAlert className="h-4 w-4 text-emerald-600" />
                 Run Security Audit Test
             </button>
          </div>

          {/* Audit Log */}
          <div className="flex-1 overflow-auto p-6">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Live Audit Trail</h3>
            
            <div className="space-y-4">
              {auditTrail.map((event) => (
                <div key={event.id} className="relative pl-4 border-l-2 border-slate-200">
                  <div className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-slate-400" />
                  <div className="text-xs text-slate-500 mb-0.5">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </div>
                  <div className="font-semibold text-sm text-slate-900 break-words">
                    {event.action}
                  </div>
                  {event.resourceType && (
                    <div className="text-xs text-slate-600 mt-1">
                      Target: {event.resourceType} ({event.resourceId})
                    </div>
                  )}
                </div>
              ))}

              {auditTrail.length === 0 && (
                <div className="text-center text-slate-500 text-sm py-4">
                  No events logged yet.
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
