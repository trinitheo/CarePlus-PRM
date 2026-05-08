export interface ClinicalCode {
  code: string;
  display: string;
  system: string;
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

    if (!response.ok) {
      console.warn(`ICD-10 search API returned status: ${response.status}`);
      return [];
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.warn(`ICD-10 search API returned non-JSON content: ${contentType}`);
      return [];
    }

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
 * Searches the NIH RxNorm API for medications using the RxNav drugs.json endpoint.
 * Documentation: https://rxnav.nlm.nih.gov/RxNormAPI.html#uif_getDrugs
 */
export async function searchMedications(query: string): Promise<ClinicalCode[]> {
  if (!query || query.length < 3) return [];

  try {
    const response = await fetch(
      `https://rxnav.nlm.nih.gov/REST/drugs.json?name=${encodeURIComponent(query)}`,
      {
        headers: {
          'Accept': 'application/json'
        }
      }
    );
    
    if (!response.ok) {
      console.warn(`Medication search API returned status: ${response.status}`);
      return [];
    }

    const data = await response.json();
    
    // RxNav returns { drugGroup: { conceptGroup: [ { conceptProperties: [] } ] } }
    const results: ClinicalCode[] = [];
    const conceptGroups = data.drugGroup?.conceptGroup || [];

    conceptGroups.forEach((group: any) => {
      if (group.conceptProperties) {
        group.conceptProperties.forEach((prop: any) => {
          results.push({
            code: prop.rxcui,
            display: prop.name,
            system: 'RxNorm'
          });
        });
      }
    });

    return results;
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
    
    if (!response.ok) return [];

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) return [];

    const data = await response.json();
    
    // The strengths are often in the extra fields index if requested
    // For simplicity, we can also parse the display names if they contain strengths
    // or use the 'getDrugs' endpoint for more specific info.
    // Let's use a simpler heuristic for now: filtering the descriptions.
    const descriptions: (string | string[])[] = data[3] || [];
    const strengths = descriptions
      .map((d) => Array.isArray(d) ? d[0] : d)
      .filter((d): d is string => !!d && d.toLowerCase().includes(name.toLowerCase()))
      .map((d) => d.replace(new RegExp(escapeRegExp(name), 'gi'), '').trim())
      .filter((s) => s.length > 0);

    return Array.from(new Set(strengths)); // Unique strengths
  } catch (error) {
    console.error('Failed to fetch strengths:', error);
    return [];
  }
}
