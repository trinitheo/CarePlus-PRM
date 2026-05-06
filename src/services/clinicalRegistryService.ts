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
 * Searches the NIH RxNorm API for medications.
 * Documentation: https://clinicaltables.nlm.nih.gov/apidoc/rxnorm/v3/doc.html
 */
export async function searchMedications(query: string): Promise<ClinicalCode[]> {
  if (!query || query.length < 2) return [];

  try {
    const response = await fetch(
      `https://clinicaltables.nlm.nih.gov/api/rxnorm/v3/search?terms=${encodeURIComponent(query)}&max=10`
    );
    const data = await response.json();
    
    // NLM API returns [count, codes, null, descriptions]
    const codes = data[1] || [];
    const descriptions = data[3] || [];
    
    return codes.map((code: string, index: number) => ({
      code,
      display: descriptions[index][0],
      system: 'RxNorm'
    }));
  } catch (error) {
    console.error('Failed to fetch medications:', error);
    return [];
  }
}

/**
 * Fetches available strengths and forms for a given RxNorm drug name.
 * Uses NIH RxTerms API.
 */
export async function getMedicationStrengths(name: string): Promise<string[]> {
  try {
    const response = await fetch(
      `https://clinicaltables.nlm.nih.gov/api/rxnorm/v3/search?terms=${encodeURIComponent(name)}&ef=STRENGTHS_AND_FORMS`
    );
    const data = await response.json();
    
    // The strengths are often in the extra fields index if requested
    // For simplicity, we can also parse the display names if they contain strengths
    // or use the 'getDrugs' endpoint for more specific info.
    // Let's use a simpler heuristic for now: filtering the descriptions.
    const descriptions: string[][] = data[3] || [];
    const strengths = descriptions
      .map((d: string[]) => d[0])
      .filter((d: string) => d.toLowerCase().includes(name.toLowerCase()))
      .map((d: string) => d.replace(new RegExp(name, 'gi'), '').trim())
      .filter((s: string) => s.length > 0);

    return Array.from(new Set(strengths)); // Unique strengths
  } catch (error) {
    console.error('Failed to fetch strengths:', error);
    return [];
  }
}
