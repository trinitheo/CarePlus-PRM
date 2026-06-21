/**
 * roleAccess.ts
 * Single source of truth for all role-based visibility decisions
 * in the patient record. Import these helpers in any component
 * instead of scattering inline role checks.
 */

export type AppRole =
  | 'clinician'
  | 'nurse'
  | 'allied_health'
  | 'admin'
  | 'billing'
  | 'patient'
  | 'manager'
  | 'front_desk'
  | 'read_only';

// ─── Zone visibility ────────────────────────────────────────────────────────

/** Demographics panel: name, DOB, MRN, contact, blood type, next-of-kin.
 *  Visible to everyone except read_only guests. */
export function canViewDemographics(role: AppRole): boolean {
  return role !== 'read_only';
}

/** Clinical chart: SOAP notes, vitals, prescriptions, investigations,
 *  procedures, referrals, care team, interactions.
 *  Clinician and Nurse only (Admin gets read-only oversight). */
export function canViewClinical(role: AppRole): boolean {
  return ['clinician', 'nurse', 'allied_health', 'admin'].includes(role);
}

/** Financial zone: insurance policy details, copay, charges, invoices,
 *  CPT/ICD codes, payment history.
 *  Front Desk and Billing only (Admin gets oversight). */
export function canViewFinancial(role: AppRole): boolean {
  return ['front_desk', 'billing', 'admin'].includes(role);
}

// ─── Write permissions ───────────────────────────────────────────────────────

/** Who can write clinical data (SOAP, Rx, investigations, vitals). */
export function canWriteClinical(role: AppRole): boolean {
  return ['clinician', 'nurse', 'allied_health', 'admin'].includes(role);
}

/** Who can edit demographics. */
export function canEditDemographics(role: AppRole): boolean {
  return ['front_desk', 'clinician', 'admin', 'patient'].includes(role);
}

/** Who can write financial records / billing entries. */
export function canWriteFinancial(role: AppRole): boolean {
  return ['front_desk', 'billing', 'admin'].includes(role);
}

/** Who can issue prescriptions specifically. */
export function canPrescribe(role: AppRole): boolean {
  return ['clinician', 'admin'].includes(role);
}

/** Who can create referrals. */
export function canReferOut(role: AppRole): boolean {
  return ['clinician', 'admin'].includes(role);
}

// ─── Derived helpers for the tab bar ────────────────────────────────────────

/** Returns which named tabs should appear for this role. */
export function getVisibleTabs(role: AppRole): PatientRecordTab[] {
  const tabs: PatientRecordTab[] = ['overview'];

  if (canViewClinical(role)) {
    tabs.push('clinical', 'medications', 'investigations', 'procedures');
    if (canReferOut(role)) tabs.push('referrals');
    tabs.push('insights');
  }

  if (canViewFinancial(role)) {
    tabs.push('financial');
  }

  return tabs;
}

export type PatientRecordTab =
  | 'overview'
  | 'clinical'
  | 'medications'
  | 'investigations'
  | 'procedures'
  | 'referrals'
  | 'insights'
  | 'financial';
