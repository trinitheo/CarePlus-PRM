import { useQueryModel, Patient } from '../../store/eventStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { useState } from 'react';
import { Search, UserPlus, ArrowRight, User, Users, Activity, FileText } from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import { ScrollArea } from '../../components/ui/scroll-area';

interface PatientExplorerProps {
  onSelectPatient: (id: string) => void;
  onAddNew: () => void;
  compact?: boolean;
  selectedId?: string | null;
}

export function PatientExplorer({ onSelectPatient, onAddNew, compact, selectedId }: PatientExplorerProps) {
  const { patients } = useQueryModel();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPatients = (Object.values(patients) as Patient[]).filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.mrn.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 h-full flex flex-col min-w-0">
      <div className={`flex flex-col gap-4 ${compact ? '' : 'md:flex-row md:items-center justify-between'}`}>
        <div className="px-1">
          <h2 className={`${compact ? 'text-lg' : 'text-2xl'} font-bold tracking-tight text-[#242424] transition-all`}>
            {compact ? 'Records' : 'Clinical Registry'}
          </h2>
          {!compact && <p className="text-[#616161] text-[13px] mt-1">Cross-enterprise medical record management.</p>}
        </div>
        {!compact && (
          <Button onClick={onAddNew} size="default" className="gap-2 shrink-0 bg-[#0078D4] hover:bg-[#006ABD] text-white rounded-md shadow-sm font-semibold text-sm">
            <UserPlus className="h-4 w-4" />
            Enroll Patient
          </Button>
        )}
      </div>

      <Card className={`flex-1 flex flex-col overflow-hidden transition-all ${compact ? 'shadow-none border-none bg-transparent' : 'border-[#EDEBE9] shadow-sm rounded-xl bg-white'}`}>
        <CardHeader className={`py-3 ${compact ? 'px-1 pb-4' : 'bg-[#FAFAFA] border-b border-[#EDEBE9] px-6'}`}>
          <div className="relative group">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${searchTerm ? 'text-[#0078D4]' : 'text-[#616161] group-focus-within:text-[#0078D4]'}`} />
            <Input 
              placeholder="Filter by name or MRN..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className={`pl-9 font-medium text-[13px] bg-white border-[#E0E0E0] focus:border-[#0078D4] focus:ring-1 focus:ring-[#0078D4]/20 transition-all ${compact ? 'rounded-md h-9' : 'rounded-md h-10'}`}
            />
          </div>
        </CardHeader>
        <CardContent className={`p-0 flex-1 overflow-hidden h-full flex flex-col ${compact ? '' : ''}`}>
          <ScrollArea className="flex-1">
            <div className={`divide-y divide-[#F0F0F0] ${compact ? '' : ''}`}>
              {filteredPatients.length === 0 ? (
                <div className="p-12 text-center text-[#616161] italic text-xs">
                  No matches found in clinical registry.
                </div>
              ) : (
                filteredPatients.map(p => {
                  const isSelected = selectedId === p.id;
                  return (
                    <div 
                      key={p.id} 
                      className={`cursor-pointer group relative flex items-center justify-between transition-all duration-100 ${
                        isSelected 
                          ? 'bg-[#F3F9FD] after:content-[""] after:absolute after:left-0 after:top-2 after:bottom-2 after:w-1 after:bg-[#0078D4] after:rounded-r-sm' 
                          : 'hover:bg-[#F5F5F5]'
                      } ${compact ? 'p-2 py-3' : 'p-4 py-3'}`}
                      onClick={() => onSelectPatient(p.id)}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-all shadow-sm border border-[#E0E0E0] overflow-hidden ${
                          isSelected ? 'bg-white border-[#0078D4]' : 'bg-[#F3F2F1]'
                        }`}>
                          {p.id === 'p-1' || p.id === 'p-2' ? (
                            <img 
                              src={p.id === 'p-1' 
                                ? "https://images.unsplash.com/photo-1594824476967-48c8b964273f?q=80&w=150&auto=format&fit=crop" 
                                : "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150&auto=format&fit=crop"
                              } 
                              alt=""
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <User className={`h-5 w-5 ${isSelected ? 'text-[#0078D4]' : 'text-[#616161]'}`} />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`font-bold truncate tracking-tight ${compact ? 'text-[13px]' : 'text-[15px]'} ${isSelected ? 'text-[#0078D4]' : 'text-[#242424]'}`}>
                              {p.name}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] font-medium text-[#616161]">
                            <span className="tabular-nums">MRN-{p.mrn}</span>
                            {isSelected && <Badge className="h-4 px-1 text-[8px] bg-[#0078D4] text-white border-none uppercase font-black">Active</Badge>}
                          </div>
                        </div>
                      </div>
                      
                      {!compact && (
                        <div className="flex items-center gap-4">
                          <div className="text-right hidden sm:block">
                            <div className="text-[9px] font-bold text-[#A19F9D] uppercase tracking-tighter">Status</div>
                            <div className="text-[10px] font-bold text-[#107C10] uppercase">Active</div>
                          </div>
                          <Button variant="ghost" size="icon" className="rounded-md h-8 w-8 text-[#BDBDBD] group-hover:text-[#0078D4] group-hover:bg-[#DEECF9]/50">
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
      
      {!compact && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 shrink-0 px-1">
          {[
            { label: 'Total Patients', value: Object.keys(patients).length, icon: Users, color: '#0078D4' },
            { label: 'Active Sessions', value: 2, icon: Activity, color: '#107C10' },
            { label: 'System Uptime', value: '99.9%', icon: FileText, color: '#845701' },
          ].map((stat, i) => (
            <div key={i} className="flex flex-col gap-1 p-1">
              <div className="text-[10px] font-bold text-[#616161] uppercase tracking-widest flex items-center gap-2">
                <stat.icon style={{ color: stat.color }} className="h-3 w-3" />
                {stat.label}
              </div>
              <div className="text-xl font-black text-[#242424] tracking-tighter tabular-nums">{stat.value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
