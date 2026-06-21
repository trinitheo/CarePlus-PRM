/**
 * FinancialPanel.tsx
 * Zone 3 of 3 in the restructured patient record.
 *
 * Visible to: Front Desk, Billing, Admin.
 * NOT visible to: Clinician, Nurse, Allied Health (they never see financial data).
 *
 * Contains: insurance policy details, copay, coverage limits,
 *           invoices, charges, CPT/ICD codes, payment history.
 *
 * This component is intentionally kept as a clean placeholder today
 * so the billing module can be plugged in without touching ClinicalRecords.tsx.
 */

import { FileText, Shield, CreditCard, Receipt, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { AppRole, canWriteFinancial } from '../../lib/roleAccess';

interface FinancialPanelProps {
  patientId: string;
  patient: any;
  role: AppRole;
}

// ─── Insurance summary ───────────────────────────────────────────────────────

function InsuranceCard({ patient }: { patient: any }) {
  const ins = patient?.insurance || {};
  return (
    <Card className="border-[#EDEBE9] shadow-sm rounded-lg bg-white">
      <CardHeader className="py-2 px-4 border-b border-[#F3F2F1] flex flex-row items-center justify-between">
        <CardTitle className="text-[11px] font-black text-[#242424] uppercase tracking-widest flex items-center gap-2">
          <Shield className="h-3.5 w-3.5 text-[#0078D4]" />
          Insurance Coverage
        </CardTitle>
        <Badge className="bg-[#DFF6DD] text-[#107C10] border-none text-[8px] font-black uppercase px-2 py-0.5 rounded-sm">
          {ins.status || 'Active'}
        </Badge>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        <Row label="Carrier" value={ins.carrier || patient?.insuranceCarrier || '—'} />
        <Row label="Plan" value={ins.plan || '—'} />
        <Row label="Policy No." value={ins.policyNumber || '—'} />
        <Row label="Group No." value={ins.groupNumber || '—'} />
        <Row label="Copay" value={ins.copay ? `$${ins.copay}` : '—'} highlight />
        <Row label="Coverage limit" value={ins.coverageLimit ? `$${ins.coverageLimit.toLocaleString()}` : '—'} />
        <Row label="Effective date" value={ins.effectiveDate || '—'} />
        <Row label="Expiry date" value={ins.expiryDate || '—'} />
      </CardContent>
    </Card>
  );
}

// ─── Recent charges ──────────────────────────────────────────────────────────

function ChargesCard({ patientId, canWrite }: { patientId: string; canWrite: boolean }) {
  // Charges will be loaded from the billing module subscription
  // For now renders the structure ready for data
  const charges: any[] = [];

  return (
    <Card className="border-[#EDEBE9] shadow-sm rounded-lg bg-white">
      <CardHeader className="py-2 px-4 border-b border-[#F3F2F1] flex flex-row items-center justify-between">
        <CardTitle className="text-[11px] font-black text-[#242424] uppercase tracking-widest flex items-center gap-2">
          <Receipt className="h-3.5 w-3.5 text-[#845701]" />
          Recent Charges
        </CardTitle>
        {canWrite && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-[9px] font-black uppercase tracking-widest text-[#0078D4]"
            onClick={() => window.location.hash = '#billing'}
          >
            Add charge
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {charges.length > 0 ? (
          <div className="divide-y divide-[#F3F2F1]">
            {charges.map((charge: any) => (
              <div key={charge.id} className="px-4 py-3 flex items-center justify-between hover:bg-[#F8F9FA] transition-colors">
                <div>
                  <p className="text-[11px] font-bold text-[#242424]">{charge.description}</p>
                  <p className="text-[10px] text-[#A19F9D] font-medium mt-0.5">
                    {charge.cptCode} · {charge.date}
                  </p>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className="text-[12px] font-black text-[#242424]">${charge.amount}</p>
                  <Badge className={`text-[8px] font-black uppercase px-1.5 py-0.5 border-none rounded-sm ${
                    charge.status === 'paid'
                      ? 'bg-[#DFF6DD] text-[#107C10]'
                      : charge.status === 'pending'
                      ? 'bg-[#FFF4CE] text-[#835B00]'
                      : 'bg-[#FDE7E9] text-[#A4262C]'
                  }`}>
                    {charge.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center opacity-40">
            <Receipt className="h-7 w-7 text-[#616161] mb-2" />
            <p className="text-[10px] font-black text-[#242424] uppercase tracking-widest">No charges recorded</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Payment summary ─────────────────────────────────────────────────────────

function PaymentSummaryCard({ patient }: { patient: any }) {
  return (
    <Card className="border-[#EDEBE9] shadow-sm rounded-lg bg-white">
      <CardHeader className="py-2 px-4 border-b border-[#F3F2F1]">
        <CardTitle className="text-[11px] font-black text-[#242424] uppercase tracking-widest flex items-center gap-2">
          <CreditCard className="h-3.5 w-3.5 text-[#5C2D91]" />
          Account Balance
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        <Row label="Outstanding balance" value={patient?.balance ? `$${patient.balance}` : '$0.00'} highlight />
        <Row label="Last payment" value={patient?.lastPayment || '—'} />
        <Row label="Payment method" value={patient?.paymentMethod || '—'} />
        <div className="pt-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full h-8 text-[10px] font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-1.5"
            onClick={() => window.location.hash = '#billing'}
          >
            <FileText className="h-3 w-3" />
            View full billing history
            <ChevronRight className="h-3 w-3 ml-auto" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────

export function FinancialPanel({ patientId, patient, role }: FinancialPanelProps) {
  const canWrite = canWriteFinancial(role);

  return (
    <div className="space-y-4">
      <InsuranceCard patient={patient} />
      <ChargesCard patientId={patientId} canWrite={canWrite} />
      <PaymentSummaryCard patient={patient} />
    </div>
  );
}

// ─── Shared sub-component ────────────────────────────────────────────────────

function Row({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[10px] font-black text-[#A19F9D] uppercase tracking-widest shrink-0">{label}</span>
      <span className={`text-[11px] font-bold text-right ${highlight ? 'text-[#D13438]' : 'text-[#242424]'}`}>
        {value}
      </span>
    </div>
  );
}
