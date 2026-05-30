import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { 
  Smile, 
  MapPin, 
  Clock, 
  Flame, 
  Compass, 
  Sparkles, 
  Users, 
  CheckCircle,
  CalendarCheck2,
  ChevronRight,
  Info 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { transition } from '../../../lib/motion';

interface WellnessClass {
  id: string;
  title: string;
  category: 'nutrition' | 'mobility' | 'mindfulness';
  time: string;
  date: string;
  duration: string;
  instructor: string;
  instructorSpecialty: string;
  room: string;
  totalSeats: number;
  availableSeats: number;
  description: string;
  intensityLevel: 'Gentle' | 'Moderate' | 'Educational';
}

const PRESET_CLASSES: WellnessClass[] = [
  {
    id: 'class-1',
    title: 'Nutritional Coaching for Type 2 Diabetes',
    category: 'nutrition',
    time: '2:00 PM - 3:00 PM',
    date: 'Wednesday, June 3',
    duration: '60 mins',
    instructor: 'Jane Doe',
    instructorSpecialty: 'Registered Dietitian',
    room: 'Allied Wellness Suite A',
    totalSeats: 15,
    availableSeats: 5,
    description: 'Learn physiological meal planning, low-index carbohydrate alternatives, and continuous glucose monitoring trends.',
    intensityLevel: 'Educational'
  },
  {
    id: 'class-2',
    title: 'Functional Resistance & Metabolic Recovery',
    category: 'mobility',
    time: '10:00 AM - 11:00 AM',
    date: 'Thursday, June 4',
    duration: '60 mins',
    instructor: 'Dr. Marcus Vance',
    instructorSpecialty: 'Sports Physiologist',
    room: 'Clinical Gym 1',
    totalSeats: 10,
    availableSeats: 3,
    description: 'Scientifically calibrated, low-resistance exercise circuits optimized for patients undergoing hormone correction or lifestyle improvements.',
    intensityLevel: 'Moderate'
  },
  {
    id: 'class-3',
    title: 'Mindfulness & Vagus Nerve Stimulation',
    category: 'mindfulness',
    time: '4:00 PM - 5:00 PM',
    date: 'Friday, June 5',
    duration: '60 mins',
    instructor: 'Dr. James Wilson',
    instructorSpecialty: 'Internal Medicine',
    room: 'Digital Telehealth Suite',
    totalSeats: 50,
    availableSeats: 34,
    description: 'Evidence-based cognitive breathing methodologies designed to regulate cortisol levels, PCOS anxiety symptoms, and sleep patterns.',
    intensityLevel: 'Gentle'
  },
  {
    id: 'class-4',
    title: 'Carbohydrate Counting and Label Mastery',
    category: 'nutrition',
    time: '1:00 PM - 2:00 PM',
    date: 'Monday, June 8',
    duration: '60 mins',
    instructor: 'Jane Doe',
    instructorSpecialty: 'Registered Dietitian',
    room: 'Allied Wellness Suite A',
    totalSeats: 20,
    availableSeats: 12,
    description: 'Hands-on clinical guide to deciphering serving labels, estimating net carbs, and tracking nutrition using smart logs.',
    intensityLevel: 'Educational'
  },
  {
    id: 'class-5',
    title: 'Postures and Yoga for PCOS Management',
    category: 'mobility',
    time: '9:00 AM - 10:00 AM',
    date: 'Tuesday, June 9',
    duration: '60 mins',
    instructor: 'Aria Sterling',
    instructorSpecialty: 'Allied Yoga Therapist',
    room: 'Multipurpose Activity Room 2',
    totalSeats: 12,
    availableSeats: 4,
    description: 'Gentle somatic stress-relief poses targeting endocrine system balance, dynamic blood circulation, and core resilience.',
    intensityLevel: 'Gentle'
  },
  {
    id: 'class-6',
    title: 'MBSR (Mindfulness-Based Stress Reduction)',
    category: 'mindfulness',
    time: '6:00 PM - 7:30 PM',
    date: 'Wednesday, June 10',
    duration: '90 mins',
    instructor: 'Dr. James Wilson',
    instructorSpecialty: 'Internal Medicine',
    room: 'Digital Telehealth Suite',
    totalSeats: 100,
    availableSeats: 72,
    description: 'Formal clinical seminar reviewing somatic neurological responses to stress and practical tools for everyday cognitive restoration.',
    intensityLevel: 'Educational'
  }
];

export function WellnessClasses() {
  const [activeCategory, setActiveCategory] = useState<'all' | 'nutrition' | 'mobility' | 'mindfulness'>('all');
  const [reservedClassIds, setReservedClassIds] = useState<string[]>([]);
  const [successAnimationId, setSuccessAnimationId] = useState<string | null>(null);

  const filteredClasses = useMemo(() => {
    if (activeCategory === 'all') return PRESET_CLASSES;
    return PRESET_CLASSES.filter(c => c.category === activeCategory);
  }, [activeCategory]);

  const handleToggleBooking = (id: string) => {
    if (reservedClassIds.includes(id)) {
      setReservedClassIds(prev => prev.filter(item => item !== id));
    } else {
      setReservedClassIds(prev => [...prev, id]);
      setSuccessAnimationId(id);
      setTimeout(() => setSuccessAnimationId(null), 1500);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* Intro section */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Compass className="h-5 w-5 text-blue-600 animate-pulse" />
              Community Wellness & Clinical Seminars
            </h2>
            <CardDescription className="text-xs">
              Sign up for clinician-led wellness programs, nutrition audits, and stress reduction workshops
            </CardDescription>
          </div>
          <div>
            <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 font-mono text-xs">
              {reservedClassIds.length} Scheduled Reservations
            </Badge>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex flex-wrap gap-2 mt-6 border-t border-slate-100 pt-4">
          {[
            { id: 'all', label: 'All Seminars', count: PRESET_CLASSES.length },
            { id: 'nutrition', label: '🍏 Nutritional Audits & Classes', count: PRESET_CLASSES.filter(c => c.category === 'nutrition').length },
            { id: 'mobility', label: '🏃‍♂️ Mobility & Recovery', count: PRESET_CLASSES.filter(c => c.category === 'mobility').length },
            { id: 'mindfulness', label: '🧠 Mindfulness & Stress', count: PRESET_CLASSES.filter(c => c.category === 'mindfulness').length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 border cursor-pointer ${
                activeCategory === tab.id
                  ? 'bg-[#0078D4] text-white border-[#0078D4] shadow'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeCategory === tab.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Class lists (Bento / High-Density Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredClasses.map((item, idx) => {
            const isBooked = reservedClassIds.includes(item.id);
            const isAnimating = successAnimationId === item.id;
            const updatedAvailable = isBooked ? item.availableSeats - 1 : item.availableSeats;

            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, delay: idx * 0.05 }}
                className="group bg-white border border-slate-200 rounded-xl hover:border-blue-500/50 hover:shadow-md transition-all flex flex-col justify-between overflow-hidden relative"
              >
                {/* Visual Accent */}
                <div className={`h-1.5 w-full ${
                  item.category === 'nutrition' ? 'bg-emerald-500' :
                  item.category === 'mobility' ? 'bg-amber-500' : 'bg-purple-500'
                }`} />

                <div className="p-5 flex-1 space-y-4">
                  {/* Badge & Intensity */}
                  <div className="flex items-center justify-between">
                    <Badge className={`text-[10px] font-bold uppercase tracking-wider ${
                      item.intensityLevel === 'Gentle' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                      item.intensityLevel === 'Moderate' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                      'bg-indigo-50 text-indigo-700 border-indigo-100'
                    }`}>
                      {item.intensityLevel} Focus
                    </Badge>

                    <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                      <Users className="h-3.5 w-3.5" />
                      <span>{updatedAvailable}/{item.totalSeats} seats left</span>
                    </div>
                  </div>

                  {/* Class details */}
                  <div className="space-y-1.5">
                    <h3 className="font-bold text-slate-900 group-hover:text-[#0078D4] transition-colors leading-tight text-sm">
                      {item.title}
                    </h3>
                    <p className="text-slate-500 text-xs leading-relaxed line-clamp-2">
                      {item.description}
                    </p>
                  </div>

                  {/* Instructor detail card */}
                  <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5 flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-full bg-blue-100 flex items-center justify-center font-black text-[#0078D4] text-[10px]">
                      {item.instructor[0]}
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-800 block leading-tight">{item.instructor}</span>
                      <span className="text-[9px] text-[#0078D4] block leading-none font-bold uppercase">{item.instructorSpecialty}</span>
                    </div>
                  </div>

                  {/* Location & Time specs */}
                  <div className="space-y-1 text-xs font-mono text-slate-500 border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>{item.date} • {item.time} ({item.duration})</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{item.room}</span>
                    </div>
                  </div>
                </div>

                {/* Booking interaction panel */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  {isBooked ? (
                    <button
                      onClick={() => handleToggleBooking(item.id)}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <CheckCircle className="h-4 w-4 animate-bounce" />
                      Reserved (Remove Spot)
                    </button>
                  ) : (
                    <button
                      onClick={() => handleToggleBooking(item.id)}
                      disabled={updatedAvailable <= 0}
                      className={`w-full py-2 font-bold text-xs rounded-lg flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                        updatedAvailable <= 0
                          ? 'bg-slate-200 text-slate-500 border-slate-200 cursor-not-allowed'
                          : 'bg-[#0078D4] text-white border-[#0078D4] hover:bg-blue-600 hover:shadow-sm'
                      }`}
                    >
                      <CalendarCheck2 className="h-4 w-4" />
                      {updatedAvailable <= 0 ? 'Fully Booked' : 'Reserve Spot'}
                    </button>
                  )}
                </div>

                {/* Confetti Reservation Feedback microanimation overlay */}
                {isAnimating && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-[#0078D4]/90 backdrop-blur-sm flex flex-col items-center justify-center text-white z-10"
                  >
                    <Sparkles className="h-10 w-10 text-amber-300 animate-spin" />
                    <span className="text-sm font-black mt-2 tracking-wider uppercase">Spot Secured!</span>
                    <span className="text-[10px] text-zinc-100 mt-1">Calendar invitation sent</span>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3">
        <Info className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
        <p className="text-[11px] text-slate-500 leading-relaxed">
          <strong>Registration Terms:</strong> Selected classes are strictly HIPAA compliant and curated for therapeutic education. All bookings register in the offline ledger automatically, and any clinical updates write directly to the audit logs.
        </p>
      </div>

    </div>
  );
}
