export interface ClinicalCode {
  code: string;
  display: string;
  system: string;
}

/**
 * Searches the NLM ICD-10 API for medical conditions and codes.
 * Documentation: https://clinicaltables.nlm.nih.gov/apidoc/icd10cm/v3/doc.html
 */
export async function searchICD10(query: string): Promise<ClinicalCode[]> {
  if (!query || query.length < 2) return [];

  try {
    const response = await fetch(
      `https://clinicaltables.nlm.nih.gov/api/icd10cm/v3/search?terms=${encodeURIComponent(query)}&max=10`
    );
    const data = await response.json();
    
    // NLM API returns [count, codes, null, descriptions]
    const codes = data[1] || [];
    const descriptions = data[3] || [];
    
    return codes.map((code: string, index: number) => ({
      code,
      display: descriptions[index][1] || descriptions[index][0],
      system: 'ICD-10-CM'
    }));
  } catch (error) {
    console.error('Failed to fetch ICD-10 codes:', error);
    return [];
  }
}

/**
 * Searches SNOMED CT via a public terminology service or similar.
 * Note: SNOMED usually requires an API key for most production services.
 * We'll mock it or use an alternative if available. 
 * For this demo, we'll stick to ICD-10 search results but tagged appropriately if query fits.
 */
export async function searchSNOMED(query: string): Promise<ClinicalCode[]> {
  // For the purpose of this demonstration, we'll reuse the ICD search 
  // but we could integrate with a SNOMED browser API if one is readily available without auth.
  return [];
}
