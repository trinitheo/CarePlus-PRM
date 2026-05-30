import { useState, useEffect } from 'react';
import { Activity, Pill, Moon, Calendar, TrendingUp, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

interface AdherenceSimulatorProps {
  patientData?: any;
}

export function AdherenceSimulator({ patientData }: AdherenceSimulatorProps) {
  const baseScore = 72;
  const [medsDays, setMedsDays] = useState(4);
  const [sleepHours, setSleepHours] = useState(6);
  const [activityDays, setActivityDays] = useState(2);
  const [willAttend, setWillAttend] = useState(true);
  const [predictedScore, setPredictedScore] = useState(baseScore);

  // Simplified Prediction Engine (Mirroring JSON Framework weights)
  useEffect(() => {
    let modifier = 0;
    
    // Medication (+ up to 8 points, - up to 4 points)
    if (medsDays === 7) modifier += 8;
    else if (medsDays >= 5) modifier += 3;
    else modifier -= 4;

    // Sleep (+ up to 6 points, - up to 3 points)
    if (sleepHours >= 7 && sleepHours <= 9) modifier += 6;
    else if (sleepHours < 5) modifier -= 3;

    // Activity (+ up to 5 points)
    if (activityDays >= 4) modifier += 5;
    else if (activityDays >= 2) modifier += 2;

    // Appointments (- 5 points if missed)
    if (!willAttend) modifier -= 5;

    // Cap logic to keep score between 0 and 100
    const newScore = Math.min(Math.max(baseScore + modifier, 0), 100);
    setPredictedScore(newScore);
  }, [medsDays, sleepHours, activityDays, willAttend]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto p-6 md:p-8 space-y-8 font-sans"
    >
      <div className="mb-8">
        <h2 className="text-3xl font-medium tracking-tight text-slate-900 mb-2">Score Simulator</h2>
        <p className="text-base text-slate-600">Adjust your weekly goals below to see how they impact your overall health trajectory.</p>
      </div>

      {/* Score Readout Card */}
      <div className="bg-[#EEF3F0] rounded-[32px] p-8 flex flex-col md:flex-row items-center justify-between gap-8 border border-white shadow-sm">
        <div className="flex items-center gap-6">
          <div className="text-center">
            <span className="block text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">Current</span>
            <span className="text-4xl font-bold text-slate-800">{baseScore}</span>
          </div>
          <ArrowRight size={24} className="text-slate-400" />
          <div className="text-center">
            <span className="block text-sm font-bold text-[#7A9876] uppercase tracking-widest mb-1">Predicted</span>
            <span className="text-5xl font-black text-[#7A9876]">{predictedScore}</span>
          </div>
        </div>
        
        <div className="flex-1 bg-white p-5 rounded-2xl shadow-sm border border-[#EBEFEA] w-full md:w-auto">
          <h4 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
            <TrendingUp size={18} className="text-[#7A9876]" /> Target Goals Generated
          </h4>
          <ul className="text-sm font-medium text-slate-600 space-y-1">
            {medsDays < 7 && <li>• Take medications {7 - medsDays} more days this week.</li>}
            {sleepHours < 7 && <li>• Increase sleep duration by {7 - sleepHours} hours.</li>}
            {activityDays >= 4 && <li className="text-[#7A9876]">• Great job targeting 4+ active days!</li>}
          </ul>
        </div>
      </div>

      {/* Interactive Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Medication Slider */}
        <div className="bg-white p-6 rounded-[24px] border border-[#EBEFEA] shadow-sm">
          <label className="flex items-center gap-3 text-base font-bold text-slate-800 mb-4">
            <div className="p-2 bg-[#EEF3F0] text-[#7A9876] rounded-lg"><Pill size={20} /></div>
            Medication Adherence
          </label>
          <input 
            type="range" min="0" max="7" value={medsDays} 
            onChange={(e) => setMedsDays(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#7A9876]"
          />
          <div className="flex justify-between text-sm font-medium text-slate-500 mt-3">
            <span>0 days</span>
            <span className="font-bold text-slate-800">{medsDays} days/week</span>
          </div>
        </div>

        {/* Sleep Slider */}
        <div className="bg-white p-6 rounded-[24px] border border-[#EBEFEA] shadow-sm">
          <label className="flex items-center gap-3 text-base font-bold text-slate-800 mb-4">
            <div className="p-2 bg-[#EEF3F0] text-[#7A9876] rounded-lg"><Moon size={20} /></div>
            Average Nightly Sleep
          </label>
          <input 
            type="range" min="4" max="10" step="0.5" value={sleepHours} 
            onChange={(e) => setSleepHours(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#7A9876]"
          />
          <div className="flex justify-between text-sm font-medium text-slate-500 mt-3">
            <span>4 hrs</span>
            <span className="font-bold text-slate-800">{sleepHours} hrs/night</span>
          </div>
        </div>

        {/* Activity Slider */}
        <div className="bg-[#FFFFFF] p-6 rounded-[24px] border border-[#EBEFEA] shadow-sm">
          <label className="flex items-center gap-3 text-base font-bold text-slate-800 mb-4">
            <div className="p-2 bg-[#EEF3F0] text-[#7A9876] rounded-lg"><Activity size={20} /></div>
            Physical Activity
          </label>
          <input 
            type="range" min="0" max="7" value={activityDays} 
            onChange={(e) => setActivityDays(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#7A9876]"
          />
          <div className="flex justify-between text-sm font-medium text-slate-500 mt-3">
            <span>0 days</span>
            <span className="font-bold text-slate-800">{activityDays} days/week</span>
          </div>
        </div>

        {/* Appointment Toggle */}
        <div className="bg-white p-6 rounded-[24px] border border-[#EBEFEA] shadow-sm">
          <label className="flex items-center gap-3 text-base font-bold text-slate-800 mb-4">
            <div className="p-2 bg-[#EEF3F0] text-[#7A9876] rounded-lg"><Calendar size={20} /></div>
            Upcoming Clinical Event
          </label>
          <div className="flex gap-4 mt-2">
            <button 
              onClick={() => setWillAttend(true)}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-colors ${willAttend ? 'bg-[#7A9876] text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              I will attend
            </button>
            <button 
              onClick={() => setWillAttend(false)}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-colors ${!willAttend ? 'bg-amber-500 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              Needs Reschedule
            </button>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
