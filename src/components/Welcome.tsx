import React from 'react';
import { motion } from 'motion/react';
import { Shield, Sparkles, Activity, Users, ArrowRight, ChevronRight, Lock, Database } from 'lucide-react';
import { Button } from './ui/button';

interface WelcomeProps {
  onStart: () => void;
}

export function Welcome({ onStart }: WelcomeProps) {
  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-[#0078D4] selection:text-white font-sans overflow-x-hidden">
      {/* Background Atmosphere */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#0078D4]/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-[#00B7C3]/5 blur-[150px] rounded-full" />
        
        {/* Hero Background Image */}
        <motion.div 
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 0.4, scale: 1 }}
          transition={{ duration: 2, ease: "easeOut" }}
          className="absolute inset-0 z-0 flex items-center justify-center opacity-40 mix-blend-screen grayscale-[0.2]"
        >
          <img 
            src="/src/assets/images/landing_hero_1778823367426.png" 
            alt="Medical Precision"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent" />
      </div>

      {/* Navigation */}
      <nav className="relative z-20 border-b border-white/5 backdrop-blur-md bg-black/20">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-[#0078D4] rounded-xl flex items-center justify-center shadow-lg shadow-[#0078D4]/20">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-black uppercase tracking-tighter">Aequanimitas PRM</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <Button 
              onClick={onStart}
              variant="outline" 
              className="border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-full px-6 h-9 text-[11px] font-black uppercase tracking-widest"
            >
              Sign In
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10">
        <section className="pt-40 pb-20 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col items-center text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col sm:flex-row items-center gap-4 mt-32"
              >
                <Button 
                  onClick={onStart}
                  className="h-16 px-10 bg-[#0078D4] hover:bg-[#005a9e] text-white rounded-full text-sm font-black uppercase tracking-widest gap-3 shadow-2xl shadow-[#0078D4]/20 transition-all hover:scale-105 active:scale-95"
                >
                  Start Demo Experience
                  <ArrowRight className="h-5 w-5" />
                </Button>
                <Button 
                  variant="ghost" 
                  className="h-16 px-8 text-white/70 hover:text-white hover:bg-white/5 rounded-full text-sm font-black uppercase tracking-widest"
                >
                  View Documentation
                </Button>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="py-20 px-6 border-t border-white/5">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-3 gap-px bg-white/5 border border-white/5 rounded-[40px] overflow-hidden">
              <div className="p-12 bg-[#050505] space-y-6">
                <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <Activity className="h-6 w-6 text-[#0078D4]" />
                </div>
                <h3 className="text-xl font-bold uppercase tracking-tight">Clinical Real-time Engine</h3>
                <p className="text-sm text-white/50 leading-relaxed font-medium">
                  Experience instantaneous data updates across the entire care team with our event-driven CQRS architecture.
                </p>
                <div className="flex items-center gap-2 group cursor-pointer">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#0078D4]">Learn More</span>
                  <ChevronRight className="h-3 w-3 text-[#0078D4] transition-transform group-hover:translate-x-1" />
                </div>
              </div>

              <div className="p-12 bg-[#050505] space-y-6">
                <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <Lock className="h-6 w-6 text-[#00B7C3]" />
                </div>
                <h3 className="text-xl font-bold uppercase tracking-tight">Strict RBAC & Privacy</h3>
                <p className="text-sm text-white/50 leading-relaxed font-medium">
                  Dynamic permission scoping ensures each professional only sees what is necessary for their therapeutic or administrative role.
                </p>
                <div className="flex items-center gap-2 group cursor-pointer">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#00B7C3]">Learn More</span>
                  <ChevronRight className="h-3 w-3 text-[#00B7C3] transition-transform group-hover:translate-x-1" />
                </div>
              </div>

              <div className="p-12 bg-[#050505] space-y-6">
                <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <Database className="h-6 w-6 text-[#FFB900]" />
                </div>
                <h3 className="text-xl font-bold uppercase tracking-tight">MRN Clinical Registry</h3>
                <p className="text-sm text-white/50 leading-relaxed font-medium">
                  Unified clinical record management linking application users to their unique Medical Record Numbers securely.
                </p>
                <div className="flex items-center gap-2 group cursor-pointer">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#FFB900]">Learn More</span>
                  <ChevronRight className="h-3 w-3 text-[#FFB900] transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* User Roles Section */}
        <section className="py-32 px-6">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-20">
            <div className="flex-1 space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                <Users className="h-3 w-3 text-[#0078D4]" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">Multi-Persona platform</span>
              </div>
              <h2 className="text-5xl md:text-6xl font-black uppercase tracking-tighter leading-none">
                Tailored for every<br />
                <span className="text-white/40">Clinical Role</span>
              </h2>
              <p className="text-lg text-white/60 font-medium leading-relaxed">
                Whether you're a Clinician managing notes, a Nurse handling intake, or Billing overseeing revenue cycles, CarePlus adapts its interface to your specific workflows.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {['Clinicians', 'Nurses', 'Allied Health', 'Patient Engagement', 'Revenue Cycle', 'Admin'].map((role) => (
                  <div key={role} className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                    <div className="h-2 w-2 rounded-full bg-[#0078D4]" />
                    <span className="text-sm font-bold uppercase tracking-tight">{role}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-1 relative">
              <div className="aspect-square rounded-[60px] bg-gradient-to-br from-[#0078D4]/20 to-transparent border border-white/10 flex items-center justify-center p-12">
                <div className="w-full h-full rounded-[40px] bg-neutral-900 border border-white/10 shadow-2xl flex flex-col p-8 overflow-hidden relative group">
                   <div className="flex items-center justify-between mb-8">
                      <div className="h-2 w-24 rounded-full bg-white/20" />
                      <div className="h-8 w-8 rounded-lg bg-[#0078D4]/20 border border-[#0078D4]/30" />
                   </div>
                   <div className="flex-1 space-y-4">
                      <div className="h-4 w-3/4 rounded-lg bg-white/10" />
                      <div className="h-4 w-1/2 rounded-lg bg-white/10" />
                      <div className="h-32 w-full rounded-2xl bg-white/5 border border-white/10" />
                   </div>
                   {/* Decorative elements */}
                   <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[#0078D4]/20 blur-[80px] rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-20 px-6 border-t border-white/5 text-center">
          <div className="max-w-7xl mx-auto space-y-8">
             <div className="flex items-center justify-center gap-3 mb-12">
                <div className="h-8 w-8 bg-[#0078D4] rounded-lg flex items-center justify-center text-white">
                  <Shield className="h-5 w-5" />
                </div>
                <span className="text-lg font-black uppercase tracking-tighter">Aequanimitas PRM</span>
              </div>
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/30">
                © 2026 Aequanimitas Health Systems. All Rights Reserved.
              </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
