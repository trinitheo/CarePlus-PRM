import { useState } from 'react';
import { useCommandDispatcher, Patient, ClinicalIntake } from '../../store/eventStore';
import { savePatient, saveClinicalIntake } from '../../services/clinicalFirestoreService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../components/ui/dialog';
import { Checkbox } from '../../components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { CheckCircle2, User, Phone, Mail, MapPin, Database, ChevronRight, ChevronLeft, Save, ClipboardList, Stethoscope, FileText, Heart, Home, Activity, PlusCircle, Search, Trash2, Calendar as CalendarIcon, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface RegistrationFlowProps {
  onComplete: (id: string) => void;
  onCancel: () => void;
}

export function RegistrationFlow({ onComplete, onCancel }: RegistrationFlowProps) {
  const dispatch = useCommandDispatcher();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<Patient>>({
    name: '',
    dob: '',
    mrn: `MRN-${Math.floor(100000 + Math.random() * 900000)}`,
    gender: '',
    email: '',
    phone: '',
    address: '',
    status: 'active'
  });

  // Structured state for complex history inputs
  const [medicalConditions, setMedicalConditions] = useState<string[]>([]);
  const [surgicalHistory, setSurgicalHistory] = useState<{procedure: string, date: string}[]>([]);
  const [allergiesList, setAllergiesList] = useState<{allergen: string, reaction: string}[]>([]);
  const [medicationsList, setMedicationsList] = useState<{name: string, dose: string, route: string, frequency: string}[]>([]);
  const [familyHistoryList, setFamilyHistoryList] = useState<{relation: string, condition: string}[]>([]);
  
  const [socialHistoryData, setSocialHistoryData] = useState({
    smokingStatus: '',
    alcoholConsumption: '',
    occupation: '',
    livingSituation: ''
  });

  const [rosData, setRosData] = useState<Record<string, string[]>>({
    General: [],
    Skin: [],
    HEENT: [],
    Cardiovascular: [],
    Respiratory: [],
    Gastrointestinal: [],
    Genitourinary: [],
    Musculoskeletal: [],
    Neurological: [],
    Endocrine: [],
    Psychiatric: []
  });

  const [intakeData, setIntakeData] = useState<Partial<ClinicalIntake>>({
    chiefComplaint: '',
    historyOfPresentIllness: '',
    medicalHistory: '',
    surgicalHistory: '',
    familyHistory: '',
    socialHistory: '',
    immunizations: '',
    hospitalizations: '',
    reviewOfSystems: '',
    medications: '',
    allergies: ''
  });

  const [isSymptomModalOpen, setIsSymptomModalOpen] = useState(false);
  const [symptomForm, setSymptomForm] = useState({
    onset: '',
    severity: '',
    location: ''
  });

  // State for the temporary inputs in lists
  const [tempSurgical, setTempSurgical] = useState({ procedure: '', date: '' });
  const [tempAllergy, setTempAllergy] = useState({ allergen: '', reaction: '' });
  const [tempMed, setTempMed] = useState({ name: '', dose: '', route: '', frequency: '' });
  const [tempFamily, setTempFamily] = useState({ relation: '', condition: '' });
  const [conditionSearch, setConditionSearch] = useState('');

  const rosCategories = {
    General: ['Fever', 'Chills', 'Fatigue', 'Unexplained Weight Loss/Gain'],
    Skin: ['Rash', 'Itching', 'Moles changing', 'New lumps'],
    HEENT: ['Headaches', 'Vision changes', 'Earache', 'Hearing changes', 'Nasal congestion', 'Sore throat', 'Swallowing difficulty'],
    Cardiovascular: ['Chest pain', 'Shortness of breath with activity', 'Palpitations', 'Swelling in legs'],
    Respiratory: ['Cough', 'Wheezing', 'Shortness of breath', 'Sputum production'],
    Gastrointestinal: ['Nausea', 'Vomiting', 'Diarrhea', 'Constipation', 'Abdominal pain', 'Heartburn', 'Blood in stool'],
    Genitourinary: ['Painful urination', 'Frequent urination', 'Blood in urine', 'Incontinence'],
    Musculoskeletal: ['Joint pain', 'Muscle pain', 'Back pain', 'Stiffness', 'Swelling in joints'],
    Neurological: ['Numbness', 'Tingling', 'Weakness', 'Dizziness', 'Faintness', 'Seizures', 'Tremors'],
    Endocrine: ['Increased thirst', 'Increased hunger', 'Frequent urination', 'Heat/cold intolerance'],
    Psychiatric: ['Depression', 'Anxiety', 'Sleep problems', 'Mood changes']
  };

  const handleAddSurgical = () => {
    if (tempSurgical.procedure) {
      setSurgicalHistory([...surgicalHistory, tempSurgical]);
      setTempSurgical({ procedure: '', date: '' });
    }
  };

  const handleAddAllergy = () => {
    if (tempAllergy.allergen) {
      setAllergiesList([...allergiesList, tempAllergy]);
      setTempAllergy({ allergen: '', reaction: '' });
    }
  };

  const handleAddMed = () => {
    if (tempMed.name) {
      setMedicationsList([...medicationsList, tempMed]);
      setTempMed({ name: '', dose: '', route: '', frequency: '' });
    }
  };

  const handleAddFamily = () => {
    if (tempFamily.condition) {
      setFamilyHistoryList([...familyHistoryList, tempFamily]);
      setTempFamily({ relation: '', condition: '' });
    }
  };

  const toggleRos = (category: string, symptom: string) => {
    const current = rosData[category] || [];
    const updated = current.includes(symptom)
      ? current.filter(s => s !== symptom)
      : [...current, symptom];
    setRosData({ ...rosData, [category]: updated });
  };

  const handleAddSymptom = () => {
    const symptomSummary = `[SYMPTOM] Location: ${symptomForm.location || 'N/A'}, Severity: ${symptomForm.severity || 'N/A'}, Onset: ${symptomForm.onset || 'N/A'}.\n`;
    setIntakeData({
      ...intakeData,
      historyOfPresentIllness: (intakeData.historyOfPresentIllness || '') + symptomSummary
    });
    setSymptomForm({ onset: '', severity: '', location: '' });
    setIsSymptomModalOpen(false);
  };

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const handleSubmit = async () => {
    const newId = `p-${Date.now()}`;
    const intakeId = `intake-${Date.now()}`;
    const patientRecord = { ...formData, id: newId } as Patient;
    
    // Format structured data into strings for the event store
    const formattedIntake = {
      ...intakeData,
      id: intakeId,
      patientId: newId,
      medicalHistory: medicalConditions.join(', '),
      surgicalHistory: surgicalHistory.map(s => `${s.procedure} (${s.date})`).join('; '),
      familyHistory: familyHistoryList.map(f => `${f.relation}: ${f.condition}`).join('; '),
      socialHistory: `Smoking: ${socialHistoryData.smokingStatus}, Alcohol: ${socialHistoryData.alcoholConsumption}, Occupation: ${socialHistoryData.occupation}, Living: ${socialHistoryData.livingSituation}`,
      medications: medicationsList.map(m => `${m.name} ${m.dose} ${m.route} ${m.frequency}`).join('; '),
      allergies: allergiesList.map(a => `${a.allergen} (${a.reaction})`).join('; '),
      reviewOfSystems: (Object.entries(rosData) as [string, string[]][])
        .filter(([_, symptoms]) => symptoms.length > 0)
        .map(([cat, symptoms]) => `${cat}: ${symptoms.join(', ')}`)
        .join(' | '),
      timestamp: Date.now()
    } as ClinicalIntake;
    
    try {
      // Save to Firestore
      await savePatient(newId, patientRecord);
      await saveClinicalIntake(newId, intakeId, formattedIntake);

      // Emit Registration
      dispatch({
        type: 'PATIENT_REGISTERED',
        payload: patientRecord
      });

      // Emit Clinical Intake
      dispatch({
        type: 'CLINICAL_INTAKE_RECORDED',
        payload: formattedIntake
      });
      
      onComplete(newId);
    } catch (e) {
      console.error("Failed to save patient to cloud:", e);
      // Fallback: still complete locally if we want, or show error
      onComplete(newId);
    }
  };

  const steps = [
    { title: 'Identity', icon: User },
    { title: 'Contact', icon: Phone },
    { title: 'Symptom', icon: Stethoscope },
    { title: 'Medical', icon: Activity },
    { title: 'Clinical', icon: ClipboardList },
    { title: 'History', icon: Home },
    { title: 'ROS', icon: FileText },
    { title: 'Confirm', icon: CheckCircle2 }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {/* Step Tracker */}
      <div className="flex items-center justify-between px-4 mb-10 overflow-hidden">
        {steps.map((s, i) => {
          const isActive = step === i + 1;
          const isCompleted = step > i + 1;
          return (
            <div key={i} className="flex items-center flex-1 last:flex-none">
              <div className={`flex flex-col items-center gap-2 relative z-10`}>
                <div className={`h-8 w-8 md:h-10 md:w-10 rounded-full flex items-center justify-center transition-all duration-300 border shadow-sm ${
                  isActive || isCompleted 
                    ? 'bg-primary border-primary text-primary-foreground' 
                    : 'bg-background border-border text-muted-foreground'
                } ${isActive ? 'scale-110 shadow-lg shadow-primary/20' : 'scale-100'}`}>
                  {isCompleted ? <CheckCircle2 className="h-5 w-5 md:h-6 md:w-6" /> : <s.icon className="h-4 w-4 md:h-5 md:w-5" />}
                </div>
                <span className={`text-[9px] md:text-[11px] uppercase font-bold tracking-tight transition-all duration-300 ${
                  isActive ? 'text-foreground opacity-100' : 'text-muted-foreground opacity-40 md:opacity-100'
                } ${!isActive && 'hidden md:block'}`}>
                  {s.title}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={`h-[2px] flex-1 mx-1 md:mx-2 rounded-full transition-colors duration-500 ${isCompleted ? 'bg-primary' : 'bg-muted'}`} />
              )}
            </div>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
        >
          {step === 1 && (
            <Card className="border-border shadow-md">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Patient Identification
                </CardTitle>
                <CardDescription>Core demographic data for the Master Patient Index.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Full Legal Name</Label>
                  <Input 
                    value={formData.name} 
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Johnathan Smith"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date of Birth</Label>
                    <Input 
                      type="date"
                      value={formData.dob}
                      onChange={e => setFormData({ ...formData, dob: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Assigned MRN</Label>
                    <Input 
                      value={formData.mrn}
                      disabled
                      className="font-mono bg-muted/50"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <div className="flex gap-4">
                    {['Male', 'Female', 'Non-binary', 'Other'].map(g => (
                      <label key={g} className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="radio" 
                          name="gender" 
                          value={g} 
                          checked={formData.gender === g}
                          onChange={e => setFormData({ ...formData, gender: e.target.value })}
                          className="text-primary focus:ring-primary h-3 w-3"
                        />
                        <span className="text-sm">{g}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <Card className="border-border shadow-md">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Phone className="h-5 w-5 text-primary" />
                  Communication & Outreach
                </CardTitle>
                <CardDescription>How should we contact this patient for appointments or results?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Mail className="h-3 w-3" /> Email Address</Label>
                    <Input 
                      type="email"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      placeholder="patient@email.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Phone className="h-3 w-3" /> Primary Phone</Label>
                    <Input 
                      type="tel"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(555) 000-0000"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><MapPin className="h-3 w-3" /> Residential Address</Label>
                  <Input 
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    placeholder="123 Care St, Heal City, HC 90210"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {step === 3 && (
            <Card className="border-border shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Stethoscope className="h-5 w-5 text-primary" />
                    Clinical Presentation
                  </CardTitle>
                  <CardDescription>Why is the patient seeking care today?</CardDescription>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="gap-2 border-primary/20 hover:bg-primary/5 text-primary"
                  onClick={() => setIsSymptomModalOpen(true)}
                >
                  <PlusCircle className="h-4 w-4" />
                  Add Symptom
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Chief Complaint</Label>
                  <Input 
                    value={intakeData.chiefComplaint}
                    onChange={e => setIntakeData({ ...intakeData, chiefComplaint: e.target.value })}
                    placeholder="Briefly describe the primary reason for the visit"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>History of Present Illness (HPI)</Label>
                  <Textarea 
                    value={intakeData.historyOfPresentIllness}
                    onChange={e => setIntakeData({ ...intakeData, historyOfPresentIllness: e.target.value })}
                    placeholder="Detailed narrative of symptoms, onset, and duration..."
                    className="min-h-[120px]"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Symptom Modal */}
          <Dialog open={isSymptomModalOpen} onOpenChange={setIsSymptomModalOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add Clinical Symptom</DialogTitle>
                <DialogDescription>
                  Capture structured details to generate a primary clinical narrative.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="location">Location</Label>
                  <Input 
                    id="location" 
                    placeholder="e.g. Lower back, right temple" 
                    value={symptomForm.location}
                    onChange={e => setSymptomForm({ ...symptomForm, location: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="onset">When did it start?</Label>
                  <Input 
                    id="onset" 
                    placeholder="e.g. 2 days ago, suddenly this morning" 
                    value={symptomForm.onset}
                    onChange={e => setSymptomForm({ ...symptomForm, onset: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="severity">Severity Scale (1-10)</Label>
                  <Input 
                    id="severity" 
                    type="text"
                    placeholder="e.g. 7, mild, agonizing" 
                    value={symptomForm.severity}
                    onChange={e => setSymptomForm({ ...symptomForm, severity: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsSymptomModalOpen(false)}>Cancel</Button>
                <Button onClick={handleAddSymptom} disabled={!symptomForm.location && !symptomForm.onset}>
                  Add to HPI
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {step === 4 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
              <Card className="border-border shadow-md h-full flex flex-col">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    Medical History
                  </CardTitle>
                  <CardDescription>Documenting chronic conditions.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 flex-1">
                  <div className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="Search for conditions..." 
                        className="pl-9 h-11 bg-muted/5 border-border rounded-xl"
                        value={conditionSearch}
                        onChange={e => setConditionSearch(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && conditionSearch.trim()) {
                            if (!medicalConditions.includes(conditionSearch.trim())) {
                              setMedicalConditions([...medicalConditions, conditionSearch.trim()]);
                            }
                            setConditionSearch('');
                          }
                        }}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2 p-5 min-h-[160px] bg-muted/10 rounded-2xl border border-dashed border-border align-start items-start">
                      {medicalConditions.map(c => (
                        <div key={c} className="bg-primary/10 border border-primary/20 rounded-xl px-4 py-2 flex items-center gap-3 text-sm font-bold text-primary transition-all hover:bg-primary/20">
                          {c}
                          <X className="h-3.5 w-3.5 cursor-pointer hover:text-destructive" onClick={() => setMedicalConditions(medicalConditions.filter(m => m !== c))} />
                        </div>
                      ))}
                      {medicalConditions.length === 0 && (
                        <div className="w-full flex-1 flex flex-col items-center justify-center p-8 text-xs text-muted-foreground italic gap-4 text-center opacity-40">
                          <Activity className="h-10 w-10" />
                          No medical conditions recorded.
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border shadow-md h-full flex flex-col">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Stethoscope className="h-5 w-5 text-primary" />
                    Surgical History
                  </CardTitle>
                  <CardDescription>Previous interventions and procedures.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 flex-1">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-[1fr,120px,auto] gap-3 items-end p-5 bg-muted/10 rounded-2xl border border-border">
                      <div className="space-y-1.5 flex-1">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Procedure</Label>
                        <Input placeholder="e.g. Appendectomy" value={tempSurgical.procedure} onChange={e => setTempSurgical({ ...tempSurgical, procedure: e.target.value })} className="h-11 bg-background rounded-xl border-border" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Date</Label>
                        <Input type="text" placeholder="YYYY-MM" value={tempSurgical.date} onChange={e => setTempSurgical({ ...tempSurgical, date: e.target.value })} className="h-11 bg-background rounded-xl border-border" />
                      </div>
                      <Button size="icon" variant="default" onClick={handleAddSurgical} className="w-12 h-11 bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20 rounded-xl"><PlusCircle className="h-5 w-5" /></Button>
                    </div>
                    
                    <div className="rounded-2xl border border-border overflow-hidden bg-white shadow-sm flex-1 min-h-[160px] flex flex-col">
                      <div className="bg-muted/50 px-5 py-3 border-b border-border text-[10px] font-bold uppercase tracking-widest text-muted-foreground">DOCUMENTED PROCEDURES</div>
                      {surgicalHistory.length > 0 ? (
                        <div className="divide-y divide-border overflow-y-auto max-h-[300px] flex-1">
                          {surgicalHistory.map((s, i) => (
                            <div key={i} className="flex items-center justify-between p-5 text-sm group hover:bg-muted/10 transition-all">
                              <div>
                                <div className="font-bold text-foreground text-base tracking-tight">{s.procedure}</div>
                                <div className="text-xs text-muted-foreground font-mono mt-0.5">{s.date}</div>
                              </div>
                              <Button size="icon" variant="ghost" className="h-10 w-10 text-muted-foreground hover:text-destructive transition-all rounded-full group-hover:bg-destructive/10" onClick={() => setSurgicalHistory(surgicalHistory.filter((_, idx) => idx !== i))}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-12 text-xs text-muted-foreground italic gap-4 text-center opacity-30">
                          <ClipboardList className="h-12 w-12" />
                          Zero surgical records.
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {step === 5 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-border shadow-md flex flex-col">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Heart className="h-5 w-5 text-destructive" />
                    Allergy Protocols
                  </CardTitle>
                  <CardDescription>Managing biological sensitivities.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 flex-1">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-[1fr,1fr,auto] gap-3 items-end p-4 bg-muted/10 rounded-xl border border-border">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Allergen</Label>
                        <Input placeholder="e.g. Penicillin" value={tempAllergy.allergen} onChange={e => setTempAllergy({ ...tempAllergy, allergen: e.target.value })} className="h-10 bg-background" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Reaction</Label>
                        <Input placeholder="e.g. Hives" value={tempAllergy.reaction} onChange={e => setTempAllergy({ ...tempAllergy, reaction: e.target.value })} className="h-10 bg-background" />
                      </div>
                      <Button size="icon" variant="outline" className="w-full sm:w-16 h-10 border-destructive/30 text-destructive hover:bg-destructive/10" onClick={handleAddAllergy}>
                        <PlusCircle className="h-5 w-5" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-2 min-h-[150px]">
                      {allergiesList.map((a, i) => (
                        <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-destructive/20 bg-destructive/[0.03] shadow-sm transform transition-all hover:scale-[1.01]">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                              <Heart className="h-5 w-5 text-destructive" />
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-destructive uppercase tracking-tight">{a.allergen}</span>
                              <span className="text-xs text-destructive/70 italic">{a.reaction}</span>
                            </div>
                          </div>
                          <Button size="icon" variant="ghost" className="text-destructive/50 hover:text-destructive hover:bg-destructive/10" onClick={() => setAllergiesList(allergiesList.filter((_, idx) => idx !== i))}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      {allergiesList.length === 0 && (
                        <div className="p-12 text-center text-xs text-muted-foreground border border-dashed rounded-xl flex flex-col items-center gap-2">
                          <CheckCircle2 className="h-8 w-8 text-green-500/20" />
                          No known clinical allergies detected.
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border shadow-md flex flex-col">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <ClipboardList className="h-5 w-5 text-primary" />
                    Medication Reconciliation
                  </CardTitle>
                  <CardDescription>Active pharmaceutical inventory.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 flex-1">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 p-4 bg-muted/10 rounded-xl border border-border">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Med Name</Label>
                        <Input placeholder="Lisinopril..." value={tempMed.name} onChange={e => setTempMed({ ...tempMed, name: e.target.value })} className="h-9 bg-background" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Dose</Label>
                        <Input placeholder="10mg..." value={tempMed.dose} onChange={e => setTempMed({ ...tempMed, dose: e.target.value })} className="h-9 bg-background" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Route</Label>
                        <Input placeholder="PO..." value={tempMed.route} onChange={e => setTempMed({ ...tempMed, route: e.target.value })} className="h-9 bg-background" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Freq</Label>
                        <Input placeholder="Daily..." value={tempMed.frequency} onChange={e => setTempMed({ ...tempMed, frequency: e.target.value })} className="h-9 bg-background" />
                      </div>
                      <Button variant="default" className="col-span-2 h-10 mt-2 bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20" onClick={handleAddMed}>
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add Medication Node
                      </Button>
                    </div>

                    <div className="rounded-xl border border-border overflow-hidden bg-card shadow-sm flex-1 min-h-[250px]">
                      <div className="grid grid-cols-[1.2fr,1fr,1fr,1fr,40px] bg-muted/50 px-4 py-2.5 border-b border-border text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                        <div>Drug</div>
                        <div>Dose</div>
                        <div>Route</div>
                        <div>Freq</div>
                        <div></div>
                      </div>
                      <div className="divide-y divide-border overflow-y-auto max-h-[300px]">
                        {medicationsList.length > 0 ? medicationsList.map((m, i) => (
                          <div key={i} className="grid grid-cols-[1.2fr,1fr,1fr,1fr,40px] p-4 text-xs items-center hover:bg-muted/5 transition-colors group">
                            <div className="font-bold text-primary truncate pr-2">{m.name}</div>
                            <div className="text-muted-foreground">{m.dose}</div>
                            <div className="text-muted-foreground font-mono">{m.route}</div>
                            <div className="text-muted-foreground">{m.frequency}</div>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all font-bold" onClick={() => setMedicationsList(medicationsList.filter((_, idx) => idx !== i))}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )) : (
                          <div className="p-16 text-center text-[10px] text-muted-foreground italic uppercase tracking-widest">
                            No active medications.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {step === 6 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-border shadow-md flex flex-col">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Home className="h-5 w-5 text-primary" />
                    Family Heritage
                  </CardTitle>
                  <CardDescription>Genetic predispositions record.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 flex-1">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-[140px,1fr,auto] gap-3 items-end p-4 bg-muted/10 rounded-xl border border-border">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Relation</Label>
                        <Select value={tempFamily.relation} onValueChange={v => setTempFamily({ ...tempFamily, relation: v })}>
                          <SelectTrigger className="h-10 bg-background">
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            {['Father', 'Mother', 'Brother', 'Sister', 'Paternal Grandfather', 'Paternal Grandmother', 'Maternal Grandfather', 'Maternal Grandmother'].map(r => (
                              <SelectItem key={r} value={r}>{r}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Condition</Label>
                        <Input placeholder="Genetic conditions..." value={tempFamily.condition} onChange={e => setTempFamily({ ...tempFamily, condition: e.target.value })} className="h-10 bg-background" />
                      </div>
                      <Button size="icon" variant="secondary" onClick={handleAddFamily} className="w-full sm:w-16 h-10 shadow-sm"><PlusCircle className="h-5 w-5" /></Button>
                    </div>
                    
                    <div className="grid gap-3 max-h-[400px] overflow-y-auto pr-1">
                      {familyHistoryList.map((f, i) => (
                        <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-all group">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-primary/5 flex flex-col items-center justify-center font-bold text-primary text-[10px] uppercase border border-primary/10">
                              {f.relation.substring(0, 1)}{f.relation.includes(' ') ? f.relation.split(' ')[1].substring(0, 1) : ''}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-foreground">{f.relation}</span>
                              <span className="text-sm text-muted-foreground">{f.condition}</span>
                            </div>
                          </div>
                          <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setFamilyHistoryList(familyHistoryList.filter((_, idx) => idx !== i))}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      {familyHistoryList.length === 0 && (
                        <div className="p-16 text-center text-xs text-muted-foreground border border-dashed rounded-xl flex flex-col items-center gap-3">
                          <Database className="h-8 w-8 opacity-10" />
                          No family history mapping found.
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border shadow-md flex flex-col">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    Social Context
                  </CardTitle>
                  <CardDescription>Lifestyle and environmental dynamics.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8 flex-1">
                  <div className="grid gap-6">
                    <div className="p-6 rounded-2xl bg-muted/10 border border-border space-y-6">
                      <div className="space-y-4">
                        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground border-b border-border pb-1 block">Toxins & Exposure</Label>
                        <div className="grid grid-cols-2 gap-8">
                          <div className="space-y-3">
                            <Label className="text-[10px] font-bold text-primary">SMOKING_STATUS</Label>
                            <RadioGroup value={socialHistoryData.smokingStatus} onValueChange={v => setSocialHistoryData({ ...socialHistoryData, smokingStatus: v })} className="flex flex-col gap-2">
                              {['Never Smoked', 'Former Smoker', 'Current Smoker'].map(s => (
                                <div key={s} className="flex items-center space-x-2">
                                  <RadioGroupItem value={s} id={`smoke-${s}`} />
                                  <Label htmlFor={`smoke-${s}`} className="text-sm font-medium cursor-pointer">{s}</Label>
                                </div>
                              ))}
                            </RadioGroup>
                          </div>
                          <div className="space-y-3">
                            <Label className="text-[10px] font-bold text-primary">ALCOHOL_INTAKE</Label>
                            <RadioGroup value={socialHistoryData.alcoholConsumption} onValueChange={v => setSocialHistoryData({ ...socialHistoryData, alcoholConsumption: v })} className="flex flex-col gap-2">
                              {['None', 'Rarely', 'Socially', 'Regularly'].map(a => (
                                <div key={a} className="flex items-center space-x-2">
                                  <RadioGroupItem value={a} id={`alco-${a}`} />
                                  <Label htmlFor={`alco-${a}`} className="text-sm font-medium cursor-pointer">{a}</Label>
                                </div>
                              ))}
                            </RadioGroup>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 px-2">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground uppercase text-[10px]">Occupation Portfolio</Label>
                        <Input placeholder="Current career status..." value={socialHistoryData.occupation} onChange={e => setSocialHistoryData({ ...socialHistoryData, occupation: e.target.value })} className="h-12 bg-muted/5 border-border" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground uppercase text-[10px]">Living Environment</Label>
                        <Input placeholder="e.g. Lives with spouse in urban setting..." value={socialHistoryData.livingSituation} onChange={e => setSocialHistoryData({ ...socialHistoryData, livingSituation: e.target.value })} className="h-12 bg-muted/5 border-border" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {step === 7 && (
            <Card className="border-border shadow-xl overflow-hidden rounded-2xl border-2">
              <CardHeader className="bg-primary/5 border-b border-border pb-6">
                <CardTitle className="text-2xl flex items-center gap-3">
                  <FileText className="h-6 w-6 text-primary" />
                  Review of Systems (ROS)
                </CardTitle>
                <CardDescription className="text-base">Comprehensive screening for active clinical indicators across biological systems.</CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                  {Object.entries(rosCategories).map(([category, symptoms]) => (
                    <div key={category} className="space-y-4 p-5 rounded-2xl bg-muted/10 border border-border/50 hover:border-primary/20 transition-all">
                      <div className="flex justify-between items-center border-b border-border pb-2 mb-2">
                        <Label className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{category}</Label>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${rosData[category]?.length > 0 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                          {rosData[category]?.length || 0}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 gap-2.5">
                        {symptoms.map(s => (
                          <div key={s} className="flex items-center space-x-3 group">
                            <Checkbox 
                              id={`ros-${category}-${s}`}
                              checked={rosData[category]?.includes(s)}
                              onCheckedChange={() => toggleRos(category, s)}
                              className="h-5 w-5"
                            />
                            <Label 
                              htmlFor={`ros-${category}-${s}`} 
                              className={`text-xs font-medium leading-none cursor-pointer transition-colors ${rosData[category]?.includes(s) ? 'text-primary font-bold' : 'text-foreground/70 group-hover:text-foreground'}`}
                            >
                              {s}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {step === 8 && (
            <Card className="border-border shadow-md bg-muted/5">
              <CardHeader>
                <CardTitle className="text-xl">Knowledge Graph Projection</CardTitle>
                <CardDescription>Final validation of the integrated digital twin before event store commitment.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-card rounded-lg border border-border overflow-hidden shadow-sm">
                  <div className="bg-muted/50 px-4 py-2 border-b border-border flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground">MPI STAGING RECORD</span>
                    <Database className="h-3 w-3 text-primary" />
                  </div>
                  <div className="p-4 space-y-3 font-mono text-xs">
                    <div className="flex justify-between border-b border-border/30 pb-1">
                      <span className="text-muted-foreground uppercase text-[9px]">ID_TAG</span>
                      <span className="font-bold text-primary">{formData.mrn}</span>
                    </div>
                    <div className="flex justify-between border-b border-border/30 pb-1">
                      <span className="text-muted-foreground uppercase text-[9px]">SURNAME</span>
                      <span>{formData.name}</span>
                    </div>
                    <div className="flex justify-between border-b border-border/30 pb-1">
                      <span className="text-muted-foreground uppercase text-[9px]">COMPLAINT</span>
                      <span className="truncate max-w-[180px]">{intakeData.chiefComplaint || 'UNDEFINED'}</span>
                    </div>
                    <div className="flex justify-between border-b border-border/30 pb-1">
                      <span className="text-muted-foreground uppercase text-[9px]">RISK_PROFILE</span>
                      <span className={allergiesList.length > 0 ? "text-destructive font-bold" : "text-green-500"}>
                        {allergiesList.length > 0 ? `${allergiesList.length} ALLERGIES` : 'CLEAN'}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-border/30 pb-1">
                      <span className="text-muted-foreground uppercase text-[9px]">GRAPH_NODES</span>
                      <span>{medicationsList.length + medicalConditions.length + surgicalHistory.length} ENTITIES</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground uppercase text-[9px]">SYNC_STATUS</span>
                      <span className="text-green-500 font-bold">READY_TO_EMIT</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-3 bg-blue-50 border border-blue-100 rounded text-blue-800 text-[10px] leading-relaxed flex gap-2">
                  <Database className="h-4 w-4 shrink-0 mt-0.5 opacity-70" />
                  <span>Committing this clinical profile will trigger multiple downstream events to seed the Knowledge Graph and update the Master Patient Index.</span>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-between mt-10">
            <Button 
              variant="outline" 
              onClick={step === 1 ? onCancel : prevStep}
              className="gap-2 h-12 px-10 text-base font-medium transition-all hover:bg-muted"
            >
              <ChevronLeft className="h-5 w-5" />
              {step === 1 ? 'Cancel' : 'Previous'}
            </Button>
            
            {step < 8 ? (
              <Button onClick={nextStep} className="gap-2 h-12 px-10 text-base font-medium transition-all shadow-md" disabled={step === 1 && !formData.name}>
                Next Step
                <ChevronRight className="h-5 w-5" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} className="gap-2 bg-green-600 hover:bg-green-700 text-white h-12 px-10 text-base font-medium shadow-lg shadow-green-500/20 transition-all">
                <Save className="h-5 w-5" />
                Commit to Graph
              </Button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
