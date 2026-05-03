import { useMemo } from 'react';
import { MedicalRecordEntry } from '../types';

export function useUnifiedDocumentStream(records: any[]): MedicalRecordEntry[] {
  return useMemo(() => {
    if (!records || !Array.isArray(records)) return [];

    return records
      .map(record => {
        // Map various record formats to the common MedicalRecordEntry interface
        const timestamp = record.createdAt?.seconds 
          ? record.createdAt.seconds * 1000 
          : (record.timestamp || Date.now());

        return {
          id: record.id,
          type: record.type || (record.subjective ? 'FollowUp' : 'ClinicalRecord'),
          timestamp,
          data: {
            authorName: record.authorName || 'Clinical Staff',
            content: record.content || record.subjective || record.plan || 'View details',
            ...record
          }
        } as MedicalRecordEntry;
      })
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [records]);
}
