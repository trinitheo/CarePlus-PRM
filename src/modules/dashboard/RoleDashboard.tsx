import React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { useQueryModel } from '../../store/eventStore';
import { useDashboard } from '../../hooks/useDashboard';
import { ScrollArea } from '../../components/ui/scroll-area';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';
import {
  PhoneCall, MessageSquare, ClipboardList, Pill, FlaskConical,
  Calendar, ChevronRight, Check, X, Thermometer, Heart, Activity,
  Users, Building2, Shield, CreditCard, TrendingUp, AlertTriangle,
  Zap, Phone, ArrowRight, Clock, User, MoreHorizontal, Bell, Plus,
  GripVertical, Settings2, Save, Eye, EyeOff, Maximize2, Minimize2,
  Wind, Droplets, Scale, Smartphone, Apple, Share2, Link2, ShieldCheck, History,
  RefreshCcw
} from 'lucide-react';
import { 
  completeCourtesyCall, 
  markMessageRead, 
  createReminder, 
  completeReminder,
  updateUserDashboardSettings,
  subscribeToCollection 
} from '../../services/clinicalFirestoreService';
import { DEFAULT_DASHBOARD_SETTINGS } from '../../constants';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { useWindowSizeClass } from '../../hooks/useAdaptiveWidth';
import { subscribeToAuditLogs } from '../../services/auditService';
import { VitalsCard } from '../clinical/VitalsCard';
import { HealthConnectManager } from '../clinical/HealthConnectManager';
import { ComposeMessageModal } from './ComposeMessageModal';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(ts: any): string {
  if (!ts) return '';
  const ms = ts?.seconds ? ts.seconds * 1000 : Number(ts);
  const diff = (Date.now() - ms) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function urgencyPill(p: string) {
  if (p === 'urgent' || p === 'immediate') return 'bg-red-50 text-red-700 border border-red-200';
  if (p === 'soon') return 'bg-amber-50 text-amber-700 border border-amber-200';
  return 'bg-slate-100 text-slate-600 border border-slate-200';
}

// ─── M3-style Section Header ─────────────────────────────────────────────────
function SectionHeader({ icon: Icon, label, count, color, action }: {
  icon: React.ElementType; label: string; count?: number; color: string; action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2.5 px-4 pt-4 pb-2">
      <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <span className="text-[11px] font-black uppercase tracking-[0.1em] text-[#444441] flex-1">{label}</span>
      {action ? (
        <div className="shrink-0">{action}</div>
      ) : count !== undefined && count > 0 && (
        <span className="h-5 min-w-5 px-1.5 rounded-full bg-[#0078D4] text-white text-[9px] font-black flex items-center justify-center">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function Empty({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center py-8 px-4">
      <p className="text-[11px] text-[#A19F9D] font-medium text-center">{message}</p>
    </div>
  );
}

// ─── M3 List Item — base ─────────────────────────────────────────────────────
function ListItem({ leading, headline, supporting, trailing, onClick, urgent }: {
  leading?: React.ReactNode; headline: string; supporting?: React.ReactNode;
  trailing?: React.ReactNode; onClick?: () => void; urgent?: boolean;
  [k: string]: unknown;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-[#F5F4F3] transition-colors group ${urgent ? 'bg-red-50/50' : ''}`}
    >
      {leading && <div className="shrink-0">{leading}</div>}
      <div className="flex-1 min-w-0">
        <p className={`text-[12.5px] font-semibold truncate ${urgent ? 'text-red-800' : 'text-[#242424]'}`}>{headline}</p>
        {supporting && <p className="text-[11px] text-[#757370] mt-0.5 truncate">{supporting}</p>}
      </div>
      {trailing && <div className="shrink-0">{trailing}</div>}
    </button>
  );
}

// ─── M3 Card shell ───────────────────────────────────────────────────────────
function DashCard({ children, className = '', isEditing, onToggleVisibility, onToggleSize, visible = true, size = '1x1' }: { 
  children: React.ReactNode; 
  className?: string;
  isEditing?: boolean;
  onToggleVisibility?: () => void;
  onToggleSize?: () => void;
  visible?: boolean;
  size?: '1x1' | '1x2' | '2x1' | '2x2' | '2x3' | '4x2' | '0.5x0.5';
}) {
  return (
    <div className={`
      relative bg-white rounded-3xl border transition-all h-full
      ${visible ? 'border-[#EDEBE9]' : 'border-[#EDEBE9] opacity-40'} 
      overflow-hidden flex flex-col shadow-sm ${className}
      ${isEditing ? 'ring-2 ring-offset-2 ring-[#0078D4]/20' : ''}
    `}>
      {isEditing && (
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={(e) => { e.stopPropagation(); onToggleSize?.(); }}
            className="h-8 w-auto px-2 rounded-full bg-white/80 backdrop-blur hover:bg-white text-[10px] font-black text-[#0078D4]"
          >
            {size}
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={(e) => { e.stopPropagation(); onToggleVisibility?.(); }}
            className="h-8 w-8 p-0 rounded-full bg-white/80 backdrop-blur hover:bg-white"
          >
            {visible ? <Eye className="h-4 w-4 text-[#0078D4]" /> : <EyeOff className="h-4 w-4 text-[#A19F9D]" />}
          </Button>
        </div>
      )}
      {children}
    </div>
  );
}

// ─── Sortable Wrapper ────────────────────────────────────────────────────────
function SortableWidget({ id, children, isEditing, onToggleVisibility, onToggleSize, visible, size }: { 
  id: string; 
  children: React.ReactNode;
  isEditing: boolean;
  onToggleVisibility: () => void;
  onToggleSize: () => void;
  visible: boolean;
  size: '1x1' | '1x2' | '2x1' | '2x2' | '2x3' | '4x2' | '0.5x0.5';
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : 0,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={`h-full ${isDragging ? 'rotate-1 scale-[1.02]' : ''}`}>
      {isEditing ? (
        <div className="h-full relative group">
          <DashCard 
            isEditing={isEditing} 
            onToggleVisibility={onToggleVisibility} 
            onToggleSize={onToggleSize}
            visible={visible}
            size={size}
          >
            <div 
              {...attributes} 
              {...listeners} 
              className="absolute left-1/2 -top-1 -translate-x-1/2 h-6 w-12 bg-[#F5F4F3] rounded-b-xl flex items-center justify-center cursor-grab active:cursor-grabbing hover:bg-[#EDEBE9] transition-colors z-20"
            >
              <GripVertical className="h-3 w-3 text-[#A19F9D]" />
            </div>
            <div className="h-full pointer-events-none select-none">
              {children}
            </div>
          </DashCard>
        </div>
      ) : (
        <div className="h-full">
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Avatar chip ─────────────────────────────────────────────────────────────
function Avatar({ name, color = '#0078D4', size = 'sm' }: { name: string; color?: string; size?: 'sm' | 'md' }) {
  const s = size === 'sm' ? 'h-8 w-8 text-[11px]' : 'h-10 w-10 text-[13px]';
  return (
    <div className={`${s} rounded-full flex items-center justify-center font-black text-white shrink-0`} style={{ background: color }}>
      {name?.[0]?.toUpperCase() || '?'}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// WIDGET 0 — Reminders (all roles)
// M3 pattern: Action list with completion and "due soon" indicators
// ═══════════════════════════════════════════════════════════════════════════════
function RemindersWidget({ reminders, onComplete, onCreate }: { 
  reminders: any[]; 
  onComplete: (id: string) => void;
  onCreate: (data: any) => Promise<void>;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newPriority, setNewPriority] = useState<'routine' | 'urgent' | 'immediate'>('routine');

  const handleCreate = async () => {
    if (!newTitle || !newDueDate) return;
    await onCreate({
      title: newTitle,
      description: newDesc,
      dueDate: new Date(newDueDate).toISOString(),
      priority: newPriority,
      status: 'pending'
    });
    setIsAdding(false);
    setNewTitle('');
    setNewDesc('');
    setNewDueDate('');
  };

  const isDueSoon = (dateStr: string) => {
    const due = new Date(dateStr);
    const now = new Date();
    const diff = due.getTime() - now.getTime();
    return diff > 0 && diff < 86400000; // < 24h
  };

  const isOverdue = (dateStr: string) => {
    const due = new Date(dateStr);
    const now = new Date();
    return due.getTime() < now.getTime();
  };

  return (
    <DashCard>
      <div className="flex items-center justify-between pr-4">
        <SectionHeader icon={Bell} label="Reminders" count={reminders.length} color="bg-amber-50 text-amber-600" />
        <Dialog open={isAdding} onOpenChange={setIsAdding}>
          <DialogTrigger asChild>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-full hover:bg-amber-50 text-amber-600">
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] rounded-[32px] border-none shadow-2xl p-6">
            <DialogHeader>
              <DialogTitle className="text-[20px] font-black text-[#1A1A1A] tracking-tight">Set New Reminder</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-[#757370] uppercase tracking-widest pl-1">What to remember?</label>
                <Input 
                  placeholder="e.g. Monthly Diabetic Check-in" 
                  value={newTitle} 
                  onChange={e => setNewTitle(e.target.value)}
                  className="rounded-2xl border-[#EDEBE9] bg-[#FAFAFA] focus-visible:ring-[#0078D4]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-[#757370] uppercase tracking-widest pl-1">Due Date & Time</label>
                <Input 
                  type="datetime-local" 
                  value={newDueDate}
                  onChange={e => setNewDueDate(e.target.value)}
                  className="rounded-2xl border-[#EDEBE9] bg-[#FAFAFA] focus-visible:ring-[#0078D4]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-[#757370] uppercase tracking-widest pl-1">Priority</label>
                <Select value={newPriority} onValueChange={(v: any) => setNewPriority(v)}>
                  <SelectTrigger className="rounded-2xl border-[#EDEBE9] bg-[#FAFAFA]">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-xl">
                    <SelectItem value="routine">Routine</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="immediate">Immediate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-[#757370] uppercase tracking-widest pl-1">Optional Notes</label>
                <Textarea 
                  placeholder="Additional context..." 
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  className="rounded-2xl border-[#EDEBE9] bg-[#FAFAFA] focus-visible:ring-[#0078D4] min-h-[80px]"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={handleCreate} className="flex-1 rounded-full bg-[#0078D4] hover:bg-[#005A9E] text-white font-black text-[13px] h-12 shadow-md">
                Create Reminder
              </Button>
              <Button variant="outline" onClick={() => setIsAdding(false)} className="rounded-full border-[#EDEBE9] text-[#444441] font-black text-[13px] h-12 px-6">
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <ScrollArea className="flex-1">
        <div className="divide-y divide-[#F5F4F3] pb-2">
          {reminders.length === 0 && <Empty message="No active reminders" />}
          {reminders.map(rem => {
            const overdue = isOverdue(rem.dueDate);
            const soon = isDueSoon(rem.dueDate);
            return (
              <div key={rem.id} className={`group relative transition-all ${overdue ? 'bg-red-50/30' : soon ? 'bg-amber-50/30' : ''}`}>
                <div className="px-4 py-3 flex gap-3 items-start">
                  <button 
                    onClick={() => onComplete(rem.id)}
                    className="mt-1 h-5 w-5 rounded-full border-2 border-[#EDEBE9] hover:border-[#107C10] hover:bg-[#DFF6DD] flex items-center justify-center transition-all group/check shrink-0">
                    <Check className="h-3 w-3 text-[#107C10] opacity-0 group-hover/check:opacity-100" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className={`text-[12px] font-bold ${overdue ? 'text-red-700' : 'text-[#242424]'} truncate`}>{rem.title}</p>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border shrink-0 ${overdue ? 'bg-red-100 text-red-700 border-red-200' : soon ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                        {overdue ? 'Overdue' : soon ? 'Soon' : 'Upcoming'}
                      </span>
                    </div>
                    {rem.description && <p className="text-[11px] text-[#757370] mt-0.5 line-clamp-1">{rem.description}</p>}
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-[#A19F9D]" />
                        <span className="text-[10px] text-[#A19F9D]">{new Date(rem.dueDate).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      {rem.patientName && (
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3 text-[#0078D4]" />
                          <span className="text-[10px] text-[#0078D4] font-semibold">{rem.patientName}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </DashCard>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// WIDGET 1 — Messages (all roles)
// M3 pattern: Recent Messages list with unread markers and redirect inline button
// ═══════════════════════════════════════════════════════════════════════════════
function MessagesWidget({ messages, onRead, onNavigate }: { 
  messages: any[]; 
  onRead: (id: string) => void;
  onNavigate?: (module: string) => void;
}) {
  const unreadCount = messages.filter(m => !m.read).length;

  const roleColors: Record<string, string> = {
    clinician: '#107C10', nurse: '#0078D4', allied_health: '#5C2D91',
    admin: '#D13438', billing: '#8764B8', patient: '#CA5010',
  };

  return (
    <DashCard>
      <div className="flex items-center justify-between pr-4 select-none shrink-0 border-b border-[#F3F2F1] pb-1">
        <SectionHeader icon={MessageSquare} label="Recent Messages" count={unreadCount} color="bg-[#DEECF9] text-[#0078D4]" />
        {onNavigate && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-[11px] font-black uppercase tracking-wider text-[#0078D4] hover:bg-[#DEECF9]/30 rounded-full shrink-0 flex items-center h-8"
            onClick={() => onNavigate('messages')}
          >
            Open Inbox <ChevronRight className="ml-1 h-3.5 w-3.5" />
          </Button>
        )}
      </div>
      
      <div className="flex flex-1 min-h-0">
        <ScrollArea className="flex-1 h-[236px]" viewportClassName="h-[256px]">
          <div className="divide-y divide-[#F5F4F3]">
            {messages.length === 0 && <Empty message="No messages yet" />}
            {messages.slice(0, 5).map(msg => (
              <button
                key={msg.id}
                onClick={async () => {
                  if (!msg.read) await onRead(msg.id);
                  onNavigate?.('messages');
                }}
                className="w-full text-left px-4 py-3.5 hover:bg-[#F5F4F3] transition-colors flex gap-3 items-start group"
              >
                <div className="relative shrink-0 mt-0.5">
                  <Avatar name={msg.fromUserName || '?'} color={roleColors[msg.fromRole] || '#616161'} size="sm" />
                  {!msg.read && (
                    <div className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[#0078D4] border-2 border-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className={`text-[12px] truncate ${!msg.read ? 'font-black text-[#242424]' : 'font-semibold text-[#616161]'}`}>
                      {msg.fromUserName || 'Unknown'} 
                      <span className="ml-1 px-1 py-0.2 rounded text-[7px] font-black uppercase tracking-wider bg-slate-100 text-slate-500">
                        {msg.fromRole?.replace('_', ' ')}
                      </span>
                    </p>
                    <span className="text-[9px] text-[#A19F9D] shrink-0 font-medium">{timeAgo(msg.createdAt)}</span>
                  </div>
                  <p className="text-[11px] text-[#444441] font-black truncate mt-1 group-hover:text-[#0078D4] transition-colors">{msg.subject}</p>
                  <p className="text-[10px] text-[#757370] truncate mt-0.5 font-medium">{msg.body}</p>
                  {msg.patientName && (
                    <p className="text-[9px] text-[#0078D4] font-black mt-1 inline-flex items-center gap-0.5 bg-blue-50 px-1.5 py-0.2 rounded-full">Re: {msg.patientName}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>
    </DashCard>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// WIDGET 2 — Courtesy Calls
// M3 pattern: Action list with inline task completion flow
// ═══════════════════════════════════════════════════════════════════════════════
function CourtesyCallsWidget({ tasks, onComplete }: { tasks: any[]; onComplete: (id: string, notes: string) => void }) {
  const [logging, setLogging] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  const submit = (id: string) => { onComplete(id, notes); setLogging(null); setNotes(''); };

  return (
    <DashCard>
      <SectionHeader icon={PhoneCall} label="Courtesy Calls" count={tasks.length} color="bg-[#DFF6DD] text-[#107C10]" />
      <ScrollArea className="flex-1">
        <div className="divide-y divide-[#F5F4F3] pb-2">
          {tasks.length === 0 && <Empty message="No pending courtesy calls" />}
          {tasks.map(task => (
            <div key={task.id} className="px-4 py-3">
              <div className="flex items-start gap-3">
                {/* Priority indicator — M3 tonal icon button */}
                <div className={`h-9 w-9 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 ${urgencyPill(task.priority).split(' ').slice(0,1).join(' ')} ${task.priority === 'urgent' ? 'bg-red-100' : task.priority === 'soon' ? 'bg-amber-100' : 'bg-slate-100'}`}>
                  <Phone className={`h-4 w-4 ${task.priority === 'urgent' ? 'text-red-600' : task.priority === 'soon' ? 'text-amber-600' : 'text-slate-500'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[12.5px] font-bold text-[#242424] truncate">{task.patientName}</p>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full shrink-0 ${urgencyPill(task.priority)}`}>
                      {task.priority}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#757370] mt-0.5 line-clamp-2">{task.reason}</p>
                  {task.dueDate && (
                    <div className="flex items-center gap-1 mt-1">
                      <Clock className="h-3 w-3 text-[#A19F9D]" />
                      <span className="text-[10px] text-[#A19F9D]">Due {task.dueDate}</span>
                    </div>
                  )}
                  {logging === task.id ? (
                    <div className="mt-2 space-y-2">
                      <Textarea
                        placeholder="Brief call notes..."
                        className="text-[12px] min-h-[64px] resize-none rounded-xl border-[#EDEBE9] bg-white"
                        value={notes}
                        autoFocus
                        onChange={e => setNotes(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => submit(task.id)}
                          className="h-8 flex-1 text-[11px] font-bold bg-[#107C10] hover:bg-[#0b5e0b] text-white rounded-xl gap-1.5">
                          <Check className="h-3.5 w-3.5" /> Log & Complete
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => { setLogging(null); setNotes(''); }}
                          className="h-8 w-8 p-0 rounded-xl border-[#EDEBE9]">
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => setLogging(task.id)}
                      className="mt-2 h-7 text-[10px] font-bold border-[#107C10]/30 text-[#107C10] hover:bg-[#DFF6DD] rounded-xl gap-1.5">
                      <Phone className="h-3 w-3" /> Log Call
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </DashCard>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// WIDGET 3 — Check-in Queue (Nurse)
// M3 pattern: Feed with status chips and vitals summary
// ═══════════════════════════════════════════════════════════════════════════════
function CheckInQueueWidget({ onNavigate }: { onNavigate?: (id: string) => void }) {
  const { patients, vitals } = useQueryModel();

  const queue = useMemo(() => {
    return Object.values(patients as Record<string, any>)
      .filter((p: any) => ['active', 'triage', 'pending'].includes(p.status || ''))
      .map((p: any) => {
        const pVitals = (vitals[p.id] || []);
        const last = pVitals[pVitals.length - 1];
        const hoursAgo = last ? (Date.now() - last.timestamp) / 3600000 : Infinity;
        const vitalsStale = hoursAgo > 4;
        const isTriage = p.status === 'triage';
        return { ...p, last, hoursAgo, vitalsStale, isTriage };
      })
      .sort((a, b) => (b.isTriage ? 2 : b.vitalsStale ? 1 : 0) - (a.isTriage ? 2 : a.vitalsStale ? 1 : 0));
  }, [patients, vitals]);

  const statusBadge = (p: any) => {
    if (p.isTriage) return <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">Triage</span>;
    if (p.vitalsStale) return <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">Vitals Due</span>;
    return <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">Current</span>;
  };

  return (
    <DashCard>
      <SectionHeader icon={ClipboardList} label="Check-in Queue" count={queue.length} color="bg-[#FFF4CE] text-[#845701]" />
      <ScrollArea className="flex-1">
        <div className="divide-y divide-[#F5F4F3] pb-2">
          {queue.length === 0 && <Empty message="Queue is clear" />}
          {queue.map(p => (
            <ListItem
              key={p.id}
              onClick={() => onNavigate?.(p.id)}
              urgent={p.isTriage}
              leading={
                <div className={`h-9 w-9 rounded-2xl flex items-center justify-center font-black text-[12px] ${p.isTriage ? 'bg-red-100 text-red-700' : 'bg-[#F3F2F1] text-[#444441]'}`}>
                  {p.name?.[0]}
                </div>
              }
              headline={p.name}
              supporting={
                p.last
                  ? `HR ${p.last.hr} · BP ${p.last.bp} · ${Math.round(p.hoursAgo)}h ago`
                  : 'No vitals on record'
              }
              trailing={
                <div className="flex flex-col items-end gap-1.5">
                  {statusBadge(p)}
                  <ChevronRight className="h-3.5 w-3.5 text-[#A19F9D] group-hover:text-[#0078D4] transition-colors" />
                </div>
              }
            />
          ))}
        </div>
      </ScrollArea>
    </DashCard>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// WIDGET 4 — Medication Flags (Nurse)
// M3 pattern: Cards with tonal containers for adherence status
// ═══════════════════════════════════════════════════════════════════════════════
function MedicationFlagsWidget({ onNavigate }: { onNavigate?: (id: string) => void }) {
  const { patients } = useQueryModel();
  const [flagged, setFlagged] = useState<any[]>([]);

  useEffect(() => {
    const unsubs: (() => void)[] = [];
    Object.keys(patients).forEach(pid => {
      const unsub = subscribeToCollection('prescriptions', (items) => {
        const meds = items
          .filter((m: any) => m.status === 'active' && m.adherenceStatus && m.adherenceStatus !== 'optimal')
          .map((m: any) => ({
            id: m.id,
            patientId: pid,
            patientName: (patients as any)[pid]?.name || 'Unknown',
            ...m
          }));
        setFlagged(prev => [...prev.filter(m => m.patientId !== pid), ...meds]);
      }, pid);
      unsubs.push(unsub);
    });
    return () => unsubs.forEach(u => u());
  }, [patients]);

  const adherenceBg: Record<string, string> = {
    poor: 'bg-red-50 border-red-200 text-red-800',
    partial: 'bg-amber-50 border-amber-200 text-amber-800',
    uncertain: 'bg-slate-50 border-slate-200 text-slate-700',
  };

  return (
    <DashCard>
      <SectionHeader icon={Pill} label="Medication Flags" count={flagged.length} color="bg-red-50 text-red-600" />
      <ScrollArea className="flex-1">
        <div className="px-3 py-2 space-y-2 pb-3">
          {flagged.length === 0 && <Empty message="All medications on track" />}
          {flagged.map(med => (
            <button
              key={med.id}
              onClick={() => onNavigate?.(med.patientId)}
              className={`w-full text-left p-3 rounded-2xl border transition-all hover:shadow-sm ${adherenceBg[med.adherenceStatus] || 'bg-slate-50 border-slate-200 text-slate-700'}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[12px] font-bold truncate">{med.patientName}</p>
                  <p className="text-[11px] opacity-80 mt-0.5 truncate">{med.medicationName}</p>
                  <p className="text-[11px] opacity-70 mt-0.5">{med.dosage} · {med.frequency}</p>
                </div>
                <span className="text-[9px] font-black uppercase shrink-0 mt-0.5 opacity-80 tracking-wide">
                  {med.adherenceStatus}
                </span>
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </DashCard>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// WIDGET 5 — Today's Appointments (Clinician + Allied + Nurse)
// M3 pattern: Cards with time chips and visit-type indicators
// ═══════════════════════════════════════════════════════════════════════════════
function TodayScheduleWidget({ onNavigate, patientId }: { onNavigate?: (id: string) => void, patientId?: string }) {
  const { appointments, patients } = useQueryModel();
  const today = new Date().toDateString();

  const parseTime = (timeVal: any) => {
    if (!timeVal) return new Date();
    if (timeVal.toDate) return timeVal.toDate();
    if (timeVal.seconds) return new Date(timeVal.seconds * 1000);
    return new Date(timeVal);
  };

  const todayAppts = useMemo(() =>
    Object.values(appointments as any)
      .filter((a: any) => {
        const ad = parseTime(a.time);
        const isToday = ad.toDateString() === today;
        const matchesPatient = patientId ? a.patientId === patientId : true;
        return isToday && matchesPatient;
      })
      .map((a: any) => ({ ...a, patientName: (patients as any)[a.patientId]?.name || `Patient #${a.patientId?.slice(0, 8).toUpperCase()}` }))
      .sort((a: any, b: any) => parseTime(a.time).getTime() - parseTime(b.time).getTime()),
    [appointments, patients, today, patientId]
  );

  const now = new Date();
  const statusOf = (appt: any) => {
    const t = parseTime(appt.time);
    if (appt.status === 'completed') return 'done';
    if (appt.status === 'in_progress') return 'active';
    if (appt.status === 'checked_in') return 'ready';
    if (appt.status === 'cancelled') return 'cancelled';
    const diff = (t.getTime() - now.getTime()) / 60000;
    if (diff < 0) return 'overdue';
    if (diff < 15) return 'imminent';
    return 'upcoming';
  };

  const statusStyle: Record<string, string> = {
    done: 'bg-[#DFF6DD] text-[#107C10] border-[#107C10]/10',
    active: 'bg-[#0078D4] text-white border-[#0078D4]',
    ready: 'bg-[#DFF6DD] text-[#107C10] border-[#107C10]/20 shadow-glow-green',
    cancelled: 'bg-slate-100 text-slate-500 border-slate-200',
    overdue: 'bg-red-50 text-[#D13438] border-red-200',
    imminent: 'bg-amber-50 text-[#794500] border-amber-200',
    upcoming: 'bg-slate-50 text-slate-600 border-slate-200',
  };

  return (
    <DashCard>
      <SectionHeader icon={Calendar} label="Today's Schedule" count={todayAppts.length} color="bg-[#DEECF9] text-[#0078D4]" />
      <ScrollArea className="flex-1">
        <div className="px-3 py-2 space-y-2 pb-3">
          {todayAppts.length === 0 && <Empty message="No appointments today" />}
          {todayAppts.map((appt: any) => {
            const st = statusOf(appt);
            return (
              <button
                key={appt.id}
                onClick={() => onNavigate?.(appt.patientId)}
                className="w-full text-left p-3 rounded-2xl border border-[#EDEBE9] bg-white hover:bg-[#F5F4F3] transition-all flex gap-3 items-center group"
              >
                {/* Time block */}
                <div className="shrink-0 text-center min-w-[44px]">
                  <p className="text-[14px] font-black text-[#242424] leading-none">
                    {parseTime(appt.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="text-[9px] text-[#A19F9D] font-medium mt-0.5">
                    {appt.visitType === 'virtual' ? '📱 Virtual' : '🏥 Clinic'}
                  </p>
                </div>
                <div className="w-px h-8 bg-[#EDEBE9] shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[12.5px] font-bold text-[#242424] truncate">{appt.patientName}</p>
                  <p className="text-[11px] text-[#757370] mt-0.5 truncate">{appt.reason}</p>
                </div>
                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border shrink-0 ${statusStyle[st]}`}>
                  {st === 'active' ? 'Now' : st === 'imminent' ? 'Soon' : st}
                </span>
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </DashCard>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// WIDGET 6 — Pending Results (Clinician)
// M3 pattern: Feed with priority tonal containers
// ═══════════════════════════════════════════════════════════════════════════════
function PendingResultsWidget({ onNavigate }: { onNavigate?: (id: string) => void }) {
  const { patients } = useQueryModel();
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    const unsubs: (() => void)[] = [];
    Object.keys(patients).forEach(pid => {
      const unsub = subscribeToCollection('investigations', (items) => {
        const activeResults = items
          .filter((r: any) => ['ordered', 'sample_collected'].includes(r.status))
          .map((r: any) => ({
            id: r.id,
            patientId: pid,
            patientName: (patients as any)[pid]?.name || 'Unknown',
            ...r
          }));
        setResults(prev => {
          const filtered = prev.filter(r => r.patientId !== pid);
          const combined = [...filtered, ...activeResults];
          combined.sort((a, b) => {
            const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return timeB - timeA;
          });
          return combined.slice(0, 10);
        });
      }, pid);
      unsubs.push(unsub);
    });
    return () => unsubs.forEach(u => u());
  }, [patients]);

  const categoryIcon: Record<string, string> = { laboratory: '🧪', imaging: '🩻', functional: '📈' };

  return (
    <DashCard>
      <SectionHeader icon={FlaskConical} label="Pending Results" count={results.length} color="bg-purple-50 text-purple-700" />
      <ScrollArea className="flex-1">
        <div className="divide-y divide-[#F5F4F3] pb-2">
          {results.length === 0 && <Empty message="No pending results" />}
          {results.map(r => (
            <button 
              key={r.id} 
              onClick={() => onNavigate?.(r.patientId)}
              className="w-full text-left px-4 py-3 flex gap-3 items-start hover:bg-[#F5F4F3] transition-colors group"
            >
              <div className={`h-9 w-9 rounded-2xl flex items-center justify-center text-[16px] shrink-0 ${r.priority === 'urgent' ? 'bg-red-50' : 'bg-purple-50'}`}>
                {categoryIcon[r.category] || '🔬'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <p className="text-[12.5px] font-bold text-[#242424] group-hover:text-[#0078D4] transition-colors truncate">{r.patientName}</p>
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border shrink-0 ${urgencyPill(r.priority)}`}>
                    {r.priority}
                  </span>
                </div>
                <p className="text-[11px] text-[#757370] mt-0.5 truncate capitalize">
                  {r.category} · {r.tests?.map((t: any) => t.testName).join(', ')}
                </p>
                <p className="text-[10px] text-[#A19F9D] mt-0.5 capitalize">{r.status?.replace('_', ' ')}</p>
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </DashCard>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// WIDGET 7 — My Patients (Clinician / Allied)
// M3 pattern: List with condition chips
// ═══════════════════════════════════════════════════════════════════════════════
function MyPatientsWidget({ userId, onNavigate }: { userId: string; onNavigate?: (id: string) => void }) {
  const { patients } = useQueryModel();
  const [assigned, setAssigned] = useState<Set<string>>(new Set());

  useEffect(() => {
    const unsubs: (() => void)[] = [];
    Object.keys(patients).forEach(pid => {
      const unsub = subscribeToCollection('care_teams', (items) => {
        const isAssigned = items.some((ct: any) => ct.userId === userId && ct.status === 'active');
        if (isAssigned) {
          setAssigned(prev => new Set([...prev, pid]));
        } else {
          setAssigned(prev => {
            const n = new Set(prev);
            n.delete(pid);
            return n;
          });
        }
      }, pid);
      unsubs.push(unsub);
    });
    return () => unsubs.forEach(u => u());
  }, [userId, patients]);

  const myPatients = Object.values(patients as Record<string, any>).filter(p => assigned.has(p.id));

  return (
    <DashCard>
      <SectionHeader icon={Users} label="My Patients" count={myPatients.length} color="bg-[#DFF6DD] text-[#107C10]" />
      <ScrollArea className="flex-1">
        <div className="divide-y divide-[#F5F4F3] pb-2">
          {myPatients.length === 0 && <Empty message="No patients assigned yet" />}
          {myPatients.map(p => (
            <ListItem
              key={p.id}
              onClick={() => onNavigate?.(p.id)}
              leading={<Avatar name={p.name} color="#107C10" />}
              headline={p.name}
              supporting={p.conditions?.slice(0, 2).join(' · ') || 'No conditions recorded'}
              trailing={<ChevronRight className="h-4 w-4 text-[#A19F9D] group-hover:text-[#107C10] transition-colors" />}
            />
          ))}
        </div>
      </ScrollArea>
    </DashCard>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// WIDGET 8 — Allied Health Referrals
// ═══════════════════════════════════════════════════════════════════════════════
function ReferralsWidget({ specialty, onNavigate }: { specialty?: string; onNavigate?: (id: string) => void }) {
  const { patients } = useQueryModel();
  const [refs, setRefs] = useState<any[]>([]);

  useEffect(() => {
    const unsubs: (() => void)[] = [];
    Object.keys(patients).forEach(pid => {
      const unsub = subscribeToCollection('referrals', (items) => {
        const processed = items
          .map((r: any) => ({ id: r.id, patientId: pid, patientName: (patients as any)[pid]?.name || 'Unknown', ...r }))
          .filter((r: any) => !specialty || r.specialty?.toLowerCase().includes(specialty.toLowerCase()));
        setRefs(prev => {
          const filtered = prev.filter(r => r.patientId !== pid);
          const combined = [...filtered, ...processed];
          combined.sort((a, b) => {
            const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return timeB - timeA;
          });
          return combined;
        });
      }, pid);
      unsubs.push(unsub);
    });
    return () => unsubs.forEach(u => u());
  }, [specialty, patients]);

  return (
    <DashCard>
      <SectionHeader icon={ArrowRight} label="Incoming Referrals" count={refs.length} color="bg-purple-50 text-purple-700" />
      <ScrollArea className="flex-1">
        <div className="divide-y divide-[#F5F4F3] pb-2">
          {refs.length === 0 && <Empty message="No referrals for your specialty" />}
          {refs.map(r => (
            <ListItem
              key={r.id}
              onClick={() => onNavigate?.(r.patientId)}
              leading={<Avatar name={r.patientName || '?'} color="#5C2D91" />}
              headline={r.patientName || 'Unknown'}
              supporting={r.reason || r.specialty || 'Referral'}
              trailing={
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  {r.status || 'Pending'}
                </span>
              }
            />
          ))}
        </div>
      </ScrollArea>
    </DashCard>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// WIDGET 9 — Admin: System Overview
// M3 pattern: Summary cards (stat tiles)
// ═══════════════════════════════════════════════════════════════════════════════
function SystemOverviewWidget() {
  const { patients } = useQueryModel();
  const [staffCount, setStaffCount] = useState(0);

  useEffect(() => {
    return subscribeToCollection('users', (usersList) => {
      setStaffCount(usersList.length);
    });
  }, []);

  const pts = Object.values(patients as any);
  const stats = [
    { label: 'Total Patients', value: pts.length, icon: Users, color: 'bg-[#DEECF9] text-[#0078D4]', textColor: 'text-[#0078D4]' },
    { label: 'Active', value: pts.filter((p: any) => p.status === 'active').length, icon: Activity, color: 'bg-[#DFF6DD] text-[#107C10]', textColor: 'text-[#107C10]' },
    { label: 'Triage', value: pts.filter((p: any) => p.status === 'triage').length, icon: AlertTriangle, color: 'bg-red-50 text-red-600', textColor: 'text-red-700' },
    { label: 'Staff', value: staffCount, icon: User, color: 'bg-amber-50 text-amber-600', textColor: 'text-amber-700' },
  ];

  return (
    <DashCard>
      <SectionHeader icon={Building2} label="System Overview" color="bg-slate-100 text-slate-600" />
      <div className="p-4 grid grid-cols-2 gap-3">
        {stats.map(s => (
          <div key={s.label} className="rounded-2xl bg-[#FAFAFA] border border-[#EDEBE9] p-4 flex flex-col gap-2">
            <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${s.color}`}>
              <s.icon className="h-4 w-4" />
            </div>
            <p className={`text-[28px] font-black leading-none ${s.textColor}`}>{s.value}</p>
            <p className="text-[11px] text-[#A19F9D] font-semibold">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="px-4 pb-4 flex items-center gap-2 p-3 rounded-2xl bg-green-50 border border-green-200 mx-4 mb-4">
        <Shield className="h-4 w-4 text-green-700 shrink-0" />
        <div>
          <p className="text-[11px] font-bold text-green-800">HIPAA Compliant</p>
          <p className="text-[10px] text-green-700">All access logs current</p>
        </div>
        <Zap className="h-3.5 w-3.5 text-green-600 ml-auto" />
      </div>
    </DashCard>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// WIDGET 10 — Admin: Staff Directory
// ═══════════════════════════════════════════════════════════════════════════════
function StaffDirectoryWidget() {
  const [users, setUsers] = useState<any[]>([]);
  useEffect(() => {
    return subscribeToCollection('users', (usersList) => {
      setUsers(usersList.slice(0, 30));
    });
  }, []);

  const roleColor: Record<string, string> = {
    clinician: '#107C10', nurse: '#0078D4', allied_health: '#5C2D91',
    admin: '#D13438', billing: '#8764B8', patient: '#CA5010',
  };

  return (
    <DashCard>
      <SectionHeader icon={Users} label="Active Staff" count={users.length} color="bg-[#DEECF9] text-[#0078D4]" />
      <ScrollArea className="flex-1">
        <div className="divide-y divide-[#F5F4F3] pb-2">
          {users.length === 0 && <Empty message="No staff profiles found" />}
          {users.map(u => (
            <ListItem
              key={u.id}
              leading={<Avatar name={u.displayName || '?'} color={roleColor[u.role] || '#616161'} />}
              headline={u.displayName || u.email}
              supporting={u.specialty || u.email || u.role}
              trailing={
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full border shrink-0"
                  style={{ background: `${roleColor[u.role] || '#616161'}15`, color: roleColor[u.role] || '#616161', borderColor: `${roleColor[u.role] || '#616161'}30` }}>
                  {u.role?.replace('_', ' ')}
                </span>
              }
            />
          ))}
        </div>
      </ScrollArea>
    </DashCard>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// WIDGET 11 — Patient: My Vitals
// M3 pattern: Tonal stat tiles
// ═══════════════════════════════════════════════════════════════════════════════
function MyVitalsWidget({ onNavigate }: { onNavigate?: (id: string) => void }) {
  const { userProfile } = useCurrentUser();
  const { vitals } = useQueryModel();
  const myVitalsList = vitals[userProfile?.id || ''] || [];
  const latest = myVitalsList[myVitalsList.length - 1];

  const metrics = useMemo(() => {
    if (!latest) return [];
    return [
      { label: 'Heart Rate', value: latest.hr, unit: 'bpm', icon: Heart, color: '#D13438', ok: latest.hr < 100 && latest.hr > 60 },
      { label: 'Blood Pressure', value: latest.bp, unit: 'mmHg', icon: Activity, color: '#0078D4', ok: true },
      { label: 'Resp Rate', value: latest.rr || '--', unit: 'bpm', icon: Wind, color: '#107C10', ok: true },
      { label: 'SpO2', value: latest.spo2 || '--', unit: '%', icon: Droplets, color: '#0078D4', ok: !latest.spo2 || latest.spo2 >= 95 },
      { label: 'Temp', value: latest.temp ? Number(latest.temp).toFixed(1) : '--', unit: '°C', icon: Thermometer, color: '#845701', ok: latest.temp < 37.5 && latest.temp > 36.5 },
      { label: 'Weight', value: latest.weight || '--', unit: 'kg', icon: Scale, color: '#616161', ok: true },
    ];
  }, [latest]);

  if (!userProfile?.id) return <Empty message="No active session" />;

  return (
    <DashCard>
      <SectionHeader 
        icon={Heart} 
        label="My Vitals" 
        color="bg-red-50 text-red-600" 
        action={
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 px-2 text-[9px] font-black uppercase text-[#0078D4] hover:bg-[#DEECF9]"
            onClick={() => userProfile?.id && onNavigate?.(userProfile.id)}
          >
            Full Record
          </Button>
        }
      />
      <ScrollArea className="flex-1">
        {!latest ? (
          <Empty message="No vitals recorded yet" />
        ) : (
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {metrics.map(m => (
                <div 
                  key={m.label} 
                  className={`rounded-2xl p-3.5 flex flex-col gap-1 border transition-all hover:shadow-md ${m.ok ? 'bg-[#FAFAFA] border-[#EDEBE9]' : 'bg-red-50 border-red-200'}`}
                >
                  <div className="flex items-center gap-2">
                    <m.icon className={`h-3 w-3 ${m.ok ? 'text-[#757370]' : 'text-red-600'}`} style={m.ok ? { color: m.color } : {}} />
                    <p className="text-[9px] font-black text-[#757370] uppercase tracking-wider">{m.label}</p>
                  </div>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <p className={`text-[18px] font-black leading-none ${m.ok ? 'text-[#242424]' : 'text-red-800'}`}>{m.value}</p>
                    <p className="text-[9px] font-bold text-[#A19F9D] lowercase italic">{m.unit}</p>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Minimal Watchman alert if critical */}
            {latest.hr > 110 || (latest.spo2 && latest.spo2 < 93) ? (
              <div className="p-3 bg-red-100 border border-red-200 rounded-2xl flex items-center gap-3">
                <Zap className="h-4 w-4 text-red-700" />
                <p className="text-[10px] font-bold text-red-800 uppercase tracking-tight">Watchman: Immediate Review Advised</p>
              </div>
            ) : null}
          </div>
        )}
      </ScrollArea>
    </DashCard>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// WIDGET 12 — Patient: My Medications
// ═══════════════════════════════════════════════════════════════════════════════
function MyMedicationsWidget({ onNavigate }: { onNavigate?: (id: string) => void }) {
  const { userProfile } = useCurrentUser();
  const [meds, setMeds] = useState<any[]>([]);
  
  useEffect(() => {
    if (!userProfile?.id) return;
    return subscribeToCollection('prescriptions', (items) => {
      setMeds(items.filter((m: any) => m.status === 'active'));
    }, userProfile.id);
  }, [userProfile?.id]);

  return (
    <DashCard>
      <SectionHeader 
        icon={Pill} 
        label="My Medications" 
        count={meds.length} 
        color="bg-[#DFF6DD] text-[#107C10]" 
        action={
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 px-2 text-[9px] font-black uppercase text-[#0078D4] hover:bg-[#DEECF9]"
            onClick={() => userProfile?.id && onNavigate?.(userProfile.id)}
          >
            Manage
          </Button>
        }
      />
      <ScrollArea className="flex-1">
        <div className="divide-y divide-[#F5F4F3] pb-2">
          {meds.length === 0 && <Empty message="No active prescriptions" />}
          {meds.map(med => (
            <div key={med.id} className="px-4 py-3">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-2xl bg-green-50 flex items-center justify-center shrink-0">
                  <Pill className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12.5px] font-bold text-[#242424] truncate">{med.medicationName}</p>
                  <p className="text-[11px] text-[#757370] mt-0.5">{med.dosage} · {med.frequency}</p>
                  {med.sig && <p className="text-[10.5px] text-[#A19F9D] mt-1 italic line-clamp-2">"{med.sig}"</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </DashCard>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// WIDGET 13 — Financial: Billing Overview
// ═══════════════════════════════════════════════════════════════════════════════
function BillingWidget() {
  const { patients } = useQueryModel();
  const total = Object.keys(patients).length;
  const stats = [
    { label: 'Active Encounters', value: total, color: '#0078D4' },
    { label: 'Pending Claims', value: Math.ceil(total * 0.6), color: '#CA5010' },
    { label: 'Approved This Month', value: Math.floor(total * 0.3), color: '#107C10' },
    { label: 'Requires Review', value: 1, color: '#D13438' },
  ];

  return (
    <DashCard>
      <SectionHeader icon={CreditCard} label="Billing Summary" color="bg-slate-100 text-slate-600" />
      <div className="p-4 space-y-2">
        {stats.map(s => (
          <div key={s.label} className="flex items-center justify-between p-3 rounded-2xl bg-[#FAFAFA] border border-[#EDEBE9]">
            <p className="text-[12px] font-semibold text-[#444441]">{s.label}</p>
            <p className="text-[18px] font-black" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>
    </DashCard>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// WIDGET 13 — Patient: Health Connect Sync
// ═══════════════════════════════════════════════════════════════════════════════
function HealthSyncWidget() {
  const { userProfile } = useCurrentUser();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <DashCard>
      <SectionHeader icon={Link2} label="Device Sync" color="bg-emerald-100 text-emerald-700" />
      <div className="p-4 flex flex-col items-center justify-center gap-3 text-center flex-1">
        <div className="flex -space-x-2">
          <div className="h-10 w-10 rounded-full bg-white border-2 border-emerald-50 flex items-center justify-center shadow-sm">
            <Smartphone className="h-5 w-5 text-green-500" />
          </div>
          <div className="h-10 w-10 rounded-full bg-white border-2 border-emerald-50 flex items-center justify-center shadow-sm">
            <Apple className="h-5 w-5 text-red-500" />
          </div>
        </div>
        <div>
          <p className="text-[12px] font-bold text-[#242424]">Health Connect & Apple Health</p>
          <p className="text-[10px] text-[#757370] font-medium leading-tight mt-1">Sync your clinical records with real-time wearable telemetry.</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full rounded-xl border-[#EDEBE9] hover:bg-[#FAFAFA] font-bold text-xs mt-2"
          onClick={() => setIsOpen(true)}
        >
          Manage Connection
        </Button>
      </div>

      <HealthConnectManager 
        patientId={userProfile?.id || ''} 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
      />
    </DashCard>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROLE WIDGET LAYOUTS
// Each role gets exactly 5 widgets laid out in an Android-style responsive grid:
// - Compact (mobile): single column
// - Medium (tablet): 2-col, with one card spanning full width
// - Expanded (desktop): 2–3 cols with supporting pane pattern
// ═══════════════════════════════════════════════════════════════════════════════

const ROLE_META: Record<string, { headline: string; sub: string; accentColor: string }> = {
  clinician: { headline: 'Provider Home', sub: "Patients to be seen & clinical results", accentColor: '#107C10' },
  nurse: { headline: 'Triage Center', sub: "Arrival queue & medication safety", accentColor: '#0078D4' },
  allied_health: { headline: 'Allied Health Hub', sub: "Referrals & patients", accentColor: '#5C2D91' },
  admin: { headline: 'Practice Management', sub: "Operations, staff & front desk oversight", accentColor: '#D13438' },
  billing: { headline: 'Accounting & Finance', sub: "Patient identifiers & billing support", accentColor: '#8764B8' },
  patient: { headline: 'My Health', sub: "Vitals, medications, and appointments", accentColor: '#0078D4' },
};

function WidgetGrid({ children, isEditing, order, onToggleVisibility, onToggleSize, visibility, sizes, viewClass }: { 
  children: Record<string, React.ReactNode>;
  isEditing: boolean;
  order: string[];
  onToggleVisibility: (id: string) => void;
  onToggleSize: (id: string) => void;
  visibility: Record<string, boolean>;
  sizes: Record<string, '1x1' | '1x2' | '2x1' | '2x2' | '2x3' | '4x2' | '0.5x0.5'>;
  viewClass: 'compact' | 'medium' | 'expanded';
}) {
  const displayOrder = isEditing ? order : order.filter(id => visibility[id]);

  const getSizeClasses = (id: string) => {
    const size = sizes[id] || '1x1';
    const isCompact = viewClass === 'compact';
    const isExpanded = viewClass === 'expanded';
    
    // In expanded mode (8-cols), we double the spans to maintain the same relative size
    // but with higher granularity slots.
    const mult = isExpanded ? 2 : 1;
    
    switch (size) {
    case '1x1': return isExpanded ? 'col-span-2 row-span-2' : 'col-span-1 row-span-1';
      case '0.5x0.5': return isExpanded ? 'col-span-1 row-span-1' : 'col-span-1 row-span-1';
      case '1x2': return isExpanded ? 'col-span-2 row-span-4' : 'col-span-1 row-span-2';
      case '2x1': return isExpanded ? 'col-span-4 row-span-2' : 'col-span-2 row-span-1';
      case '2x2': return isExpanded ? 'col-span-4 row-span-4' : 'col-span-2 row-span-2';
      case '2x3': return isExpanded ? 'col-span-4 row-span-6' : 'col-span-2 row-span-3';
      case '4x2': return isCompact ? 'col-span-2 row-span-2' : (isExpanded ? 'col-span-8 row-span-4' : 'col-span-4 row-span-2');
      default: return 'col-span-1 row-span-1';
    }
  };

  return (
    <SortableContext
      items={displayOrder}
      strategy={verticalListSortingStrategy}
    >
      <div className={`grid grid-cols-2 md:grid-cols-4 ${viewClass === 'expanded' ? 'lg:grid-cols-8' : 'lg:grid-cols-4'} gap-4 flex-1 min-h-0`}
        style={{ gridAutoRows: viewClass === 'expanded' ? '75px' : '150px' }}>
        {displayOrder.map((id, i) => {
          const currentSize = sizes[id] || '1x1';
          return (
            <motion.div
              key={id}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05, ease: [0.33, 1, 0.68, 1] }}
              className={`flex flex-col min-h-0 ${getSizeClasses(id)}`}
            >
              <SortableWidget 
                id={id} 
                isEditing={isEditing} 
                onToggleVisibility={() => onToggleVisibility(id)}
                onToggleSize={() => onToggleSize(id)}
                visible={visibility[id]}
                size={currentSize}
              >
                {children[id]}
              </SortableWidget>
            </motion.div>
          );
        })}
      </div>
    </SortableContext>
  );
}

// ─── Main export ───────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
// WIDGET 13 — Administrator: Audit Trail
// ═══════════════════════════════════════════════════════════════════════════════
function AdministratorAuditWidget() {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    return subscribeToAuditLogs(setLogs);
  }, []);

  return (
    <DashCard>
      <SectionHeader icon={ShieldCheck} label="Practice Audit Trail" color="bg-[#FAFAFA] text-[#242424]" />
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {logs.length === 0 && <Empty message="No recent activity logged" />}
          {logs.map((log) => (
            <div key={log.id} className="flex gap-4 group">
              <div className="shrink-0 flex flex-col items-center gap-1">
                <div className={`h-8 w-8 rounded-xl flex items-center justify-center border transition-all ${
                  log.action.includes('TRANSITION') ? 'bg-blue-50 text-blue-600 border-blue-100' :
                  log.action.includes('CHARGE') ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                  'bg-slate-50 text-slate-600 border-slate-100'
                }`}>
                  <History className="h-4 w-4" />
                </div>
                <div className="h-full w-px bg-[#F3F2F1] group-last:hidden" />
              </div>
              <div className="flex-1 min-w-0 pb-4">
                <div className="flex items-center justify-between gap-2">
                   <p className="text-[11px] font-black text-[#242424] uppercase tracking-wider">{log.action.replace(/_/g, ' ')}</p>
                   <p className="text-[9px] font-bold text-[#A19F9D] whitespace-nowrap">
                     {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                   </p>
                </div>
                <p className="text-[11px] text-[#616161] mt-0.5 line-clamp-1">{log.details}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="text-[8px] font-black uppercase text-[#A19F9D] border-[#EDEBE9] h-4">ID: {log.entityId.slice(-6)}</Badge>
                  <p className="text-[9px] font-bold text-[#A19F9D] uppercase tracking-tighter">By: {log.userId.slice(-6)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </DashCard>
  );
}

export function RoleDashboard({ onNavigateToPatient, onNavigate }: { 
  onNavigateToPatient?: (id: string) => void;
  onNavigate?: (module: string) => void;
}) {
  const { userProfile } = useCurrentUser();
  const { messages, courtesyCalls, reminders } = useDashboard(userProfile);
  const viewClass = useWindowSizeClass(); // 'compact' | 'medium' | 'expanded'
  const role = userProfile?.role || 'clinician';

  const meta = ROLE_META[role] || ROLE_META.clinician;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = userProfile?.displayName?.split(' ')[0] || 'there';

  // --- Dashboard Customization State (Multi-view) ---
  const [isEditing, setIsEditing] = useState(false);
  
  // Mapping of size classes to easier names if preferred, but we use the ones from hook
  const [allOrders, setAllOrders] = useState<Record<string, string[]>>({});
  const [allVisibility, setAllVisibility] = useState<Record<string, Record<string, boolean>>>({});
  const [allSizes, setAllSizes] = useState<Record<string, Record<string, '1x1' | '1x2' | '2x1' | '2x2' | '2x3' | '4x2'>>>({});

  // Helper to get current view data or defaults
  const widgetOrder = allOrders[viewClass] || [];
  const widgetVisibility = allVisibility[viewClass] || {};
  const widgetSizes = allSizes[viewClass] || {};

  const handleRead = async (id: string) => { await markMessageRead(id); };
  const handleComplete = async (id: string, notes: string) => { await completeCourtesyCall(id, notes); };
  
  const handleCompleteReminder = async (id: string) => { await completeReminder(id); };
  const handleCreateReminder = async (data: any) => { 
    await createReminder({
      ...data,
      assignedToUserId: userProfile?.id,
      assignedToRole: userProfile?.role
    });
  };

  const widgetDefinitions: Record<string, Record<string, React.ReactNode>> = {
    clinician: {
      messages: <MessagesWidget messages={messages} onRead={handleRead} onNavigate={onNavigate} />,
      reminders: <RemindersWidget reminders={reminders} onComplete={handleCompleteReminder} onCreate={handleCreateReminder} />,
      schedule: <TodayScheduleWidget onNavigate={onNavigateToPatient} />,
      results: <PendingResultsWidget onNavigate={onNavigateToPatient} />,
      patients: <MyPatientsWidget userId={userProfile?.id || ''} onNavigate={onNavigateToPatient} />,
      calls: <CourtesyCallsWidget tasks={courtesyCalls} onComplete={handleComplete} />,
    },
    nurse: {
      messages: <MessagesWidget messages={messages} onRead={handleRead} onNavigate={onNavigate} />,
      reminders: <RemindersWidget reminders={reminders} onComplete={handleCompleteReminder} onCreate={handleCreateReminder} />,
      queue: <CheckInQueueWidget onNavigate={onNavigateToPatient} />,
      med_flags: <MedicationFlagsWidget onNavigate={onNavigateToPatient} />,
      schedule: <TodayScheduleWidget onNavigate={onNavigateToPatient} />,
      calls: <CourtesyCallsWidget tasks={courtesyCalls} onComplete={handleComplete} />,
    },
    allied_health: {
      messages: <MessagesWidget messages={messages} onRead={handleRead} onNavigate={onNavigate} />,
      reminders: <RemindersWidget reminders={reminders} onComplete={handleCompleteReminder} onCreate={handleCreateReminder} />,
      patients: <MyPatientsWidget userId={userProfile?.id || ''} onNavigate={onNavigateToPatient} />,
      referrals: <ReferralsWidget specialty={userProfile?.specialty as string} onNavigate={onNavigateToPatient} />,
      schedule: <TodayScheduleWidget onNavigate={onNavigateToPatient} />,
      calls: <CourtesyCallsWidget tasks={courtesyCalls} onComplete={handleComplete} />,
    },
    admin: {
      messages: <MessagesWidget messages={messages} onRead={handleRead} onNavigate={onNavigate} />,
      reminders: <RemindersWidget reminders={reminders} onComplete={handleCompleteReminder} onCreate={handleCreateReminder} />,
      overview: <SystemOverviewWidget />,
      directory: <StaffDirectoryWidget />,
      queue: <CheckInQueueWidget onNavigate={onNavigateToPatient} />,
      billing: <BillingWidget />,
      schedule: <TodayScheduleWidget onNavigate={onNavigateToPatient} />,
      audit: <AdministratorAuditWidget />,
    },
    billing: {
      messages: <MessagesWidget messages={messages} onRead={handleRead} onNavigate={onNavigate} />,
      reminders: <RemindersWidget reminders={reminders} onComplete={handleCompleteReminder} onCreate={handleCreateReminder} />,
      billing: <BillingWidget />,
      patients: <MyPatientsWidget userId={userProfile?.id || ''} onNavigate={onNavigateToPatient} />, // For identifiers
      calls: <CourtesyCallsWidget tasks={courtesyCalls} onComplete={handleComplete} />,
    },
    front_desk: {
      messages: <MessagesWidget messages={messages} onRead={handleRead} onNavigate={onNavigate} />,
      reminders: <RemindersWidget reminders={reminders} onComplete={handleCompleteReminder} onCreate={handleCreateReminder} />,
      overview: <SystemOverviewWidget />,
      directory: <StaffDirectoryWidget />,
      queue: <CheckInQueueWidget onNavigate={onNavigateToPatient} />,
      schedule: <TodayScheduleWidget onNavigate={onNavigateToPatient} />,
      audit: <AdministratorAuditWidget />,
    },
    patient: {
      messages: <MessagesWidget messages={messages} onRead={handleRead} onNavigate={onNavigate} />,
      reminders: <RemindersWidget reminders={reminders} onComplete={handleCompleteReminder} onCreate={handleCreateReminder} />,
      vitals: <MyVitalsWidget onNavigate={onNavigateToPatient} />,
      medications: <MyMedicationsWidget onNavigate={onNavigateToPatient} />,
      schedule: <TodayScheduleWidget patientId={userProfile?.id} onNavigate={onNavigateToPatient} />,
      health_sync: <HealthSyncWidget />,
    },
  };

  const availableWidgets = widgetDefinitions[role] || widgetDefinitions.clinician;

  // Sync state with user profile
  useEffect(() => {
    const currentIds = Object.keys(availableWidgets);
    const viewTypes: ('compact' | 'medium' | 'expanded')[] = ['compact', 'medium', 'expanded'];
    
    const newOrders: Record<string, string[]> = {};
    const newVisibility: Record<string, Record<string, boolean>> = {};
    const newSizes: Record<string, Record<string, any>> = {};

    viewTypes.forEach(v => {
      const saved = userProfile?.dashboardSettings?.[v];
      const roleDefaults = (DEFAULT_DASHBOARD_SETTINGS[role] || DEFAULT_DASHBOARD_SETTINGS.clinician)[v];
      
      if (saved) {
        const cleanedOrder = (saved.order || []).filter((id: string) => currentIds.includes(id));
        const missingIds = currentIds.filter(id => !cleanedOrder.includes(id));
        newOrders[v] = [...cleanedOrder, ...missingIds];
        newVisibility[v] = saved.visibility || currentIds.reduce((acc, id) => ({ ...acc, [id]: true }), {});
        newSizes[v] = saved.sizes || {};
      } else {
        newOrders[v] = roleDefaults.order.filter(id => currentIds.includes(id));
        // Add any missing IDs that might be in the available widgets but not in the default order
        const missingIds = currentIds.filter(id => !newOrders[v].includes(id));
        if (missingIds.length > 0) {
          newOrders[v] = [...newOrders[v], ...missingIds];
        }
        
        newVisibility[v] = { ...roleDefaults.visibility };
        newSizes[v] = { ...roleDefaults.sizes };
      }
    });

    setAllOrders(newOrders);
    setAllVisibility(newVisibility);
    setAllSizes(newSizes);
  }, [userProfile?.id, role]);

  const handleToggleVisibility = (id: string) => {
    setAllVisibility(prev => ({
      ...prev,
      [viewClass]: {
        ...(prev[viewClass] || {}),
        [id]: !prev[viewClass]?.[id]
      }
    }));
  };

  const handleToggleSize = (id: string) => {
    setAllSizes(prev => {
      const currentViewSizes = prev[viewClass] || {};
      const current = currentViewSizes[id] || '1x1';
      const cycle: Record<string, '1x1' | '1x2' | '2x1' | '2x2' | '2x3' | '4x2'> = {
        '1x1': '1x2',
        '1x2': '2x1',
        '2x1': '2x2',
        '2x2': '2x3',
        '2x3': '4x2',
        '4x2': '1x1',
      };
      
      return { 
        ...prev, 
        [viewClass]: {
          ...currentViewSizes,
          [id]: cycle[current]
        }
      };
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setAllOrders((prev) => {
        const items = prev[viewClass] || [];
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        return {
          ...prev,
          [viewClass]: arrayMove(items, oldIndex, newIndex)
        };
      });
    }
  };

  const saveSettings = async () => {
    if (!userProfile?.id) return;
    
    // Captured snapshot of state to save
    const settingsToSave = {
      compact: {
        order: allOrders.compact || [],
        visibility: allVisibility.compact || {},
        sizes: allSizes.compact || {}
      },
      medium: {
        order: allOrders.medium || [],
        visibility: allVisibility.medium || {},
        sizes: allSizes.medium || {}
      },
      expanded: {
        order: allOrders.expanded || [],
        visibility: allVisibility.expanded || {},
        sizes: allSizes.expanded || {}
      }
    };

    setIsEditing(false);
    
    try {
      await updateUserDashboardSettings(userProfile.id, settingsToSave);
    } catch (error) {
      console.error("Failed to save dashboard settings:", error);
      setIsEditing(true); // Re-enable if failed so they can try again
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  if (role === 'patient') {
    return <div className="p-6 text-center text-slate-500 font-medium">Please access the patient portal from the sidebar.</div>;
  }

  return (
    <div className="h-full flex flex-col gap-5 min-w-0 overflow-y-auto pb-6">
      {/* M3 Hero header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.33, 1, 0.68, 1] }}
        className="flex items-end justify-between shrink-0"
      >
        <div>
          <p className="text-[10px] font-black text-[#A19F9D] uppercase tracking-widest mb-1.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <div className="flex items-center gap-4">
             <h1 className="text-[26px] font-black text-[#1A1A1A] tracking-tight leading-none">
              {greeting}, <span style={{ color: meta.accentColor }}>{firstName}</span>
            </h1>
          </div>
          <p className="text-[13px] text-[#757370] font-medium mt-1.5">
            {isEditing ? 'Drag handles to reorder, use eye icon to toggle visibility' : meta.sub}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            {isEditing && (
              <>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={async () => {
                    if (userProfile?.id) {
                      await updateUserDashboardSettings(userProfile.id, null);
                      window.location.reload();
                    }
                  }}
                  title="Reset to Defaults"
                  className="h-9 w-9 p-0 rounded-full bg-[#FAFAFA] border border-[#EDEBE9] text-[#616161] hover:bg-[#F3F2F1]"
                >
                  <RefreshCcw className="h-4 w-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => setIsEditing(false)}
                  title="Cancel Changes"
                  className="h-9 w-9 p-0 rounded-full bg-red-50 text-[#D13438] border border-red-100 hover:bg-red-100"
                >
                  <X className="h-4 w-4" />
                </Button>
              </>
            )}
            <Button 
               size="sm" 
               variant="outline" 
               onClick={() => isEditing ? saveSettings() : setIsEditing(true)}
               className={`h-9 px-4 rounded-full shadow-sm transition-all flex items-center gap-2 ${isEditing ? 'bg-[#107C10] text-white hover:bg-[#0b5e0b]' : 'bg-white border border-[#EDEBE9] text-[#757370] hover:bg-[#F3F2F1] hover:text-[#0078D4]'}`}
            >
              {isEditing ? <Save className="h-4 w-4" /> : <Settings2 className="h-4 w-4" />}
              <span className="text-[11px] font-black uppercase tracking-wider">
                {isEditing ? "Save Layout" : "Customize"}
              </span>
            </Button>
          </div>
          <div
            className="h-10 px-4 rounded-full flex items-center gap-2 text-[11px] font-black uppercase tracking-widest shadow-sm border border-transparent"
            style={{ background: `${meta.accentColor}14`, color: meta.accentColor, borderColor: `${meta.accentColor}20` }}
          >
            {role.replace('_', ' ')}
          </div>
          {messages.filter(m => !m.read).length > 0 && (
            <p className="text-[10px] text-[#757370] font-semibold">
              {messages.filter(m => !m.read).length} unread message{messages.filter(m => !m.read).length > 1 ? 's' : ''}
            </p>
          )}
        </div>
      </motion.div>

      {/* Widget grid */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <WidgetGrid 
          isEditing={isEditing} 
          order={widgetOrder} 
          onToggleVisibility={handleToggleVisibility}
          onToggleSize={handleToggleSize}
          visibility={widgetVisibility}
          sizes={widgetSizes}
          viewClass={viewClass}
        >
          {availableWidgets}
        </WidgetGrid>
      </DndContext>
    </div>
  );
}
