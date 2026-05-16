import React, { useState } from 'react';
import { Label } from '../../../../components/ui/label';
import { Textarea } from '../../../../components/ui/textarea';
import { Checkbox } from '../../../../components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { ChevronDown, ChevronUp, X, FileText, AlertCircle } from 'lucide-react';

export type OrderCategory = 'laboratory' | 'imaging' | 'functional' | null;

// ─── Specimen tabs per category ───────────────────────────────────────────────
const SPECIMEN_TABS: Record<NonNullable<OrderCategory>, { label: string; emoji: string }[]> = {
  laboratory: [
    { label: 'Blood',   emoji: '🩸' },
    { label: 'Urine',   emoji: '💧' },
    { label: 'Stool',   emoji: '💩' },
    { label: 'Sputum',  emoji: '🫁' },
    { label: 'Swab',    emoji: '🧬' },
    { label: 'Tissue',  emoji: '🔬' },
    { label: 'CSF',     emoji: '🟣' },
  ],
  imaging: [
    { label: 'X-Ray',      emoji: '🦴' },
    { label: 'CT',         emoji: '🧠' },
    { label: 'MRI',        emoji: '🌀' },
    { label: 'Ultrasound', emoji: '📡' },
    { label: 'Nuclear',    emoji: '☢️' },
  ],
  functional: [
    { label: 'Cardiac',    emoji: '❤️' },
    { label: 'Pulmonary',  emoji: '🫁' },
    { label: 'Neuro',      emoji: '🧠' },
    { label: 'Sleep',      emoji: '😴' },
    { label: 'Exercise',   emoji: '🏃' },
  ],
};

// ─── Test catalogue: grouped panels per specimen type ────────────────────────
interface TestPanel {
  group: string;
  groupDescription: string;
  tests: { name: string; description: string }[];
}

const LAB_PANELS: Record<string, TestPanel[]> = {
  Blood: [
    {
      group: '⭐ Standard Panels',
      groupDescription: 'Commonly ordered panels for general health monitoring and disease management.',
      tests: [
        { name: 'Basic Metabolic Panel (BMP)',          description: 'Electrolytes, glucose, calcium, kidney function markers' },
        { name: 'Comprehensive Metabolic Panel (CMP)',  description: 'BMP + liver enzymes (ALT, AST), bilirubin, albumin, total protein' },
        { name: 'Lipid Panel',                          description: 'Total cholesterol, HDL, LDL, triglycerides' },
        { name: 'Diabetes Monitoring Panel',            description: 'Glucose, HbA1c, possibly insulin or C-peptide' },
        { name: 'Kidney Panel',                         description: 'BUN, creatinine, eGFR, uric acid' },
        { name: 'Liver Function Tests (LFTs)',          description: 'ALT, AST, ALP, GGT, bilirubin, albumin' },
        { name: 'Thyroid Function Panel',               description: 'TSH, Free T3, Free T4' },
      ],
    },
    {
      group: '🩸 Haematology',
      groupDescription: 'Blood cell counts and coagulation studies.',
      tests: [
        { name: 'CBC with Differential',  description: 'WBC, RBC, haemoglobin, haematocrit, platelets with differential' },
        { name: 'PT / INR',              description: 'Prothrombin time and international normalised ratio' },
        { name: 'aPTT',                  description: 'Activated partial thromboplastin time' },
        { name: 'D-Dimer',               description: 'Fibrin degradation product — DVT/PE screen' },
        { name: 'ESR',                   description: 'Erythrocyte sedimentation rate — inflammation marker' },
        { name: 'CRP',                   description: 'C-reactive protein — acute phase reactant' },
        { name: 'Fibrinogen',            description: 'Factor I — coagulation factor' },
        { name: 'Reticulocyte Count',    description: 'Immature red blood cell count' },
      ],
    },
    {
      group: '🦠 Infectious Disease',
      groupDescription: 'Screening and diagnostic tests for common pathogens.',
      tests: [
        { name: 'HIV 1/2 Ag/Ab Screen',  description: '4th gen HIV screening' },
        { name: 'Hepatitis B Surface Ag', description: 'Active Hep B infection screen' },
        { name: 'Hepatitis C Antibody',   description: 'Hep C exposure screen' },
        { name: 'Syphilis (RPR/VDRL)',    description: 'Treponemal and non-treponemal tests' },
        { name: 'Monospot',               description: 'EBV / Infectious Mononucleosis screen' },
        { name: 'QuantiFERON-TB Gold',    description: 'IGRA for tuberculosis exposure' },
        { name: 'Malaria Screen',         description: 'Thick and thin films' },
      ],
    },
    {
      group: '🧠 Endocrine & Metabolism',
      groupDescription: 'Hormones and metabolic markers.',
      tests: [
        { name: 'HbA1c',               description: '3-month average blood glucose' },
        { name: 'Insulin (Fasting)',    description: 'Hyperinsulinaemia / IR assessment' },
        { name: 'Cortisol (AM)',       description: 'Adrenal function screen' },
        { name: 'Testosterone (Total)', description: 'Androgen status' },
        { name: 'Estradiol (E2)',       description: 'Oestrogen status' },
        { name: 'Progesterone',         description: 'Ovulation / luteal phase assessment' },
        { name: 'Prolactin',            description: 'Pituitary function marker' },
        { name: 'Vitamin B12',          description: 'Cobalamin level' },
        { name: 'Vitamin D (25-OH)',    description: 'Bone health and immune status' },
      ],
    },
    {
      group: '🧬 Immunology & Allergy',
      groupDescription: 'Autoimmune markers and immunoglobulin levels.',
      tests: [
        { name: 'ANA Screen',           description: 'Antinuclear Antibodies — SLE/connective tissue disease' },
        { name: 'Rheumatoid Factor (RF)', description: 'RA screening' },
        { name: 'Anti-CCP Antibody',    description: 'Specific RA marker' },
        { name: 'IgE (Total)',          description: 'Alergy / atopy marker' },
        { name: 'Complement C3 & C4',   description: 'Immune complex consumption markers' },
      ]
    },
    {
      group: '🔬 Oncology / Tumor Markers',
      groupDescription: 'Surveillance and diagnostic aids for malignancies.',
      tests: [
        { name: 'PSA (Total)',          description: 'Prostate-specific antigen' },
        { name: 'CEA',                  description: 'Carcinoembryonic antigen — colorectal focus' },
        { name: 'CA 125',               description: 'Ovarian cancer marker' },
        { name: 'CA 19-9',              description: 'Pancreatic / biliary marker' },
        { name: 'AFP (Tumor)',          description: 'Alpha-fetoprotein — HCC / germ cell marker' },
      ],
    },
    {
      group: '🫀 Cardiac Markers',
      groupDescription: 'Markers of myocardial injury and heart failure.',
      tests: [
        { name: 'Troponin T (hs)',      description: 'High-sensitivity Troponin T' },
        { name: 'Troponin I (hs)',      description: 'High-sensitivity Troponin I' },
        { name: 'BNP / NT-proBNP',      description: 'Heart failure / volume overload marker' },
        { name: 'CK (Total)',           description: 'Creatine kinase — muscle injury' },
        { name: 'CK-MB',                description: 'Cardiac-specific CK isoenzyme' },
      ]
    }
  ],
  Urine: [
    {
      group: '🔍 Urinalysis',
      groupDescription: 'Routine and specialised urine studies.',
      tests: [
        { name: 'Urinalysis (UA)',            description: 'Dipstick + microscopy' },
        { name: 'Urine Culture & Sensitivity', description: 'Bacterial growth and antibiotic sensitivity' },
        { name: 'Urine Protein : Creatinine', description: 'Spot ratio for proteinuria quantification' },
        { name: '24-hr Urine Protein',        description: 'Total protein excretion over 24 hours' },
        { name: 'Urine Electrolytes',         description: 'Na, K, Cl in urine' },
      ],
    },
  ],
  Stool: [
    {
      group: '🦠 Microbiology',
      groupDescription: 'Gastrointestinal pathogen testing.',
      tests: [
        { name: 'Stool Culture',          description: 'Bacterial pathogens including Salmonella, Shigella, Campylobacter' },
        { name: 'Ova & Parasites (O&P)',  description: 'Parasitic infection screen' },
        { name: 'C. difficile Toxin',     description: 'PCR or EIA for Clostridioides difficile' },
        { name: 'Faecal Occult Blood',    description: 'FOBT — colorectal cancer screen' },
        { name: 'Calprotectin',           description: 'Inflammatory bowel disease marker' },
      ],
    },
  ],
  Sputum: [
    {
      group: '🫁 Respiratory',
      groupDescription: 'Lower respiratory tract specimens.',
      tests: [
        { name: 'Sputum Culture & Sensitivity', description: 'Aerobic bacteria, Gram stain' },
        { name: 'AFB Smear & Culture',          description: 'Acid-fast bacilli — tuberculosis screen' },
        { name: 'Sputum Cytology',              description: 'Malignant cells assessment' },
      ],
    },
  ],
  Swab: [
    {
      group: '🧬 Swab Studies',
      groupDescription: 'Surface and mucosal specimen testing.',
      tests: [
        { name: 'Throat Swab C&S',            description: 'Group A Strep and other organisms' },
        { name: 'Wound Swab C&S',             description: 'Wound infection — aerobic and anaerobic' },
        { name: 'MRSA Screen',                description: 'Nasal/groin swab for methicillin-resistant S. aureus' },
        { name: 'COVID-19 / Flu A&B (PCR)',   description: 'Rapid molecular respiratory panel' },
        { name: 'STI Panel (Swab)',           description: 'GC, Chlamydia, HSV, Trichomonas' },
      ],
    },
  ],
  Tissue: [
    {
      group: '🔬 Histopathology',
      groupDescription: 'Tissue biopsy and cytology studies.',
      tests: [
        { name: 'Core Biopsy — Histology',   description: 'Tissue architecture assessment' },
        { name: 'Fine Needle Aspirate (FNA)', description: 'Cytological examination of aspirated cells' },
        { name: 'Frozen Section',             description: 'Intraoperative rapid histology' },
        { name: 'Immunohistochemistry (IHC)', description: 'Receptor and marker expression profiling' },
      ],
    },
  ],
  CSF: [
    {
      group: '🟣 CSF Analysis',
      groupDescription: 'Cerebrospinal fluid studies.',
      tests: [
        { name: 'CSF Routine & Microscopy',  description: 'Cells, protein, glucose, Gram stain' },
        { name: 'CSF Culture',               description: 'Bacterial, fungal, and mycobacterial culture' },
        { name: 'CSF Viral PCR Panel',       description: 'HSV, CMV, EBV, enterovirus' },
        { name: 'CSF Oligoclonal Bands',     description: 'MS and neuroinflammation marker' },
        { name: 'CSF Opening Pressure',      description: 'Documented at lumbar puncture' },
      ],
    },
  ],
};

const IMAGING_PANELS: Record<string, TestPanel[]> = {
  'X-Ray': [
    {
      group: '🦴 Plain Films',
      groupDescription: 'Standard radiograph studies.',
      tests: [
        { name: 'Chest X-Ray (PA & Lateral)',  description: 'Cardiac, pulmonary, and mediastinal assessment' },
        { name: 'Abdominal X-Ray (AXR)',        description: 'Bowel gas, obstruction, free air' },
        { name: 'Pelvis X-Ray',                 description: 'Hip, sacrum, pubic symphysis' },
        { name: 'Cervical Spine X-Ray',         description: 'AP and lateral C-spine' },
        { name: 'Lumbar Spine X-Ray',           description: 'AP and lateral L-spine' },
        { name: 'Extremity X-Ray',              description: 'Limb fracture or joint assessment' },
      ],
    },
  ],
  CT: [
    {
      group: '🧠 CT Studies',
      groupDescription: 'Computed tomography — specify contrast requirements.',
      tests: [
        { name: 'CT Head without contrast',     description: 'Haemorrhage, infarct, mass screen' },
        { name: 'CT Head with contrast',        description: 'Enhancement for tumour or infection' },
        { name: 'CT Chest (HRCT)',              description: 'Pulmonary parenchyma — ILD, PE protocol' },
        { name: 'CT Abdomen & Pelvis',          description: 'Triple-phase with contrast' },
        { name: 'CT Pulmonary Angiogram (CTPA)', description: 'Pulmonary embolism protocol' },
        { name: 'CT Coronary Angiogram (CTCA)', description: 'Coronary artery disease assessment' },
      ],
    },
  ],
  MRI: [
    {
      group: '🌀 MRI Studies',
      groupDescription: 'Magnetic resonance imaging — no ionising radiation.',
      tests: [
        { name: 'MRI Brain',            description: 'T1, T2, FLAIR sequences — stroke, MS, tumour' },
        { name: 'MRI Lumbar Spine',     description: 'Disc herniation, nerve compression' },
        { name: 'MRI Cervical Spine',   description: 'Cord compression, disc disease' },
        { name: 'MRI Knee',             description: 'Meniscus, ACL, cartilage assessment' },
        { name: 'MRI Abdomen (MRCP)',   description: 'Biliary and pancreatic duct system' },
        { name: 'MRI Prostate',         description: 'Multiparametric for cancer localisation' },
      ],
    },
  ],
  Ultrasound: [
    {
      group: '📡 Ultrasound',
      groupDescription: 'Real-time sonographic imaging.',
      tests: [
        { name: 'Ultrasound Abdomen',   description: 'Liver, gallbladder, spleen, kidneys, pancreas' },
        { name: 'Ultrasound Pelvis',    description: 'Uterus, ovaries, bladder' },
        { name: 'Renal Ultrasound',     description: 'Kidneys and bladder — hydronephrosis, calculi' },
        { name: 'Thyroid Ultrasound',   description: 'Nodule characterisation' },
        { name: 'DVT Duplex Doppler',   description: 'Lower limb venous thrombosis screen' },
        { name: 'Carotid Doppler',      description: 'Carotid artery stenosis assessment' },
        { name: 'Mammogram',            description: 'Bilateral mammography screening or diagnostic' },
      ],
    },
  ],
  Nuclear: [
    {
      group: '☢️ Nuclear Medicine',
      groupDescription: 'Radionuclide studies and PET imaging.',
      tests: [
        { name: 'Bone Scan (Tc-99m)',   description: 'Metastatic disease, osteomyelitis, fractures' },
        { name: 'V/Q Scan',             description: 'Ventilation-perfusion — PE alternative to CTPA' },
        { name: 'PET-CT (FDG)',         description: 'Oncology staging and restaging' },
        { name: 'Thyroid Scan (I-123)', description: 'Thyroid nodule and hyperthyroidism assessment' },
      ],
    },
  ],
};

const FUNCTIONAL_PANELS: Record<string, TestPanel[]> = {
  Cardiac: [
    {
      group: '❤️ Cardiac Studies',
      groupDescription: 'Electrophysiology and structural cardiac assessment.',
      tests: [
        { name: '12-Lead ECG',            description: 'Resting electrocardiogram' },
        { name: 'Echocardiogram (TTE)',    description: 'Transthoracic echo — structure and function' },
        { name: 'Holter Monitor (24h)',    description: 'Ambulatory cardiac rhythm monitoring' },
        { name: 'Event Monitor (30-day)', description: 'Extended arrhythmia surveillance' },
        { name: 'Stress Echo',            description: 'Exercise or dobutamine stress echocardiography' },
        { name: 'Tilt Table Test',        description: 'Vasovagal syncope evaluation' },
      ],
    },
  ],
  Pulmonary: [
    {
      group: '🫁 Pulmonary Function',
      groupDescription: 'Spirometry and respiratory physiology testing.',
      tests: [
        { name: 'Spirometry (PFTs)',        description: 'FEV1, FVC, FEV1/FVC — obstructive vs restrictive' },
        { name: 'DLCO (Diffusion Capacity)', description: 'Alveolar gas transfer efficiency' },
        { name: 'Bronchoprovocation Test',   description: 'Methacholine challenge — asthma confirmation' },
        { name: 'Peak Flow Monitoring',      description: 'Serial PEFR measurements' },
      ],
    },
  ],
  Neuro: [
    {
      group: '🧠 Neurophysiology',
      groupDescription: 'Electrical activity of nerve and muscle.',
      tests: [
        { name: 'EEG (Routine)',         description: 'Epilepsy and seizure disorder assessment' },
        { name: 'Video EEG',             description: 'Prolonged monitoring with clinical correlation' },
        { name: 'Nerve Conduction Study (NCS)', description: 'Peripheral nerve conduction velocity' },
        { name: 'EMG',                   description: 'Electromyography — muscle and nerve disease' },
        { name: 'Evoked Potentials (VEP/SSEP)', description: 'Central and peripheral pathway integrity' },
      ],
    },
  ],
  Sleep: [
    {
      group: '😴 Sleep Studies',
      groupDescription: 'Polysomnographic and home sleep testing.',
      tests: [
        { name: 'Polysomnography (PSG)',      description: 'Full overnight sleep study in lab' },
        { name: 'Home Sleep Apnoea Test',     description: 'Portable unattended sleep monitoring' },
        { name: 'MSLT (Narcolepsy Screen)',   description: 'Multiple sleep latency test' },
        { name: 'Actigraphy',                description: 'Wrist-worn sleep-wake cycle monitoring' },
      ],
    },
  ],
  Exercise: [
    {
      group: '🏃 Exercise Testing',
      groupDescription: 'Cardiopulmonary and functional exercise assessment.',
      tests: [
        { name: 'Stress Test (Treadmill)',  description: 'Bruce protocol — ischaemia and functional capacity' },
        { name: 'Cardiopulmonary Exercise Test (CPET)', description: 'VO2 max and anaerobic threshold' },
        { name: '6-Minute Walk Test',       description: 'Functional exercise capacity for heart failure/COPD' },
      ],
    },
  ],
};

const PANELS_BY_CATEGORY: Record<NonNullable<OrderCategory>, Record<string, TestPanel[]>> = {
  laboratory: LAB_PANELS,
  imaging: IMAGING_PANELS,
  functional: FUNCTIONAL_PANELS,
};

// ─── Validation ───────────────────────────────────────────────────────────────
export interface InvestigationOrderFormErrors {
  tests?: string;
  indication?: string;
}

export function validateInvestigationOrder(
  selectedTests: string[],
  indication: string
): InvestigationOrderFormErrors {
  const errors: InvestigationOrderFormErrors = {};
  if (selectedTests.length === 0) errors.tests = 'Select at least one test before submitting.';
  if (!indication.trim()) errors.indication = 'Clinical indication is required.';
  else if (indication.trim().length < 5) errors.indication = 'Please provide a more detailed indication.';
  return errors;
}

export function isFormValid(e: InvestigationOrderFormErrors) { return Object.keys(e).length === 0; }

// ─── Props ────────────────────────────────────────────────────────────────────
interface InvestigationOrderFormProps {
  category: NonNullable<OrderCategory>;
  selectedTests: string[];
  otherTestsText: string;
  indication: string;
  instructions: string;
  priority: string;
  errors?: InvestigationOrderFormErrors;
  onToggleTest: (test: string) => void;
  onOtherTestsTextChange: (val: string) => void;
  onIndicationChange: (val: string) => void;
  onInstructionsChange: (val: string) => void;
  onPriorityChange: (val: string) => void;
}

export function InvestigationOrderForm({
  category,
  selectedTests,
  otherTestsText,
  indication,
  instructions,
  priority,
  errors = {},
  onToggleTest,
  onOtherTestsTextChange,
  onIndicationChange,
  onInstructionsChange,
  onPriorityChange,
}: InvestigationOrderFormProps) {
  const tabs = SPECIMEN_TABS[category];
  const [activeTab, setActiveTab] = useState(tabs[0].label);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [fastingRequired, setFastingRequired] = useState(false);

  const panels = PANELS_BY_CATEGORY[category][activeTab] ?? [];

  const parsedOtherTests = otherTestsText
    .split('\n')
    .map(t => t.trim())
    .filter(t => t.length > 0);

  const toggleGroup = (panel: TestPanel) => {
    const allNames = panel.tests.map(t => t.name);
    const selectedCount = allNames.filter(name => selectedTests.includes(name)).length;
    
    if (selectedCount === allNames.length) {
      // Unselect all
      allNames.forEach(name => {
        if (selectedTests.includes(name)) onToggleTest(name);
      });
    } else {
      // Select all
      allNames.forEach(name => {
        if (!selectedTests.includes(name)) onToggleTest(name);
      });
    }
  };

  const isGroupSelected = (panel: TestPanel) => {
    const allNames = panel.tests.map(t => t.name);
    return allNames.length > 0 && allNames.every(name => selectedTests.includes(name));
  };

  const isGroupIndeterminate = (panel: TestPanel) => {
    const allNames = panel.tests.map(t => t.name);
    const selectedCount = allNames.filter(name => selectedTests.includes(name)).length;
    return selectedCount > 0 && selectedCount < allNames.length;
  };

  const toggleExpand = (group: string) =>
    setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));

  const isExpanded = (group: string) => expandedGroups[group] ?? true;

  const FieldError = ({ message }: { message?: string }) =>
    message ? (
      <div className="flex items-center gap-1.5 mt-1.5 text-[12px] text-[#D13438]">
        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
        {message}
      </div>
    ) : null;

  return (
    <div className="flex flex-col lg:flex-row gap-0 h-full">

      {/* ── Left: Specimen tabs + test panels ── */}
      <div className="flex-1 flex flex-col overflow-hidden border-r border-[#EDEBE9]">

        {/* Specimen tabs */}
        <div className="flex gap-1 px-4 pt-4 pb-0 flex-wrap border-b border-[#EDEBE9] bg-white">
          {tabs.map(tab => (
            <button
              key={tab.label}
              type="button"
              onClick={() => setActiveTab(tab.label)}
              className={`flex items-center gap-1.5 px-3 py-2 text-[13px] font-semibold rounded-t-lg border-b-2 transition-all -mb-px ${
                activeTab === tab.label
                  ? 'border-[#0078D4] text-[#0078D4] bg-[#F3F9FD]'
                  : 'border-transparent text-[#616161] hover:text-[#242424] hover:bg-[#F3F2F1]'
              }`}
            >
              <span>{tab.emoji}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Test panels — scrollable */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {panels.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-[#A19F9D] text-sm italic">
              No tests available for this specimen type.
            </div>
          ) : (
            panels.map(panel => (
              <div
                key={panel.group}
                className={`rounded-xl border bg-white overflow-hidden transition-all mb-3 ${
                  errors.tests ? 'border-[#EDEBE9]' : 'border-[#EDEBE9]'
                }`}
              >
                {/* Group header */}
                <div className="flex items-center px-4 py-3 border-b border-[#F3F2F1] bg-[#FAFAFA]/30">
                  <Checkbox
                    checked={isGroupSelected(panel)}
                    indeterminate={isGroupIndeterminate(panel)}
                    onCheckedChange={() => toggleGroup(panel)}
                    className="mr-3 data-[state=checked]:bg-[#0078D4] data-[state=checked]:border-[#0078D4]"
                  />
                  <button
                    type="button"
                    onClick={() => toggleExpand(panel.group)}
                    className="flex-1 flex items-start justify-between text-left"
                  >
                    <div>
                      <p className="text-[14px] font-bold text-[#242424]">{panel.group}</p>
                      <p className="text-[12px] text-[#616161] mt-0.5">{panel.groupDescription}</p>
                    </div>
                    {isExpanded(panel.group)
                      ? <ChevronUp className="w-4 h-4 text-[#A19F9D] mt-1 flex-shrink-0" />
                      : <ChevronDown className="w-4 h-4 text-[#A19F9D] mt-1 flex-shrink-0" />
                    }
                  </button>
                </div>

                {/* Test rows */}
                {isExpanded(panel.group) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 divide-y divide-[#F3F2F1] bg-white">
                    {panel.tests.map(test => {
                      const checked = selectedTests.includes(test.name);
                      return (
                        <label
                          key={test.name}
                          className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors border-r border-[#F3F2F1] last:border-r-0 ${
                            checked ? 'bg-[#F3F9FD]' : 'hover:bg-[#FAFAFA]'
                          }`}
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() => onToggleTest(test.name)}
                            className="mt-0.5 flex-shrink-0 data-[state=checked]:bg-[#0078D4] data-[state=checked]:border-[#0078D4]"
                          />
                          <div className="flex-1 min-w-0">
                            <p className={`text-[13px] font-semibold ${checked ? 'text-[#0078D4]' : 'text-[#242424]'}`}>
                              {test.name}
                            </p>
                            <p className="text-[11px] text-[#616161] mt-0.5 line-clamp-1">{test.description}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            ))
          )}
          
          {/* Other Tests Section */}
          <div className="mt-8 pt-6 border-t border-[#EDEBE9]">
            <h3 className="text-[14px] font-bold text-[#242424] mb-1">Other / Custom Tests</h3>
            <p className="text-[12px] text-[#616161] mb-4">Specify any items not listed above. Enter each item on a new line.</p>
            <div className="bg-white rounded-xl border border-[#EDEBE9] p-4 shadow-sm">
              <Textarea
                placeholder="e.g., Vitamin D Level&#10;Ferritin&#10;Total Iron Binding Capacity"
                className="min-h-[100px] bg-[#FAFAFA] border-none focus:ring-0 text-[14px] p-0 resize-none"
                value={otherTestsText}
                onChange={(e) => onOtherTestsTextChange(e.target.value)}
              />
            </div>
          </div>
          
          <FieldError message={errors.tests} />
        </div>
      </div>

      {/* ── Right: Summary + actions ── */}
      <div className="w-full lg:w-[280px] flex flex-col gap-4 p-4 bg-white overflow-y-auto shrink-0">

        {/* Selected Tests */}
        <div>
          <h4 className="text-[12px] font-bold text-[#242424] mb-2">Selected Tests ({selectedTests.length + parsedOtherTests.length})</h4>
          <div className="min-h-[80px] rounded-xl border border-[#EDEBE9] bg-[#FAFAFA] p-3 max-h-[300px] overflow-y-auto">
            {selectedTests.length > 0 || parsedOtherTests.length > 0 ? (
              <div className="space-y-2">
                {selectedTests.map(test => (
                  <div key={test} className="flex items-start gap-2 group">
                    <FileText className="w-3.5 h-3.5 text-[#0078D4] shrink-0 mt-0.5" />
                    <span className="text-[12px] text-[#242424] flex-1 leading-tight">{test}</span>
                    <button
                      type="button"
                      onClick={() => onToggleTest(test)}
                      aria-label={`Remove ${test}`}
                      className="text-[#A19F9D] hover:text-[#D13438] transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {parsedOtherTests.map((test, idx) => (
                  <div key={`other-${idx}`} className="flex items-start gap-2 group">
                    <FileText className="w-3.5 h-3.5 text-[#0078D4] shrink-0 mt-0.5" />
                    <span className="text-[12px] text-[#242424] flex-1 leading-tight italic">{test}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[12px] text-[#A19F9D] italic text-center py-2">No tests selected.</p>
            )}
          </div>
        </div>

        {/* Reason / Indication */}
        <div>
          <Label className="text-[12px] font-bold text-[#242424] mb-1.5 block">
            Reason for Request / Diagnosis <span className="text-[#D13438]">*</span>
          </Label>
          <Textarea
            placeholder="e.g., Routine checkup, R51"
            className={`min-h-[90px] bg-[#FAFAFA] rounded-lg text-[13px] p-3 resize-none transition-all focus:ring-2 focus:ring-[#0078D4]/20 ${
              errors.indication
                ? 'border-[#D13438] focus:border-[#D13438]'
                : 'border-[#EDEBE9] focus:border-[#0078D4]'
            }`}
            value={indication}
            onChange={e => onIndicationChange(e.target.value)}
          />
          <FieldError message={errors.indication} />
        </div>

        {/* Urgency */}
        <div>
          <Label className="text-[12px] font-bold text-[#242424] mb-1.5 block">Urgency</Label>
          <Select value={priority} onValueChange={onPriorityChange}>
            <SelectTrigger className="h-10 text-[13px] border-[#EDEBE9] bg-white focus:border-[#0078D4] focus:ring-2 focus:ring-[#0078D4]/20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Routine">Routine</SelectItem>
              <SelectItem value="Urgent">Urgent</SelectItem>
              <SelectItem value="STAT">STAT</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Fasting Required */}
        <label className="flex items-center gap-2.5 cursor-pointer">
          <Checkbox
            checked={fastingRequired}
            onCheckedChange={v => {
              setFastingRequired(!!v);
              onInstructionsChange(v ? 'Fasting required.' : '');
            }}
            className="data-[state=checked]:bg-[#0078D4] data-[state=checked]:border-[#0078D4]"
          />
          <span className="text-[13px] font-medium text-[#242424]">Fasting Required</span>
        </label>

        {/* Additional notes — shown only when not covered by fasting checkbox */}
        {!fastingRequired && (
          <div>
            <Label className="text-[12px] font-bold text-[#242424] mb-1.5 block">
              Additional Notes
            </Label>
            <Textarea
              placeholder="e.g., Notify results immediately, handle on ice..."
              className="min-h-[70px] bg-[#FAFAFA] border-[#EDEBE9] focus:border-[#0078D4] rounded-lg text-[13px] p-3 resize-none"
              value={instructions}
              onChange={e => onInstructionsChange(e.target.value)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
