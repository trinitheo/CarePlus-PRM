import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  Award, 
  ShieldCheck, 
  Save, 
  X, 
  Camera, 
  Activity,
  AlertCircle
} from 'lucide-react';
import { motion } from 'motion/react';

export interface UserProfile {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: string;
  phone?: string;
  department?: string;
  npiNumber?: string;
  bio?: string;
  displayName?: string;
}

interface ProfileEditorProps {
  initialProfile: UserProfile;
  onSave: (updatedProfile: UserProfile) => Promise<void>;
  onCancel: () => void;
}

export function ProfileEditor({ initialProfile, onSave, onCancel }: ProfileEditorProps) {
  // Extract or initialize first & last names if they don't exist yet
  const getInitialNames = () => {
    let fName = initialProfile.firstName || '';
    let lName = initialProfile.lastName || '';
    if (!fName && !lName && initialProfile.displayName) {
      const parts = initialProfile.displayName.trim().split(/\s+/);
      fName = parts[0] || '';
      lName = parts.slice(1).join(' ') || '';
    }
    return { firstName: fName, lastName: lName };
  };

  const nameDefaults = getInitialNames();
  
  const [formData, setFormData] = useState<UserProfile>({
    ...initialProfile,
    firstName: nameDefaults.firstName,
    lastName: nameDefaults.lastName,
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess(false);

    try {
      // Reconstitute displayName
      const resolvedDisplayName = `${formData.firstName} ${formData.lastName}`.trim();
      const updated = {
        ...formData,
        displayName: resolvedDisplayName
      };
      await onSave(updated);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-full w-full bg-white p-6 md:p-12 font-sans rounded-2xl border border-[#EDEBE9] shadow-sm">
      <div className="max-w-5xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-sky-50 rounded-lg border border-sky-100">
                <User className="w-5 h-5 text-sky-600" />
              </div>
              <span className="text-[11px] font-black text-sky-600 tracking-widest uppercase">
                Provider Identity
              </span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Profile Settings</h1>
            <p className="text-[#757370] text-sm font-medium mt-1">
              Manage your clinical credentials and system preferences.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest text-slate-600 bg-slate-50 hover:bg-slate-100 transition-colors flex items-center gap-2"
            >
              <X size={16} strokeWidth={2.5} />
              Discard
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-6 py-2.5 rounded-xl shadow-[0_4px_15px_rgb(14,165,233,0.15)] text-[11px] font-black uppercase tracking-widest text-white bg-sky-600 hover:bg-sky-700 hover:shadow-[0_8px_25px_rgb(14,165,233,0.25)] active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save size={16} strokeWidth={2.5} />
              )}
              Save Changes
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left Column - Photo & Status */}
          <div className="lg:col-span-4 space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#FAF9F8] border border-[#EDEBE9] rounded-2xl p-6 text-center"
            >
              <div className="relative inline-block mb-4 group cursor-pointer">
                <div className="w-32 h-32 rounded-full bg-slate-200 border-4 border-white shadow-lg overflow-hidden flex items-center justify-center">
                  <User size={48} className="text-slate-400" />
                </div>
                <div className="absolute inset-0 bg-slate-900/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                  <Camera className="text-white w-8 h-8" />
                </div>
              </div>
              <h3 className="text-lg font-black text-slate-900">{formData.firstName} {formData.lastName}</h3>
              <p className="text-sky-600 text-[11px] font-black uppercase tracking-widest mt-1">
                {(formData.role || '').replace('_', ' ')}
              </p>
            </motion.div>

            {/* Compliance Status Card */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <ShieldCheck className="text-emerald-600 w-6 h-6" />
                <span className="text-[11px] font-black uppercase tracking-widest text-emerald-800">
                  Compliance Status
                </span>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-emerald-700 font-medium">HIPAA Training</span>
                  <span className="text-emerald-800 font-bold">Valid</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-emerald-700 font-medium">System Access</span>
                  <span className="text-emerald-800 font-bold">Level 3</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-emerald-700 font-medium">Last Login</span>
                  <span className="text-emerald-800 font-bold">Today</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column - Form Fields */}
          <div className="lg:col-span-8">
            <motion.form 
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
              onSubmit={handleSubmit}
            >
              {error && (
                <div className="flex items-start gap-3 p-4 bg-red-50 text-red-700 border border-red-100 text-sm font-bold rounded-xl">
                  <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                  <div>{error}</div>
                </div>
              )}

              {success && (
                <div className="flex items-start gap-3 p-4 bg-sky-50 text-sky-800 border border-sky-100 text-sm font-bold rounded-xl">
                  <Activity size={18} className="flex-shrink-0 mt-0.5" />
                  <div>Profile updated successfully in the system.</div>
                </div>
              )}

              {/* Personal Information */}
              <div className="bg-white border border-[#EDEBE9] rounded-2xl p-8 shadow-sm">
                <h3 className="text-sm font-black text-slate-900 tracking-widest uppercase mb-6 flex items-center gap-2">
                  <User size={16} className="text-slate-400" />
                  Personal Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="group">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-[#A19F9D] mb-2 group-focus-within:text-sky-600 transition-colors">
                      First Name
                    </label>
                    <input
                      name="firstName"
                      type="text"
                      value={formData.firstName || ''}
                      onChange={handleChange}
                      className="w-full px-4 py-3.5 bg-[#FAF9F8] border border-[#EDEBE9] rounded-xl focus:ring-4 focus:ring-sky-500/10 focus:border-sky-600 transition-all text-slate-900 text-sm font-bold"
                    />
                  </div>
                  <div className="group">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-[#A19F9D] mb-2 group-focus-within:text-sky-600 transition-colors">
                      Last Name
                    </label>
                    <input
                      name="lastName"
                      type="text"
                      value={formData.lastName || ''}
                      onChange={handleChange}
                      className="w-full px-4 py-3.5 bg-[#FAF9F8] border border-[#EDEBE9] rounded-xl focus:ring-4 focus:ring-sky-500/10 focus:border-sky-600 transition-all text-slate-900 text-sm font-bold"
                    />
                  </div>
                  <div className="group">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-[#A19F9D] mb-2 group-focus-within:text-sky-600 transition-colors">
                      Contact Email
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-sky-600 transition-colors">
                        <Mail size={16} strokeWidth={2.5} />
                      </div>
                      <input
                        name="email"
                        type="email"
                        value={formData.email || ''}
                        onChange={handleChange}
                        className="w-full pl-11 pr-4 py-3.5 bg-[#FAF9F8] border border-[#EDEBE9] rounded-xl focus:ring-4 focus:ring-sky-500/10 focus:border-sky-600 transition-all text-slate-900 text-sm font-bold"
                      />
                    </div>
                  </div>
                  <div className="group">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-[#A19F9D] mb-2 group-focus-within:text-sky-600 transition-colors">
                      Direct Phone
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-sky-600 transition-colors">
                        <Phone size={16} strokeWidth={2.5} />
                      </div>
                      <input
                        name="phone"
                        type="tel"
                        value={formData.phone || ''}
                        onChange={handleChange}
                        placeholder="(555) 000-0000"
                        className="w-full pl-11 pr-4 py-3.5 bg-[#FAF9F8] border border-[#EDEBE9] rounded-xl focus:ring-4 focus:ring-sky-500/10 focus:border-sky-600 transition-all text-slate-900 text-sm font-bold"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Professional Details */}
              <div className="bg-white border border-[#EDEBE9] rounded-2xl p-8 shadow-sm">
                <h3 className="text-sm font-black text-slate-900 tracking-widest uppercase mb-6 flex items-center gap-2">
                  <Award size={16} className="text-slate-400" />
                  Clinical & Professional
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="group">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-[#A19F9D] mb-2 group-focus-within:text-sky-600 transition-colors">
                      Department / Ward
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-sky-600 transition-colors">
                        <Building size={16} strokeWidth={2.5} />
                      </div>
                      <select
                        name="department"
                        value={formData.department || ''}
                        onChange={handleChange}
                        className="w-full pl-11 pr-4 py-3.5 bg-[#FAF9F8] border border-[#EDEBE9] rounded-xl focus:ring-4 focus:ring-sky-500/10 focus:border-sky-600 transition-all appearance-none text-slate-900 text-sm font-bold animate-none"
                      >
                        <option value="">Select Department...</option>
                        <option value="Cardiology">Cardiology</option>
                        <option value="Neurology">Neurology</option>
                        <option value="Pediatrics">Pediatrics</option>
                        <option value="Emergency">Emergency Medicine</option>
                        <option value="General Practice">General Practice</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="group">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-[#A19F9D] mb-2 group-focus-within:text-sky-600 transition-colors">
                      NPI / License Number
                    </label>
                    <input
                      name="npiNumber"
                      type="text"
                      value={formData.npiNumber || ''}
                      onChange={handleChange}
                      placeholder="e.g. 1234567890"
                      className="w-full px-4 py-3.5 bg-[#FAF9F8] border border-[#EDEBE9] rounded-xl focus:ring-4 focus:ring-sky-500/10 focus:border-sky-600 transition-all text-slate-900 text-sm font-bold"
                    />
                  </div>

                  <div className="group md:col-span-2">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-[#A19F9D] mb-2 group-focus-within:text-sky-600 transition-colors">
                      Clinical Bio / Notes
                    </label>
                    <textarea
                      name="bio"
                      value={formData.bio || ''}
                      onChange={handleChange}
                      rows={4}
                      placeholder="Brief professional background or internal notes..."
                      className="w-full px-4 py-3.5 bg-[#FAF9F8] border border-[#EDEBE9] rounded-xl focus:ring-4 focus:ring-sky-500/10 focus:border-sky-600 transition-all text-slate-900 text-sm font-medium resize-none"
                    />
                  </div>
                </div>
              </div>
            </motion.form>
          </div>
        </div>
      </div>
    </div>
  );
}
