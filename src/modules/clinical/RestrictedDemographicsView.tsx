import React, { useState } from 'react';
import { 
  ArrowLeft, Lock, ShieldAlert, User, Phone, Mail, 
  MapPin, Calendar, Droplet, Edit2, Save, X, AlertCircle
} from 'lucide-react';
import { motion } from 'motion/react';

interface DemographicData {
  id: string;
  firstName: string;
  lastName: string;
  dob: string;
  mrn: string;
  gender: string;
  phone: string;
  email: string;
  address: string;
  bloodType: string;
  lastVisit: string;
}

interface RestrictedDemographicsViewProps {
  patient: DemographicData;
  userRole: string;
  onBackToRegistry: () => void;
  onSaveDemographics: (updatedData: DemographicData) => Promise<void>;
}

export function RestrictedDemographicsView({ 
  patient, 
  userRole, 
  onBackToRegistry,
  onSaveDemographics 
}: RestrictedDemographicsViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<DemographicData>(patient);
  const [isSaving, setIsSaving] = useState(false);

  // RBAC Matrix Check
  const canEdit = ['patient', 'front_desk', 'clinician', 'admin'].includes(userRole.toLowerCase());

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSaveDemographics(formData);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save patient demographics", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(patient); // Reset to original
    setIsEditing(false);
  };

  return (
    <div className="h-full w-full bg-[#FAFAFA] flex flex-col font-sans">
      
      {/* Top Navigation & Context */}
      <div className="p-6 border-b border-[#EDEBE9] bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div className="flex flex-col gap-4">
          <button 
            onClick={onBackToRegistry}
            className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-500 hover:text-sky-600 transition-colors w-fit cursor-pointer"
          >
            <ArrowLeft size={14} strokeWidth={3} />
            Back to Registry
          </button>
          
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-lg border border-slate-200 text-slate-500">
              <Lock size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Administrative Profile</h1>
              <p className="text-[10px] font-black uppercase tracking-widest text-rose-600 mt-1 flex items-center gap-1">
                <ShieldAlert size={12} /> Restricted View: Clinical Diagnostics Locked
              </p>
            </div>
          </div>
        </div>

        {canEdit && !isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            className="px-5 py-2.5 rounded-xl border border-[#EDEBE9] text-[11px] font-black uppercase tracking-widest text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Edit2 size={14} strokeWidth={2.5} />
            Edit Demographics
          </button>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 md:p-10">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto bg-white border border-[#EDEBE9] rounded-2xl shadow-sm overflow-hidden"
        >
          {/* Form Header */}
          <div className="p-6 border-b border-[#EDEBE9] bg-[#FAF9F8] flex justify-between items-center">
            <h3 className="text-sm font-black text-slate-900 tracking-widest uppercase flex items-center gap-2">
              <User size={16} className="text-slate-400" />
              Patient Identity & Contact
            </h3>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              MRN: {patient.mrn}
            </span>
          </div>

          {/* Form Body */}
          <div className="p-6 md:p-8 space-y-8">
            {/* Row 1: Name & DOB */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="group">
                <label className="block text-[10px] font-black uppercase tracking-widest text-[#A19F9D] mb-2 group-focus-within:text-sky-600 transition-colors">
                  First Name
                </label>
                {isEditing ? (
                  <input
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    className="w-full px-4 py-3 bg-[#FAF9F8] border border-[#EDEBE9] rounded-xl focus:ring-4 focus:ring-sky-500/10 focus:border-sky-600 transition-all text-slate-900 text-sm font-bold"
                  />
                ) : (
                  <div className="px-4 py-3 bg-slate-50 border border-transparent rounded-xl text-slate-900 text-sm font-bold">
                    {patient.firstName}
                  </div>
                )}
              </div>

              <div className="group">
                <label className="block text-[10px] font-black uppercase tracking-widest text-[#A19F9D] mb-2 group-focus-within:text-sky-600 transition-colors">
                  Last Name
                </label>
                {isEditing ? (
                  <input
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    className="w-full px-4 py-3 bg-[#FAF9F8] border border-[#EDEBE9] rounded-xl focus:ring-4 focus:ring-sky-500/10 focus:border-sky-600 transition-all text-slate-900 text-sm font-bold"
                  />
                ) : (
                  <div className="px-4 py-3 bg-slate-50 border border-transparent rounded-xl text-slate-900 text-sm font-bold">
                    {patient.lastName}
                  </div>
                )}
              </div>

              <div className="group">
                <label className="block text-[10px] font-black uppercase tracking-widest text-[#A19F9D] mb-2 group-focus-within:text-sky-600 transition-colors flex items-center gap-1.5">
                  <Calendar size={12} /> Date of Birth
                </label>
                {isEditing ? (
                  <input
                    type="date"
                    value={formData.dob}
                    onChange={(e) => setFormData({...formData, dob: e.target.value})}
                    className="w-full px-4 py-3 bg-[#FAF9F8] border border-[#EDEBE9] rounded-xl focus:ring-4 focus:ring-sky-500/10 focus:border-sky-600 transition-all text-slate-900 text-sm font-bold"
                  />
                ) : (
                  <div className="px-4 py-3 bg-slate-50 border border-transparent rounded-xl text-slate-900 text-sm font-bold">
                    {patient.dob}
                  </div>
                )}
              </div>
            </div>

            {/* Row 2: Contact Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#EDEBE9]">
              <div className="group">
                <label className="block text-[10px] font-black uppercase tracking-widest text-[#A19F9D] mb-2 group-focus-within:text-sky-600 transition-colors flex items-center gap-1.5">
                  <Phone size={12} /> Primary Phone
                </label>
                {isEditing ? (
                  <input
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-3 bg-[#FAF9F8] border border-[#EDEBE9] rounded-xl focus:ring-4 focus:ring-sky-500/10 focus:border-sky-600 transition-all text-slate-900 text-sm font-bold"
                  />
                ) : (
                  <div className="px-4 py-3 bg-slate-50 border border-transparent rounded-xl text-slate-900 text-sm font-bold">
                    {patient.phone}
                  </div>
                )}
              </div>

              <div className="group">
                <label className="block text-[10px] font-black uppercase tracking-widest text-[#A19F9D] mb-2 group-focus-within:text-sky-600 transition-colors flex items-center gap-1.5">
                  <Mail size={12} /> Email Address
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-3 bg-[#FAF9F8] border border-[#EDEBE9] rounded-xl focus:ring-4 focus:ring-sky-500/10 focus:border-sky-600 transition-all text-slate-900 text-sm font-bold"
                  />
                ) : (
                  <div className="px-4 py-3 bg-slate-50 border border-transparent rounded-xl text-slate-900 text-sm font-bold">
                    {patient.email}
                  </div>
                )}
              </div>

              <div className="group md:col-span-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-[#A19F9D] mb-2 group-focus-within:text-sky-600 transition-colors flex items-center gap-1.5">
                  <MapPin size={12} /> Mailing Address
                </label>
                {isEditing ? (
                  <input
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="w-full px-4 py-3 bg-[#FAF9F8] border border-[#EDEBE9] rounded-xl focus:ring-4 focus:ring-sky-500/10 focus:border-sky-600 transition-all text-slate-900 text-sm font-bold"
                  />
                ) : (
                  <div className="px-4 py-3 bg-slate-50 border border-transparent rounded-xl text-slate-900 text-sm font-bold">
                    {patient.address}
                  </div>
                )}
              </div>
            </div>

            {/* Row 3: Biometrics (Safe for Front Desk) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#EDEBE9]">
              <div className="group">
                <label className="block text-[10px] font-black uppercase tracking-widest text-[#A19F9D] mb-2 group-focus-within:text-sky-600 transition-colors">
                  Assigned Gender at Birth
                </label>
                {isEditing ? (
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({...formData, gender: e.target.value})}
                    className="w-full px-4 py-3 bg-[#FAF9F8] border border-[#EDEBE9] rounded-xl focus:ring-4 focus:ring-sky-500/10 focus:border-sky-600 transition-all appearance-none text-slate-900 text-sm font-bold"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other / Prefer not to say</option>
                  </select>
                ) : (
                  <div className="px-4 py-3 bg-slate-50 border border-transparent rounded-xl text-slate-900 text-sm font-bold">
                    {patient.gender === 'F' || patient.gender === 'Female' ? 'Female' : patient.gender === 'M' || patient.gender === 'Male' ? 'Male' : 'Other'}
                  </div>
                )}
              </div>

              <div className="group">
                <label className="block text-[10px] font-black uppercase tracking-widest text-[#A19F9D] mb-2 group-focus-within:text-sky-600 transition-colors flex items-center gap-1.5">
                  <Droplet size={12} /> Blood Type
                </label>
                {isEditing ? (
                  <select
                    value={formData.bloodType}
                    onChange={(e) => setFormData({...formData, bloodType: e.target.value})}
                    className="w-full px-4 py-3 bg-[#FAF9F8] border border-[#EDEBE9] rounded-xl focus:ring-4 focus:ring-sky-500/10 focus:border-sky-600 transition-all appearance-none text-slate-900 text-sm font-bold"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                ) : (
                  <div className="px-4 py-3 bg-slate-50 border border-transparent rounded-xl text-slate-900 text-sm font-bold">
                    {patient.bloodType}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Edit Actions Footer */}
          {isEditing && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 border-t border-[#EDEBE9] bg-[#FAF9F8] flex justify-end gap-3"
            >
              <button 
                onClick={handleCancel}
                disabled={isSaving}
                className="px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest text-slate-600 bg-white border border-[#EDEBE9] hover:bg-slate-50 transition-colors flex items-center gap-2 cursor-pointer"
              >
                <X size={14} strokeWidth={2.5} />
                Cancel
              </button>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="px-8 py-3 rounded-xl shadow-[0_4px_15px_rgb(14,165,233,0.15)] text-[11px] font-black uppercase tracking-widest text-white bg-sky-600 hover:bg-sky-700 hover:shadow-[0_8px_25px_rgb(14,165,233,0.25)] active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save size={14} strokeWidth={2.5} />
                )}
                Save Demographics
              </button>
            </motion.div>
          )}
        </motion.div>
        
        {/* Compliance Notice */}
        <div className="max-w-4xl mx-auto mt-6 flex items-start gap-3 p-4 bg-slate-50 border border-[#EDEBE9] rounded-xl text-slate-500">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <p className="text-[10px] font-bold uppercase tracking-widest leading-relaxed">
            HIPAA Notice: You are viewing a restricted profile based on your system role ({userRole}). Clinical, diagnostic, and financial records have been automatically redacted to comply with minimum-necessary access rules.
          </p>
        </div>
      </div>
    </div>
  );
}
