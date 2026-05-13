import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, Shield, Heart, MessageSquare, ChevronRight, 
  Calendar, CheckCircle2, Star, UserCheck, Activity,
  Stethoscope, Pill, TrendingUp, Sparkles, Zap
} from 'lucide-react';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { useQueryModel } from '../../store/eventStore';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { ScrollArea } from '../../components/ui/scroll-area';
import { Avatar } from '../dashboard/components/DashboardUI';
import { transition } from '../../lib/motion';

export function PatientSupportEcosystem() {
  const { userProfile } = useCurrentUser();
  const { patients, appointments, vitals } = useQueryModel();

  const myData = useMemo(() => {
    if (!userProfile?.id) return null;
    return patients[userProfile.id];
  }, [userProfile?.id, patients]);

  const recentInteractions = useMemo(() => {
    if (!userProfile?.id) return [];
    
    // Combine appointments and vital updates as "Interactions"
    const patientAppointments = Object.values(appointments)
      .filter(a => a.patientId === userProfile.id && a.status === 'completed')
      .map(a => ({
        id: a.id,
        type: 'visit',
        title: a.visitType === 'telehealth' ? 'Virtual Consultation' : 'In-Clinic Visit',
        date: new Date(a.time),
        outcome: a.reason || 'General Follow-up',
        icon: Stethoscope,
        color: '#0078D4'
      }));

    const patientVitals = (vitals[userProfile.id] || [])
      .map((v, i) => ({
        id: `vital-${i}`,
        type: 'vitals',
        title: 'Vitals Assessment',
        date: new Date(v.timestamp),
        outcome: `BP: ${v.bp} · HR: ${v.hr} bpm · SpO2: ${v.spo2}%`,
        icon: Activity,
        color: '#107C10'
      }));

    return [...patientAppointments, ...patientVitals]
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 10);
  }, [userProfile?.id, appointments, vitals]);

  if (!myData) return null;

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <p className="text-[10px] font-black text-[#A19F9D] uppercase tracking-[0.2em]">Connected to Care Team</p>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-[#1A1A1A] flex items-center gap-3">
            My Support <span className="text-[#0078D4]">Ecosystem</span>
          </h1>
          <p className="text-sm text-[#757370] font-medium mt-1">
            Your personalized circle of health professionals and clinical outcomes.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-[#DEECF9]/30 border border-[#DEECF9] px-4 py-2.5 rounded-2xl shadow-sm">
          <Shield className="h-5 w-5 text-[#0078D4]" />
          <div>
            <p className="text-[11px] font-black text-[#0078D4] uppercase tracking-wider">Managed Care Mode</p>
            <p className="text-[10px] font-bold text-[#757370]">Active encryption & privacy on</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
        {/* LEFT: Care Team Circle */}
        <div className="lg:col-span-8 flex flex-col gap-6 min-h-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <EcosystemPillar 
              icon={Stethoscope} 
              title="Medical Leadership" 
              role="Lead Clinician"
              color="#0078D4"
              member={{ name: 'Dr. Sarah Mitchell', specialty: 'Heart Failure Specialist' }}
              lastNote="Latest review suggests adherence is improving. Continue current dosage."
            />
            <EcosystemPillar 
              icon={Heart} 
              title="Nursing Support" 
              role="Care Coordinator"
              color="#107C10"
              member={{ name: 'Nurse James Miller', specialty: 'Advanced Practice Nurse' }}
              lastNote="Courtesy call completed yesterday. Vitals are within expected ranges."
            />
            <EcosystemPillar 
              icon={Zap} 
              title="Allied Health" 
              role="Physical Therapist"
              color="#5C2D91"
              member={{ name: 'Elena Rodriguez', specialty: 'Rehabilitation lead' }}
              lastNote="Range of motion goals updated for next month's session."
            />
            <EcosystemPillar 
              icon={Sparkles} 
              title="Clinical AI" 
              role="Watchman AI"
              color="#CA5010"
              member={{ name: 'CarePlus AI', specialty: 'Real-time telemetry monitor' }}
              lastNote="Currently monitoring SpO2 and Heart Rate for anomalies."
            />
          </div>

          <Card className="flex-1 border-[#EDEBE9] shadow-sm rounded-3xl overflow-hidden bg-white flex flex-col">
            <CardHeader className="bg-[#FAFAFA] border-b border-[#EDEBE9] py-4 px-6 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-[11px] font-black uppercase tracking-widest text-[#242424] flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-[#0078D4]" />
                  Interaction Outcomes
                </CardTitle>
                <p className="text-[10px] text-[#A19F9D] font-bold uppercase mt-1 tracking-tight">Timeline of recent care events</p>
              </div>
            </CardHeader>
            <ScrollArea className="flex-1">
              <div className="p-6">
                <div className="relative border-l-2 border-[#F3F2F1] ml-3 pl-8 space-y-8 pb-4">
                  {recentInteractions.map((item, idx) => (
                    <motion.div 
                      key={item.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ ...transition.entrance, delay: idx * 0.05 }}
                      className="relative"
                    >
                      {/* Timeline Dot */}
                      <div 
                        className="absolute -left-[41px] top-1.5 h-6 w-6 rounded-full border-4 border-white flex items-center justify-center shadow-sm"
                        style={{ backgroundColor: item.color }}
                      >
                        <item.icon className="h-2.5 w-2.5 text-white" />
                      </div>

                      <div className="bg-[#FAFAFA] border border-[#EDEBE9] rounded-2xl p-4 hover:border-[#0078D4]/20 transition-all group">
                        <div className="flex items-center justify-between gap-4 mb-2">
                          <h4 className="text-[13px] font-black text-[#242424] group-hover:text-[#0078D4] transition-colors">{item.title}</h4>
                          <span className="text-[10px] font-black text-[#A19F9D] uppercase tracking-tighter truncate">
                            {item.date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                        <div className="flex items-start gap-2 bg-white/50 border border-[#EDEBE9] rounded-xl p-3">
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0 mt-0.5" />
                          <p className="text-[12px] text-[#444441] font-medium italic leading-relaxed">
                            "{item.outcome}"
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </ScrollArea>
          </Card>
        </div>

        {/* RIGHT: Notifications & Resources */}
        <div className="lg:col-span-4 flex flex-col gap-6">
           <Card className="border-[#EDEBE9] shadow-sm rounded-3xl overflow-hidden bg-[#242424] text-white">
            <CardHeader className="py-6 px-6">
              <CardTitle className="text-[11px] font-black uppercase tracking-widest text-[#0078D4]">Next Milestone</CardTitle>
              <h3 className="text-xl font-black mt-2">Comprehensive Discharge Review</h3>
              <p className="text-[11px] opacity-60 font-bold uppercase tracking-tight mt-1">Scheduled for June 12, 2026</p>
            </CardHeader>
            <CardContent className="px-6 pb-8">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-amber-400" />
                  <span className="text-[11px] font-bold opacity-80 uppercase tracking-tight">Requirement Pending</span>
                </div>
                <p className="text-sm font-medium leading-relaxed italic opacity-90">
                  "Ensure your 24h vitals log is complete 48 hours prior to this session to enable AI predictive scoring."
                </p>
              </div>
              <button className="w-full mt-6 py-3 bg-[#0078D4] hover:bg-[#005A9E] rounded-xl font-black text-[11px] uppercase tracking-[0.15em] transition-all flex items-center justify-center gap-2">
                Sync My Records <ChevronRight className="h-4 w-4" />
              </button>
            </CardContent>
          </Card>

          <Card className="border-[#EDEBE9] shadow-sm rounded-3xl overflow-hidden bg-white">
            <CardHeader className="py-4 border-b border-[#F3F2F1]">
              <CardTitle className="text-[11px] font-black uppercase tracking-widest text-[#242424]">Care Resources</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              {[
                { title: 'Understanding Your ECG', type: 'Guide', time: '12 min read' },
                { title: 'Medication Adherence FAQ', type: 'Support', time: '5 min' },
                { title: 'Dietary Path Protocols', type: 'Nutrition', time: 'SOP Hub' },
              ].map((res, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-2xl hover:bg-[#FAFAFA] cursor-pointer group border border-transparent hover:border-[#EDEBE9]">
                  <div className="min-w-0">
                    <p className="text-[12px] font-bold text-[#242424] truncate group-hover:text-[#0078D4] transition-colors">{res.title}</p>
                    <p className="text-[10px] text-[#A19F9D] font-bold uppercase mt-0.5">{res.type} · {res.time}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[#A19F9D] group-hover:text-[#0078D4]" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function EcosystemPillar({ icon: Icon, title, role, color, member, lastNote }: any) {
  return (
    <Card className="border-[#EDEBE9] shadow-sm rounded-3xl overflow-hidden bg-white group hover:shadow-md transition-all">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className={`h-10 w-10 rounded-2xl flex items-center justify-center text-white`} style={{ background: color }}>
            <Icon className="h-5 w-5" />
          </div>
          <Badge className="bg-slate-100 text-[#616161] border-none text-[9px] font-black uppercase tracking-tight">Active</Badge>
        </div>
        
        <p className="text-[10px] font-black text-[#A19F9D] uppercase tracking-[0.15em] mb-1">{role}</p>
        <h3 className="text-sm font-black text-[#242424] group-hover:text-[#0078D4] transition-colors">{member.name}</h3>
        <p className="text-[11px] text-[#757370] italic">{member.specialty}</p>

        <div className="mt-4 pt-4 border-t border-[#F3F2F1]">
           <div className="flex items-start gap-2">
            <MessageSquare className="h-3 w-3 text-[#A19F9D] shrink-0 mt-0.5" />
            <p className="text-[10px] text-[#757370] leading-tight line-clamp-2">
              <span className="font-bold text-[#242424]">Outlook:</span> {lastNote}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
