import React, { useState, useEffect } from 'react';
import { 
  CreditCard, Search, Landmark, FileText, 
  ArrowUpRight, ArrowDownLeft, ShieldCheck, 
  DollarSign, Activity, Users, Clock, Filter,
  MoreVertical, Download, Send, CheckCircle2
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { ScrollArea } from '../../components/ui/scroll-area';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';

import { useCurrentUser } from '../../hooks/useCurrentUser';

export function BillingDashboard() {
  const { userProfile } = useCurrentUser();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [recentCharges, setRecentCharges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'paid'>('all');

  useEffect(() => {
    if (!userProfile || !['admin', 'manager', 'billing'].includes(userProfile.role)) {
      return;
    }
    const invoicesQ = query(collection(db, 'invoices'), orderBy('createdAt', 'desc'), limit(10));
    const chargesQ = query(collection(db, 'charges'), orderBy('createdAt', 'desc'), limit(10));

    const unsubInvoices = onSnapshot(invoicesQ, snap => {
      setInvoices(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    const unsubCharges = onSnapshot(chargesQ, snap => {
      setRecentCharges(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubInvoices();
      unsubCharges();
    };
  }, []);

  const stats = [
    { label: 'Pending Claims', value: '$24,502', change: '+12.5%', icon: FileText, color: '#0078D4' },
    { label: 'Cash Collections', value: '$12,280', change: '+5.2%', icon: DollarSign, color: '#107C10' },
    { label: 'Insurance Outstand.', value: '$45,800', change: '-2.1%', icon: Landmark, color: '#8764B8' },
    { label: 'Denial Rate', value: '4.2%', change: '-0.5%', icon: Activity, color: '#D13438' },
  ];

  if (userProfile && !['admin', 'manager', 'billing'].includes(userProfile.role)) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center p-8">
        <ShieldCheck className="h-12 w-12 text-[#D13438] mb-4" />
        <h2 className="text-xl font-black text-[#242424] uppercase tracking-tight">Access Restricted</h2>
        <p className="text-sm text-[#616161] mt-2 max-w-md">
          Financial data access is restricted to billing specialists and administrators. 
          Clinicians and other medical staff do not have access to practice revenue or patient invoicing.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-[#242424] tracking-tighter uppercase leading-none">Revenue cycle</h1>
          <p className="text-xs font-bold text-[#616161] uppercase tracking-widest mt-2 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#107C10]" />
            Tiered billing & insurance verification
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="h-10 rounded-xl border-[#EDEBE9] font-bold text-[11px] uppercase tracking-wider">
            <Download className="h-4 w-4 mr-2" />
            Report
          </Button>
          <Button className="h-10 rounded-xl bg-[#0078D4] hover:bg-[#005A9E] font-bold text-[11px] uppercase tracking-wider shadow-lg shadow-[#0078D4]/20">
            <CreditCard className="h-4 w-4 mr-2" />
            Post Payment
          </Button>
        </div>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="border-none shadow-sm bg-white overflow-hidden group">
              <CardContent className="p-6 relative">
                <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: stat.color }} />
                <div className="flex items-start justify-between">
                  <div className="space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#616161] opacity-70">{stat.label}</p>
                    <div className="space-y-1">
                      <h3 className="text-2xl font-black text-[#242424] tracking-tight leading-none">{stat.value}</h3>
                      <p className={`text-[10px] font-bold ${stat.change.startsWith('+') ? 'text-[#107C10]' : 'text-[#D13438]'}`}>
                        {stat.change} <span className="text-[#A19F9D]">vs last mo</span>
                      </p>
                    </div>
                  </div>
                  <div className="h-12 w-12 rounded-2xl flex items-center justify-center bg-[#F8F8F8] group-hover:scale-110 transition-transform">
                    <stat.icon className="h-6 w-6" style={{ color: stat.color }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Invoices List */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-sm bg-white">
            <CardHeader className="flex flex-row items-center justify-between border-b border-[#F3F2F1] px-6 py-4">
              <div className="flex items-center gap-6">
                <CardTitle className="text-[11px] font-black uppercase tracking-widest text-[#242424]">Active Claims & Invoices</CardTitle>
                <div className="flex bg-[#F3F2F1] p-1 rounded-lg">
                  {['all', 'pending', 'paid'].map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab as any)}
                      className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-tight transition-all ${activeTab === tab ? 'bg-white text-[#0078D4] shadow-sm' : 'text-[#616161] hover:text-[#242424]'}`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>
              <div className="relative w-48">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#A19F9D]" />
                <Input 
                  placeholder="SEARCH ID..." 
                  className="h-8 bg-[#F8F8F8] border-none rounded-lg pl-8 text-[11px] font-bold uppercase placeholder:text-[#A19F9D]"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                <div className="divide-y divide-[#F3F2F1]">
                  {invoices.length === 0 && (
                    <div className="py-20 flex flex-col items-center opacity-30">
                      <FileText className="h-12 w-12 mb-4" />
                      <p className="text-xs font-black uppercase tracking-widest">No matching records</p>
                    </div>
                  )}
                  {invoices.map((inv) => (
                    <div key={inv.id} className="p-4 hover:bg-[#F9F9F9] transition-colors group cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-xl bg-[#F0F0F0] flex items-center justify-center font-black text-[#A19F9D] text-[10px]">
                            {inv.patientId.slice(0, 3).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-[13px] font-black text-[#242424]">#{inv.id.slice(-8).toUpperCase()}</h4>
                              <Badge variant="outline" className={`text-[9px] font-black uppercase px-2 py-0 h-4 ${
                                inv.status === 'paid' ? 'bg-[#DFF6DD] text-[#107C10] border-[#107C10]/10' :
                                inv.status === 'overdue' ? 'bg-[#FDE7E9] text-[#D13438] border-[#D13438]/10' :
                                'bg-[#FFF4CE] text-[#794500] border-[#794500]/10'
                              }`}>
                                {inv.status}
                              </Badge>
                            </div>
                            <p className="text-[11px] font-medium text-[#616161]">Identifier: <span className="font-bold text-[#242424]">{inv.patientId}</span></p>
                          </div>
                        </div>
                        <div className="flex items-center gap-8">
                          <div className="text-right">
                            <p className="text-[13px] font-black text-[#242424]">${parseFloat(inv.totalAmount).toLocaleString()}</p>
                            <p className="text-[10px] font-bold text-[#A19F9D] uppercase tracking-tight flex items-center justify-end gap-1">
                               <Clock className="h-3 w-3" />
                               Due {new Date(inv.dueDate).toLocaleDateString()}
                            </p>
                          </div>
                          <button className="h-8 w-8 rounded-lg hover:bg-[#EDEBE9] flex items-center justify-center text-[#616161] transition-colors">
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: Recent Charges */}
        <div className="space-y-6">
          <Card className="border-none shadow-sm bg-white overflow-hidden">
            <CardHeader className="bg-[#8764B8] text-white p-6">
              <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em]">Latest Charge Captures</CardTitle>
              <p className="text-[10px] font-medium text-white/70 mt-1 uppercase tracking-wider">Sync with Clinical module</p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-[#F3F2F1]">
                {recentCharges.map((charge, i) => (
                  <div key={charge.id} className="p-4 flex items-center justify-between hover:bg-[#F9FCFF] transition-colors animate-in fade-in slide-in-from-right-4" style={{ animationDelay: `${i * 100}ms` }}>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-[#8764B8] underline tracking-tighter uppercase">{charge.code}</span>
                        <p className="text-[12px] font-black text-[#242424] line-clamp-1">{charge.description}</p>
                      </div>
                      <p className="text-[10px] font-bold text-[#A19F9D] uppercase tracking-tight">ID: {charge.patientId}</p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <p className="text-xs font-black text-[#107C10] shadow-glow-green">${parseFloat(charge.amount).toFixed(2)}</p>
                      <CheckCircle2 className="h-3 w-3 text-[#107C10] opacity-50" />
                    </div>
                  </div>
                ))}
                {recentCharges.length === 0 && (
                  <div className="p-10 text-center opacity-30 flex flex-col items-center">
                    <Activity className="h-10 w-10 mb-2" />
                    <p className="text-[10px] font-black uppercase tracking-widest leading-none">Awaiting Captures</p>
                  </div>
                )}
              </div>
              <div className="p-4 bg-[#F8F8F8] border-t border-[#F3F2F1]">
                 <Button variant="ghost" className="w-full h-8 text-[10px] font-black uppercase tracking-wider text-[#0078D4] hover:bg-[#DEECF9]">
                    View all captures
                 </Button>
              </div>
            </CardContent>
          </Card>

          {/* Verification Status */}
          <Card className="border-none shadow-sm bg-[#F3F9FD] border-l-4 border-[#0078D4]">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-8 w-8 rounded-lg bg-[#0078D4] flex items-center justify-center text-white">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-[11px] font-black text-[#242424] uppercase tracking-widest">Eligibility Engine</h4>
                  <p className="text-[10px] font-bold text-[#0078D4] uppercase">Live Verification Active</p>
                </div>
              </div>
              <div className="space-y-3">
                 <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-[#616161]">Self-Pay Queue</span>
                    <span className="font-black text-[#242424]">14</span>
                 </div>
                 <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-[#616161]">Pending Auth</span>
                    <span className="font-black text-[#242424]">08</span>
                 </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
