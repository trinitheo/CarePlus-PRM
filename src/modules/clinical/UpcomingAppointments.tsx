import { useQueryModel, Appointment } from '../../store/eventStore';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { ScrollArea } from '../../components/ui/scroll-area';
import { Clock, Calendar, User, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { Badge } from '../../components/ui/badge';

export function UpcomingAppointments({ patientId }: { patientId: string }) {
  const { appointments } = useQueryModel();
  
  const patientAppointments = (Object.values(appointments) as Appointment[])
    .filter(a => a.patientId === patientId)
    .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

  return (
    <Card className="flex-1 flex flex-col border-[#EDEBE9] shadow-sm rounded-lg overflow-hidden bg-white">
      <CardHeader className="py-1.5 px-2 border-b border-[#F3F2F1] bg-white shrink-0 flex flex-row items-center justify-between">
        <div className="flex flex-col">
          <CardTitle className="text-[10px] font-bold text-[#242424] flex items-center gap-2 uppercase tracking-widest opacity-80">
            <Calendar className="h-3 w-3 text-[#0078D4]" />
            Upcoming Appointments
          </CardTitle>
          <p className="text-[9px] text-[#616161] font-medium leading-none mt-0.5">Scheduled clinical encounters</p>
        </div>
      </CardHeader>

      <CardContent className="p-0 flex-1 flex flex-col min-h-0" style={{ paddingTop: '0px', marginLeft: '0px', marginTop: '-10px' }}>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-2" style={{ paddingTop: '6px', paddingBottom: '12px', marginLeft: '0px', marginTop: '0px' }}>
            {patientAppointments.map((appt, idx) => (
              <motion.div
                key={appt.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <div className="p-2 rounded-lg border border-[#EDEBE9] hover:border-[#0078D4]/30 transition-all bg-[#FAFAFA]/50 group cursor-pointer">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded bg-white border border-[#EDEBE9] flex items-center justify-center">
                        <Clock className="h-3 w-3 text-[#0078D4]" />
                      </div>
                      <span className="text-[10px] font-black text-[#242424]">
                        {new Date(appt.time).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                      <Badge variant="outline" className="text-[8px] h-4 bg-white border-[#DEECF9] text-[#0078D4] font-bold">
                        {new Date(appt.time).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                      </Badge>
                    </div>
                    <ChevronRight className="h-3 w-3 text-[#BDBDBD] group-hover:text-[#0078D4] transition-colors" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[11px] font-bold text-[#242424]">{appt.reason}</span>
                    <div className="flex items-center gap-1">
                      <User className="h-2.5 w-2.5 text-[#616161]" />
                      <span className="text-[9px] text-[#616161] font-medium">Provider ID: {appt.providerId}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            {patientAppointments.length === 0 && (
              <div className="py-8 flex flex-col items-center justify-center text-center space-y-2">
                <Calendar className="h-8 w-8 text-[#BDBDBD] opacity-30" />
                <p className="text-[10px] text-[#616161] font-medium">No appointments scheduled</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
