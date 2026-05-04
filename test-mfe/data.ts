// This PANELS object maps a panel name to its constituent tests.
// It is used by the form logic to handle selecting/deselecting an entire panel at once.
export const PANELS = {
    // Standard Panels
    "Basic Metabolic Panel (BMP)": ["Electrolytes", "Glucose", "Calcium", "BUN", "Creatinine"],
    "Comprehensive Metabolic Panel (CMP)": ["ALT", "AST", "Bilirubin", "Albumin", "Total Protein", "ALP"], // Note: BMP tests are added via 'includes'
    "Lipid Panel": ["Total cholesterol", "HDL", "LDL", "Triglycerides"],
    "Diabetes Monitoring Panel": ["Glucose", "HbA1c", "Insulin", "C-peptide"],
    "Kidney Panel": ["BUN", "Creatinine", "eGFR", "Electrolytes"],
    "Liver Panel": ["ALT", "AST", "ALP", "Bilirubin", "Albumin"],
    "Thyroid Panel": ["TSH", "Free T4", "Free T3"],
    "Heart Panel": ["Troponin", "CK-MB", "BNP"],
    "Pancreatic Panel": ["Amylase", "Lipase"],
    "Inflammatory Markers Panel": ["CRP", "ESR", "Ferritin"],
    "Pre-procedural Panel": ["CBC", "Coagulation profile", "Electrolytes"],

    // Reproductive & Pregnancy Panels
    "Pregnancy Confirmation Panel": ["hCG (urine)", "hCG (serum)"],
    "First Trimester Screening Panel": ["PAPP-A", "hCG", "Nuchal translucency (imaging)"],
    "Second Trimester Screening (Quad Screen)": ["AFP", "hCG", "Estriol", "Inhibin A"],
    "Ectopic Pregnancy Evaluation Panel": ["Serial hCG", "Progesterone"],
    "Gestational Trophoblastic Disease Panel": ["Quantitative hCG", "Imaging", "Thyroid function"],

    // Other Specimen Panels
    "Urinalysis Panel": ["Urinalysis", "Urine Microscopy"],
    "Urine Chemistry Panel": ["Urine Glucose", "Urine Protein", "Urine Ketones", "Urine pH", "Urine Specific Gravity", "Urine Nitrites", "Urine Leukocyte Esterase"],
    "Stool Analysis Panel": ["Stool Occult Blood", "Stool Culture", "Ova and Parasites", "Clostridium difficile Toxin"],
    "Stool Chemistry Panel": ["Fecal Fat", "Reducing Substances"],
    "Sputum Microbiology Panel": ["Sputum Culture", "Acid-Fast Bacilli (AFB) Smear", "Gram Stain"],
    "Rapid Swab Tests": ["Rapid Strep Test", "COVID-19 PCR", "Influenza A/B", "RSV Antigen"],
    "Swab Cultures": ["Wound Culture", "MRSA Screening"],
    "Tissue Biopsy Panel": ["Skin Punch Biopsy", "Shave Biopsy", "Fine Needle Aspiration (FNA)"],
    "Cytology Panel": ["Pap Smear (Cervical Cytology)", "Sputum Cytology"],
    "CSF Basic Analysis": ["CSF Protein", "CSF Glucose", "CSF Cell Count & Differential"],
    "Meningitis Panel": ["CSF Gram Stain", "CSF Culture & Sensitivity", "CSF Viral PCR Panel"],
};

const BLOOD_TEST_DATA = [
  {
    category: "⭐ Standard Panels",
    description: "Commonly ordered panels for general health monitoring and disease management.",
    panels: {
      "Basic Metabolic Panel (BMP)": { description: "Electrolytes, glucose, calcium, kidney function markers", tests: PANELS["Basic Metabolic Panel (BMP)"] },
      "Comprehensive Metabolic Panel (CMP)": { description: "BMP + liver enzymes (ALT, AST), bilirubin, albumin, total protein", tests: PANELS["Comprehensive Metabolic Panel (CMP)"], includes: ["Basic Metabolic Panel (BMP)"] },
      "Lipid Panel": { description: "Total cholesterol, HDL, LDL, triglycerides", tests: PANELS["Lipid Panel"] },
      "Diabetes Monitoring Panel": { description: "Glucose, HbA1c, possibly insulin or C-peptide", tests: PANELS["Diabetes Monitoring Panel"] },
      "Kidney Panel": { description: "BUN, creatinine, eGFR, electrolytes", tests: PANELS["Kidney Panel"] },
      "Liver Panel": { description: "ALT, AST, ALP, bilirubin, albumin", tests: PANELS["Liver Panel"] },
      "Thyroid Panel": { description: "TSH, Free T4, Free T3", tests: PANELS["Thyroid Panel"] },
      "Heart Panel": { description: "Troponin, CK-MB, BNP", tests: PANELS["Heart Panel"] },
      "Pancreatic Panel": { description: "Amylase, lipase", tests: PANELS["Pancreatic Panel"] },
      "Inflammatory Markers Panel": { description: "CRP, ESR, ferritin", tests: PANELS["Inflammatory Markers Panel"] },
      "Pre-procedural Panel": { description: "CBC, coagulation profile, electrolytes", tests: PANELS["Pre-procedural Panel"] },
    }
  },
  {
    category: "🧪 General Lab Tests",
    description: "Individual tests or grouped by organ/system function.",
    panels: {
      "Hematology": { description: "", tests: ["CBC", "Differential", "Reticulocyte count"] },
      "Cardiac Markers": { description: "", tests: ["Troponin", "CK-MB", "BNP"] },
      "Liver Function": { description: "", tests: ["ALT", "AST", "ALP", "Bilirubin"] },
      "Kidney Function": { description: "", tests: ["BUN", "Creatinine", "eGFR"] },
      "Pancreatic Function": { description: "", tests: ["Amylase", "Lipase"] },
      "Inflammatory Markers": { description: "", tests: ["CRP", "ESR", "Ferritin"] },
    }
  },
  {
    category: "🔬 Endocrine Lab Tests",
    description: "Focused on hormonal axes.",
    panels: {
      "Thyroid Function": { description: "", tests: ["TSH", "Free T4", "Free T3"] },
      "Adrenal Function": { description: "", tests: ["Cortisol", "ACTH", "Aldosterone"] },
      "Pituitary Function": { description: "", tests: ["Prolactin", "GH", "FSH", "LH"] },
      "Parathyroid & Calcium Metabolism": { description: "", tests: ["PTH", "Calcium", "Phosphate", "Vitamin D"] },
      "Reproductive Hormones": { description: "", tests: ["Estrogen", "Progesterone", "Testosterone"] },
    }
  },
  {
    category: "🤰 Reproductive & Pregnancy Panels",
    description: "",
    panels: {
      "Pregnancy Confirmation Panel": { description: "hCG (serum)", tests: PANELS["Pregnancy Confirmation Panel"].filter(t => t.includes("serum")) },
      "First Trimester Screening Panel": { description: "PAPP-A, hCG, nuchal translucency (imaging)", tests: PANELS["First Trimester Screening Panel"] },
      "Second Trimester Screening (Quad Screen)": { description: "AFP, hCG, estriol, inhibin A", tests: PANELS["Second Trimester Screening (Quad Screen)"] },
      "Ectopic Pregnancy Evaluation Panel": { description: "Serial hCG, progesterone", tests: PANELS["Ectopic Pregnancy Evaluation Panel"] },
      "Gestational Trophoblastic Disease Panel": { description: "Quantitative hCG, imaging, thyroid function", tests: PANELS["Gestational Trophoblastic Disease Panel"] },
    }
  },
  {
    category: "🧫 Tumor Marker Tests",
    description: "",
    panels: {
      "General Surveillance": { description: "", tests: ["CEA", "CA 19-9", "CA 125"] },
      "Liver & Germ Cell Tumors": { description: "", tests: ["AFP", "Beta-hCG"] },
      "Breast Cancer": { description: "", tests: ["CA 15-3", "HER2/neu"] },
      "Ovarian Cancer": { description: "", tests: ["CA 125", "HE4"] },
      "Prostate Cancer": { description: "", tests: ["PSA", "Free PSA"] },
      "Pancreatic & GI Cancers": { description: "", tests: ["CA 19-9", "CEA"] },
      "Thyroid Cancer": { description: "", tests: ["Thyroglobulin", "Calcitonin"] },
      "Bladder Cancer": { description: "", tests: ["NMP22", "BTA"] },
    }
  },
];

const URINE_TEST_DATA = [
  {
    category: "💧 Standard Urine Panels",
    description: "Analysis of urine for screening and diagnosis.",
    panels: {
      "Urinalysis Panel": { description: "Physical, chemical, and microscopic examination of urine.", tests: PANELS["Urinalysis Panel"] },
      "Urine Chemistry Panel": { description: "Dipstick tests for various chemical constituents.", tests: PANELS["Urine Chemistry Panel"] },
      "Pregnancy Test": { description: "Detection of human chorionic gonadotropin (hCG) in urine.", tests: PANELS["Pregnancy Confirmation Panel"].filter(t => t.includes("urine")) },
    }
  }
];

const STOOL_TEST_DATA = [
  {
    category: "💩 Stool Analysis",
    description: "Tests performed on fecal samples for gastrointestinal conditions.",
    panels: {
      "Stool Analysis Panel": { description: "General screening for common GI issues.", tests: PANELS["Stool Analysis Panel"] },
      "Stool Chemistry Panel": { description: "Chemical analysis for malabsorption and other disorders.", tests: PANELS["Stool Chemistry Panel"] },
    }
  }
];

const SPUTUM_TEST_DATA = [
  {
    category: "🫁 Sputum Analysis",
    description: "Microbiological examination of phlegm for respiratory infections.",
    panels: {
      "Sputum Microbiology Panel": { description: "Culture and staining to identify respiratory pathogens.", tests: PANELS["Sputum Microbiology Panel"] },
      "Cytology": { description: "For abnormal cells (e.g., cancer)", tests: PANELS["Cytology Panel"].filter(t => t.includes("Sputum")) },
    }
  }
];

const SWAB_TEST_DATA = [
  {
    category: "🧬 Swab Tests",
    description: "Collection of samples from surfaces for rapid testing or culture.",
    panels: {
      "Rapid Antigen & PCR": { description: "Fast detection of specific pathogens.", tests: PANELS["Rapid Swab Tests"] },
      "Cultures": { description: "Growth of microorganisms to identify infection.", tests: PANELS["Swab Cultures"] },
    }
  }
];

const TISSUE_TEST_DATA = [
  {
    category: "🔬 Tissue & Cytology",
    description: "Histopathological and cytological examination of tissue and cells.",
    panels: {
      "Histopathology": { description: "Microscopic examination of tissue biopsies.", tests: PANELS["Tissue Biopsy Panel"] },
      "Cytology": { description: "Microscopic examination of single cells.", tests: PANELS["Cytology Panel"].filter(t => !t.includes("Sputum")) },
    }
  }
];

const CSF_TEST_DATA = [
  {
    category: "🧠 Cerebrospinal Fluid",
    description: "Analysis of CSF for neurological conditions.",
    panels: {
      "CSF Basic Analysis": { description: "Basic markers for infection or inflammation.", tests: PANELS["CSF Basic Analysis"] },
      "Meningitis Panel": { description: "Tests to diagnose bacterial or viral meningitis.", tests: PANELS["Meningitis Panel"] },
    }
  }
];


export const SPECIMEN_TEST_MAP = {
  blood: BLOOD_TEST_DATA,
  urine: URINE_TEST_DATA,
  stool: STOOL_TEST_DATA,
  sputum: SPUTUM_TEST_DATA,
  swab: SWAB_TEST_DATA,
  tissue: TISSUE_TEST_DATA,
  csf: CSF_TEST_DATA
} as const;

export type SpecimenType = keyof typeof SPECIMEN_TEST_MAP;