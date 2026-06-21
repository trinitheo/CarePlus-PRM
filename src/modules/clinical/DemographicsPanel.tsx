/**
 * DemographicsPanel.tsx
 * Zone 1 of 3 in the restructured patient record.
 *
 * Visible to: Clinician, Nurse, Allied Health, Front Desk, Admin.
 * NOT visible to: Billing (they get Financial zone only), Patient (own portal).
 *
 * Contains: name, MRN, age/sex, blood type, contact, address, allergies,
 *           active conditions, last visit, next-of-kin.
 * Does NOT contain: insurance policy numbers, copay amounts, invoices, charges.
 */

import { useState } from 'react';
import { User, AlertCircle, Settings2, Clock, Phone, Mail, MapPin, Users } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { savePatient } from '../../services/clinicalFirestoreService';
import { canEditDemographics, AppRole } from '../../lib/roleAccess';

interface DemographicsPanelProps {
  patientId: string;
  patient: any;
  intake: any;
  role: AppRole;
}

export function DemographicsPanel({ patientId, patient, intake, role }: DemographicsPanelProps) {
  const canEdit = canEditDemographics(role);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    firstName: patient?.firstName || '',
    lastName: patient?.lastName || '',
    dob: patient?.dob || '',
    gender: patient?.gender || patient?.sex || '',
    bloodType: patient?.bloodType || 'A+',
    phone: patient?.phone || '',
    email: patient?.email || '',
    address: patient?.address || '',
  });

  const openEdit = () => {
    setForm({
      firstName: patient?.firstName || '',
      lastName: patient?.lastName || '',
      dob: patient?.dob || '',
      gender: patient?.gender || patient?.sex || '',
      bloodType: patient?.bloodType || 'A+',
      phone: patient?.phone || '',
      email: patient?.email || '',
      address: patient?.address || '',
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await savePatient(patientId, {
        ...form,
        name: `${form.firstName} ${form.lastName}`.trim(),
        sex: form.gender,
      });
      setIsEditing(false);
    } catch (err) {
      console.error('Demographics save failed:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const allergies = intake?.allergies
    ? intake.allergies.split(',').map((a: string) => a.trim()).filter(Boolean)
    : [];

  return (
    <>
      <Card className="h-full border-[#EDEBE9] shadow-sm rounded-lg overflow-hidden bg-white flex flex-col">
        {/* Patient identity */}
        <div className="p-4 xl:p-5 flex-1 space-y-6">

          {/* Avatar + name block */}
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 rounded-2xl bg-[#F3F2F1] border border-[#EDEBE9] flex items-center justify-center shrink-0">
              <User className="h-7 w-7 text-[#A19F9D]" />
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <h1 className="text-2xl font-black tracking-tight text-[#242424] leading-tight">
                {patient?.name || '—'}
              </h1>
              <p className="text-[11px] font-black text-[#A19F9D] uppercase tracking-widest mt-1">
                MRN {patient?.mrn || 'N/A'}
              </p>
              <div className="flex gap-3 mt-2">
                <span className="text-xs font-bold text-[#242424]">
                  {patient?.age ? `${patient.age}y` : '—'}
                </span>
                <span className="text-xs text-[#616161]">{patient?.sex || patient?.gender || '—'}</span>
                <span className="text-xs font-bold text-[#D13438]">{patient?.bloodType || '—'}</span>
              </div>
              {canEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openEdit}
                  className="mt-3 text-[10px] font-black uppercase tracking-widest text-[#005A9E] border-[#DEECF9] bg-[#F3F9FE] hover:bg-[#DEECF9] h-7 rounded-xl w-full flex items-center justify-center gap-1.5"
                >
                  <Settings2 className="w-3 h-3" />
                  Edit Demographics
                </Button>
              )}
            </div>
          </div>

          {/* Contact details */}
          <div className="space-y-2">
            <span className="text-[10px] font-black text-[#616161] uppercase tracking-widest">Contact</span>
            <div className="space-y-1.5">
              {patient?.phone && (
                <div className="flex items-center gap-2 text-xs text-[#242424]">
                  <Phone className="h-3 w-3 text-[#A19F9D] shrink-0" />
                  <span className="font-medium">{patient.phone}</span>
                </div>
              )}
              {patient?.email && (
                <div className="flex items-center gap-2 text-xs text-[#242424]">
                  <Mail className="h-3 w-3 text-[#A19F9D] shrink-0" />
                  <span className="font-medium truncate">{patient.email}</span>
                </div>
              )}
              {patient?.address && (
                <div className="flex items-start gap-2 text-xs text-[#242424]">
                  <MapPin className="h-3 w-3 text-[#A19F9D] shrink-0 mt-0.5" />
                  <span className="font-medium leading-snug">{patient.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Next of kin — shown if present */}
          {patient?.nextOfKin && (
            <div className="space-y-2">
              <span className="text-[10px] font-black text-[#616161] uppercase tracking-widest">Next of Kin</span>
              <div className="flex items-center gap-2 text-xs text-[#242424]">
                <Users className="h-3 w-3 text-[#A19F9D] shrink-0" />
                <span className="font-medium">{patient.nextOfKin}</span>
              </div>
            </div>
          )}

          {/* Allergies */}
          <div className="p-3 rounded-xl border border-[#FBC6CC] bg-[#FDE7E9]/30">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-3.5 w-3.5 text-[#A4262C]" />
              <span className="text-[10px] font-black text-[#A4262C] uppercase tracking-widest">
                Severe Allergies
              </span>
            </div>
            {allergies.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {allergies.map((allergy: string, idx: number) => (
                  <Badge
                    key={idx}
                    className="bg-[#A4262C] text-white border-none text-[9px] uppercase font-black py-0.5 px-2 rounded-md"
                  >
                    {allergy}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-[#A19F9D] font-bold italic">None reported</p>
            )}
          </div>

          {/* Active conditions */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-[#616161] uppercase tracking-widest">
                Active Conditions
              </span>
              <Badge
                variant="outline"
                className="text-[9px] bg-[#F3F2F1] border-none text-[#616161] font-black px-2 py-0.5 rounded-full"
              >
                {(patient?.conditions || []).length} active
              </Badge>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(patient?.conditions || []).map((condition: string, idx: number) => (
                <Badge
                  key={idx}
                  variant="secondary"
                  className="bg-[#DEECF9] text-[#005A9E] border-none rounded-full px-3 py-1 text-[10px] font-black"
                >
                  {condition}
                </Badge>
              ))}
              {(!patient?.conditions || patient.conditions.length === 0) && (
                <span className="text-[11px] text-[#616161] italic">No active conditions recorded.</span>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#FAFAFA] border-t border-[#EDEBE9] px-4 py-3 flex items-center gap-2">
          <Clock className="h-3 w-3 text-[#616161]" />
          <span className="text-[10px] text-[#616161] font-medium uppercase tracking-tight">
            Last visit: {patient?.lastVisit || '—'}
          </span>
        </div>
      </Card>

      {/* Edit dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-2xl bg-white rounded-2xl border border-[#EDEBE9] p-6 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-slate-900 uppercase tracking-tight">
              Edit Patient Demographics
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 my-4">
            {[
              { label: 'First Name', key: 'firstName' as const, colSpan: 1 },
              { label: 'Last Name', key: 'lastName' as const, colSpan: 1 },
              { label: 'Date of Birth', key: 'dob' as const, colSpan: 1, placeholder: 'YYYY-MM-DD' },
              { label: 'Phone', key: 'phone' as const, colSpan: 1 },
              { label: 'Email Address', key: 'email' as const, colSpan: 2, type: 'email' },
              { label: 'Address', key: 'address' as const, colSpan: 2 },
            ].map(({ label, key, colSpan, placeholder, type }) => (
              <div key={key} className={`space-y-1 ${colSpan === 2 ? 'md:col-span-2' : ''}`}>
                <span className="text-[10px] text-[#828282] uppercase font-black tracking-widest block">
                  {label}
                </span>
                <Input
                  value={form[key]}
                  type={type || 'text'}
                  placeholder={placeholder}
                  onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
                  className="text-xs font-semibold text-[#242424] bg-white border border-[#EDEBE9] rounded-xl px-3 py-2 h-9"
                />
              </div>
            ))}
            <div className="space-y-1">
              <span className="text-[10px] text-[#828282] uppercase font-black tracking-widest block">Gender / Sex</span>
              <select
                value={form.gender}
                onChange={(e) => setForm(f => ({ ...f, gender: e.target.value }))}
                className="text-xs font-semibold text-[#242424] bg-white border border-[#EDEBE9] rounded-xl px-3 py-2 w-full h-9 focus:outline-none focus:border-sky-500"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-[#828282] uppercase font-black tracking-widest block">Blood Type</span>
              <select
                value={form.bloodType}
                onChange={(e) => setForm(f => ({ ...f, bloodType: e.target.value }))}
                className="text-xs font-semibold text-[#242424] bg-white border border-[#EDEBE9] rounded-xl px-3 py-2 w-full h-9 focus:outline-none focus:border-sky-500"
              >
                {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bt => (
                  <option key={bt} value={bt}>{bt}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-[#F3F2F1]">
            <Button
              variant="outline"
              onClick={() => setIsEditing(false)}
              className="text-xs font-bold uppercase tracking-widest px-4 h-9 rounded-xl"
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold uppercase tracking-widest px-5 h-9 rounded-xl"
              disabled={isSaving}
            >
              {isSaving ? 'Saving…' : 'Save Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
