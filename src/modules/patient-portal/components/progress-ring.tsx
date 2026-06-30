import { motion } from "motion/react";

interface ProgressRingProps {
  label: string;
  value: number;
  color: string;
  size?: number;
}

export default function ProgressRing({ label, value, color, size = 120 }: ProgressRingProps) {
  const radius = size * 0.4;
  const stroke = size * 0.08;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-white/60 rounded-2xl border border-slate-100 shadow-xs transition-all duration-300 hover:shadow-md">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          height={size}
          width={size}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            stroke="#f1f5f9"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={size / 2}
            cy={size / 2}
          />
          {/* Animated Foreground circle */}
          <motion.circle
            stroke={color}
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={circumference + " " + circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: "easeOut" }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={size / 2}
            cy={size / 2}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center font-sans">
          <span className="text-xl font-black text-slate-800 tracking-tight">{value}%</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
        </div>
      </div>
    </div>
  );
}
