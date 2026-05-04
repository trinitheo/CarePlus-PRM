import type { Api } from '../../api_contract/patient';

// This utility is used by MedicalRecordsMFE and must be preserved.
export function parseResultsString(resultsString: string): Api.V1.LabResultValue[] {
  if (!resultsString || typeof resultsString !== 'string') return [];
  return resultsString.split('\n').map(line => {
    const parts = line.split('|');
    if (parts.length < 4) return null;
    const [testName, value, unit, referenceRange, flag = ''] = parts;
    const isAbnormal = flag === 'H' || flag === 'L';
    return { testName: testName.trim(), value: value.trim(), unit: unit.trim(), referenceRange: referenceRange.trim(), isAbnormal, flag: flag.trim() as 'H' | 'L' | '' };
  }).filter((r): r is Api.V1.LabResultValue => r !== null);
}
