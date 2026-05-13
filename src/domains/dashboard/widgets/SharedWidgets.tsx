
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, Bell, Plus, Check, Clock, User, X, PhoneCall, Phone
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { Badge } from '../../../components/ui/badge';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger 
} from '../../../components/ui/dialog';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '../../../components/ui/select';
import { DashCard, SectionHeader, Empty, Avatar } from '../components/DashboardUI';
import { timeAgo, urgencyPill } from '../utils';

// --- Reminders Widget ---
export function RemindersWidget({ reminders, onComplete, onCreate }: { 
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
    return diff > 0 && diff < 86400000;
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

// --- Messages Widget ---
export function MessagesWidget({ messages, onRead }: { messages: any[]; onRead: (id: string) => void }) {
  const [selected, setSelected] = useState<any | null>(null);
  const unreadCount = messages.filter(m => !m.read).length;

  const handleSelect = (msg: any) => {
    setSelected(msg);
    if (!msg.read) onRead(msg.id);
  };

  const roleColors: Record<string, string> = {
    clinician: '#107C10', nurse: '#0078D4', allied_health: '#5C2D91',
    admin: '#D13438', billing: '#8764B8', patient: '#CA5010',
  };

  return (
    <DashCard>
      <SectionHeader icon={MessageSquare} label="Messages" count={unreadCount} color="bg-[#DEECF9] text-[#0078D4]" />
      <div className="flex flex-1 min-h-0">
        <ScrollArea 
          className={`${selected ? 'hidden md:flex md:w-2/5 md:border-r md:border-[#EDEBE9]' : 'flex-1'} flex-col h-[236px]`}
          viewportClassName="h-[256px]"
        >
          <div className="divide-y divide-[#F5F4F3]">
            {messages.length === 0 && <Empty message="No messages yet" />}
            {messages.map(msg => (
              <button
                key={msg.id}
                onClick={() => handleSelect(msg)}
                className={`w-full text-left px-4 py-3 hover:bg-[#F5F4F3] transition-colors flex gap-3 items-start ${selected?.id === msg.id ? 'bg-[#F0F7FF]' : ''}`}
              >
                <div className="relative shrink-0 mt-0.5">
                  <Avatar name={msg.fromUserName || '?'} color={roleColors[msg.fromRole] || '#616161'} size="sm" />
                  {!msg.read && (
                    <div className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-[#0078D4] border-2 border-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className={`text-[12px] truncate ${!msg.read ? 'font-black text-[#242424]' : 'font-semibold text-[#616161]'}`}>
                      {msg.fromUserName || 'Unknown'}
                    </p>
                    <span className="text-[9px] text-[#A19F9D] shrink-0">{timeAgo(msg.createdAt)}</span>
                  </div>
                  <p className="text-[11px] text-[#444441] font-medium truncate mt-0.5">{msg.subject}</p>
                  {msg.patientName && (
                    <p className="text-[10px] text-[#0078D4] font-semibold mt-0.5 truncate">Re: {msg.patientName}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>

        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col min-h-0 bg-[#FAFAFA]"
            >
              <div className="flex items-center gap-2 px-4 py-3 border-b border-[#EDEBE9] bg-white">
                <button onClick={() => setSelected(null)} className="md:hidden p-1 rounded-lg hover:bg-[#F3F2F1]">
                  <X className="h-4 w-4 text-[#616161]" />
                </button>
                <Avatar name={selected.fromUserName || '?'} color={roleColors[selected.fromRole] || '#616161'} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-black text-[#242424] truncate">{selected.fromUserName}</p>
                  <p className="text-[10px] text-[#A19F9D] capitalize">{selected.fromRole?.replace('_', ' ')}</p>
                </div>
                <span className="text-[10px] text-[#A19F9D]">{timeAgo(selected.createdAt)}</span>
              </div>
              <ScrollArea className="flex-1 p-4">
                <p className="text-[13px] font-black text-[#242424] mb-1">{selected.subject}</p>
                {selected.patientName && (
                  <Badge className="mb-3 bg-[#DEECF9] text-[#0078D4] border-none text-[10px] font-bold">
                    Re: {selected.patientName}
                  </Badge>
                )}
                <p className="text-[13px] text-[#444441] leading-relaxed">{selected.body}</p>
              </ScrollArea>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashCard>
  );
}

// --- Courtesy Calls Widget ---
export function CourtesyCallsWidget({ tasks, onComplete }: { tasks: any[]; onComplete: (id: string, notes: string) => void }) {
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
