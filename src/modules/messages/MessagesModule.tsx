import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, MailOpen, Send, Inbox, ChevronRight, 
  Search, ArrowLeft, Clock, Plus, CheckCircle, X, ShieldAlert, FileText, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { Button } from '../../components/ui/button';
import { ScrollArea } from '../../components/ui/scroll-area';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Card } from '../../components/ui/card';
import { ComposeMessageModal } from '../dashboard/ComposeMessageModal';
import { mockDbService } from '../../lib/mockDatabase';
import { markMessageRead } from '../../services/clinicalFirestoreService';

// Helper for relative time formatting
function timeAgo(dateString: any): string {
  if (!dateString) return '';
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (isNaN(seconds) || seconds < 0) return 'Just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// Avatar helper component matching dashboard aesthetic
function Avatar({ name, color = '#0078D4', size = 'sm' }: { name: string; color?: string; size?: 'sm' | 'md' }) {
  const s = size === 'sm' ? 'h-8 w-8 text-[11px]' : 'h-10 w-10 text-[13px]';
  return (
    <div className={`${s} rounded-full flex items-center justify-center font-black text-white shrink-0 shadow-sm`} style={{ background: color }}>
      {name?.[0]?.toUpperCase() || '?'}
    </div>
  );
}

const ROLE_COLORS: Record<string, string> = {
  clinician: '#107C10', 
  nurse: '#0078D4', 
  allied_health: '#5C2D91',
  admin: '#D13438', 
  billing: '#8764B8', 
  patient: '#CA5010',
};

export function MessagesModule() {
  const { userProfile } = useCurrentUser();
  const [messages, setMessages] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'inbox' | 'sent' | 'unread'>('inbox');
  const [selectedMessage, setSelectedMessage] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [isCustomComposeOpen, setIsCustomComposeOpen] = useState(false);

  const fetchMessages = () => {
    if (!userProfile) return;
    const allMsgs = mockDbService.getCollection('messages');
    
    // Filter messages based on tab
    let filtered: any[] = [];
    if (activeTab === 'inbox') {
      filtered = allMsgs.filter((m: any) => m.toUserId === userProfile.id);
    } else if (activeTab === 'sent') {
      filtered = allMsgs.filter((m: any) => m.fromUserId === userProfile.id);
    } else if (activeTab === 'unread') {
      filtered = allMsgs.filter((m: any) => m.toUserId === userProfile.id && !m.read);
    }

    // Apply search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(m => 
        (m.subject || '').toLowerCase().includes(q) ||
        (m.body || '').toLowerCase().includes(q) ||
        (m.fromUserName || '').toLowerCase().includes(q) ||
        (m.toUserName || '').toLowerCase().includes(q) ||
        (m.patientName || '').toLowerCase().includes(q)
      );
    }

    // Sort by chronological order (latest first)
    filtered.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    setMessages(filtered);
  };

  useEffect(() => {
    fetchMessages();
  }, [userProfile?.id, activeTab, searchQuery]);

  const handleRead = async (msg: any) => {
    setSelectedMessage(msg);
    if (!msg.read && msg.toUserId === userProfile?.id) {
      await markMessageRead(msg.id);
      // Update local state in-place to avoid layout flickering
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, read: true } : m));
      // Refresh the system overview counts
      fetchMessages();
    }
  };

  const currentUnreadCount = mockDbService.getCollection('messages')
    .filter((m: any) => m.toUserId === userProfile?.id && !m.read).length;

  return (
    <div className="h-full flex flex-col min-w-0">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black text-[#A19F9D] uppercase tracking-widest bg-slate-100 dark:bg-slate-800 w-fit px-3 py-1 rounded-full border border-slate-200">
            <MessageSquare className="h-3 w-3 text-[#0078D4]" />
            <span>Secure Comms Core</span>
          </div>
          <h1 className="text-2xl font-black text-[#1A1A1A] tracking-tight mt-1.5 flex items-center gap-2">
            Clinical Messaging Center
          </h1>
          <p className="text-[13px] text-[#757370] font-medium mt-1">
            HIPAA-compliant peer-to-peer and provider-patient communication vault.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Secure indicator */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-100 uppercase tracking-widest mr-2">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            End-To-End AES-256
          </div>
          
          <ComposeMessageModal 
            isOpen={isCustomComposeOpen}
            onOpenChange={setIsCustomComposeOpen}
            onSent={() => {
              setIsCustomComposeOpen(false);
              fetchMessages();
            }}
            trigger={
              <Button 
                onClick={() => setIsCustomComposeOpen(true)}
                className="rounded-full bg-[#0078D4] hover:bg-[#005A9E] text-white font-black text-[12px] uppercase tracking-wider px-6 h-10 shadow-md gap-2"
              >
                <Plus className="h-4 w-4" /> Message Peer / Patient
              </Button>
            }
          />
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex flex-col md:flex-row gap-6 min-h-0 bg-white border border-[#EDEBE9] rounded-3xl overflow-hidden shadow-sm">
        
        {/* Left Side: Message List Panel */}
        <div className={`flex-1 md:max-w-md border-r border-[#EDEBE9] flex flex-col min-h-0 ${selectedMessage ? 'hidden md:flex' : 'flex'}`}>
          
          {/* Tabs and Search Header */}
          <div className="p-4 border-b border-[#EDEBE9] space-y-3 shrink-0 bg-[#FAFAFA]/50">
            <div className="flex items-center gap-1.5 bg-[#EDEBE9]/50 p-1 rounded-full">
              <button
                onClick={() => { setActiveTab('inbox'); setSelectedMessage(null); }}
                className={`flex-1 py-1.5 text-center text-[11px] font-bold uppercase tracking-widest rounded-full transition-all ${activeTab === 'inbox' ? 'bg-white text-[#242424] shadow-sm' : 'text-[#616161] hover:text-[#242424]'}`}
              >
                Inbox {activeTab === 'inbox' && messages.length > 0 && `(${messages.length})`}
              </button>
              <button
                onClick={() => { setActiveTab('unread'); setSelectedMessage(null); }}
                className={`flex-1 py-1.5 text-center text-[11px] font-bold uppercase tracking-widest rounded-full transition-all relative ${activeTab === 'unread' ? 'bg-white text-[#242424] shadow-sm' : 'text-[#616161] hover:text-[#242424]'}`}
              >
                Unread
                {currentUnreadCount > 0 && (
                  <span className="absolute top-1.5 right-2 h-2 w-2 rounded-full bg-[#0078D4]" />
                )}
              </button>
              <button
                onClick={() => { setActiveTab('sent'); setSelectedMessage(null); }}
                className={`flex-1 py-1.5 text-center text-[11px] font-bold uppercase tracking-widest rounded-full transition-all ${activeTab === 'sent' ? 'bg-white text-[#242424] shadow-sm' : 'text-[#616161] hover:text-[#242424]'}`}
              >
                Sent
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A19F9D]" />
              <Input
                placeholder="Search subject, contacts, patient..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 rounded-xl border-[#EDEBE9] bg-white h-9 text-xs focus-visible:ring-[#0078D4]"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          {/* List Area */}
          <ScrollArea className="flex-1">
            <div className="divide-y divide-[#F5F4F3]">
              {messages.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="h-12 w-12 bg-[#F3F2F1] rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <MailOpen className="h-6 w-6 text-[#A19F9D]" />
                  </div>
                  <p className="text-[12px] font-bold text-[#616161] uppercase tracking-wider">No communication found</p>
                  <p className="text-[11px] text-[#A19F9D] mt-1 mx-6">There are no messages matching the current filter filters.</p>
                </div>
              ) : (
                messages.map(msg => {
                  const isInbox = msg.toUserId === userProfile?.id;
                  const displayUser = isInbox ? msg.fromUserName : msg.toUserName;
                  const displayRole = isInbox ? msg.fromRole : msg.toRole;
                  const showUnreadDot = isInbox && !msg.read;

                  return (
                    <button
                      key={msg.id}
                      onClick={() => handleRead(msg)}
                      className={`w-full text-left px-5 py-4 hover:bg-[#F5F4F3] transition-colors flex gap-4 items-start relative ${selectedMessage?.id === msg.id ? 'bg-[#F0F7FF]' : ''}`}
                    >
                      <div className="relative shrink-0 mt-0.5">
                        <Avatar name={displayUser || '?'} color={ROLE_COLORS[displayRole] || '#616161'} size="sm" />
                        {showUnreadDot && (
                          <div className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-[#0078D4] border-2 border-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className={`text-xs truncate ${showUnreadDot ? 'font-black text-[#242424]' : 'font-semibold text-[#616161]'}`}>
                            {displayUser || 'Unknown'} 
                            <span className="ml-1 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-slate-100 text-slate-500">
                              {displayRole?.replace('_', ' ')}
                            </span>
                          </p>
                          <span className="text-[9px] text-[#A19F9D] font-medium shrink-0">{timeAgo(msg.createdAt)}</span>
                        </div>
                        <p className="text-[12px] text-[#242424] font-bold truncate mt-1">
                          {msg.subject || '(No Subject)'}
                        </p>
                        <p className="text-[11px] text-[#757370] font-medium truncate mt-0.5">
                          {msg.body}
                        </p>
                        {msg.patientName && (
                          <div className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full bg-[#DEECF9] text-[#0078D4] text-[9px] font-bold">
                            <FileText className="h-2.5 w-2.5" />
                            {msg.patientName}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Right Side: Message Detail Panel */}
        <div className={`flex-1 flex flex-col min-h-0 bg-[#FAFAFA] ${!selectedMessage ? 'hidden md:flex justify-center items-center' : 'flex'}`}>
          <AnimatePresence mode="wait">
            {!selectedMessage ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center p-8 space-y-4"
              >
                <div className="h-16 w-16 bg-[#F3F2F1] rounded-[24px] flex items-center justify-center mx-auto shadow-sm">
                  <Inbox className="h-8 w-8 text-[#A19F9D]" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#242424] uppercase tracking-wider">Select a conversation</h3>
                  <p className="text-[11px] text-[#A19F9D] max-w-sm mt-1">
                    Read and respond securely to patient messages, peer diagnostics, and team coordinates instantly.
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={selectedMessage.id}
                initial={{ opacity: 0, scale: 0.99 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.99 }}
                transition={{ duration: 0.15 }}
                className="flex-1 flex flex-col min-h-0 bg-white"
              >
                {/* Detail Header */}
                <div className="flex items-center gap-3 px-6 py-4 border-b border-[#EDEBE9] bg-[#FAFAFA]/50 shrink-0">
                  <button 
                    onClick={() => setSelectedMessage(null)} 
                    className="md:hidden p-2 -ml-2 rounded-full hover:bg-slate-200 text-[#616161]"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <Avatar 
                    name={(selectedMessage.fromUserId === userProfile?.id ? selectedMessage.toUserName : selectedMessage.fromUserName) || '?'} 
                    color={ROLE_COLORS[selectedMessage.fromUserId === userProfile?.id ? selectedMessage.toRole : selectedMessage.fromRole] || '#616161'} 
                    size="md" 
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-black text-[#242424] truncate">
                        {selectedMessage.fromUserId === userProfile?.id ? `To: ${selectedMessage.toUserName}` : `From: ${selectedMessage.fromUserName}`}
                      </p>
                      <Badge variant="outline" className="text-[9px] uppercase tracking-widest font-black shrink-0 px-2 bg-white">
                        {selectedMessage.fromUserId === userProfile?.id ? selectedMessage.toRole?.replace('_', ' ') : selectedMessage.fromRole?.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-[#A19F9D] font-mono mt-0.5">
                      {new Date(selectedMessage.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                  </div>
                  
                  {/* Secure Label */}
                  <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#EEF6F0] text-[#107C10] text-[9px] font-black border border-[#DFF6DD] uppercase tracking-wider">
                    Secure Vault
                  </div>
                </div>

                {/* Subject & Related Section */}
                <div className="px-6 py-4 border-b border-[#EDEBE9]/60 shrink-0">
                  <h1 className="text-lg font-black text-[#1A1A1A] tracking-tight">{selectedMessage.subject}</h1>
                  
                  {selectedMessage.patientName && (
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-[10px] font-bold text-[#757370] uppercase tracking-widest">Regarding Patient:</span>
                      <Badge className="bg-[#DEECF9] text-[#0078D4] hover:bg-[#DEECF9]/80 border-none text-[10px] font-semibold py-1 px-3 rounded-full flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {selectedMessage.patientName}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Message Body */}
                <ScrollArea className="flex-1 p-6">
                  <div className="max-w-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 rounded-2xl p-5 shadow-inner">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2 select-none border-b border-slate-200/50 pb-2 flex justify-between">
                      <span>Decrypted Transmitted Text</span>
                      <span className="font-mono text-[9px] text-[#0078D4]">KEY_INDEX_04</span>
                    </p>
                    <p className="text-[14px] text-[#242424] leading-relaxed whitespace-pre-wrap font-medium">
                      {selectedMessage.body}
                    </p>
                  </div>
                </ScrollArea>

                {/* Actions / Reply section */}
                <div className="p-6 bg-slate-50 border-t border-[#EDEBE9] shrink-0 flex items-center justify-between gap-4">
                  <div className="text-[10px] text-[#757370] font-semibold flex items-center gap-1">
                    <ShieldAlert className="h-3 w-3 text-[#A19F9D]" />
                    Complies with NIST SP 800-53 cryptography standards.
                  </div>

                  <ComposeMessageModal 
                    replyTo={selectedMessage}
                    isOpen={isReplying}
                    onOpenChange={setIsReplying}
                    onSent={() => {
                      setIsReplying(false);
                      fetchMessages();
                    }}
                    trigger={
                      <Button 
                        size="default" 
                        className="rounded-full bg-[#0078D4] hover:bg-[#005A9E] text-white font-black text-[12px] uppercase tracking-widest px-8 shadow-sm h-11"
                        onClick={() => setIsReplying(true)}
                      >
                        <Send className="h-4 w-4 mr-2" /> Reply Securely
                      </Button>
                    }
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
