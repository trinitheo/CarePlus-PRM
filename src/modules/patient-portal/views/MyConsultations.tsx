import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { 
  FileText, Calendar, User, Eye, EyeOff, Sparkles, Loader2, 
  CheckCircle, ChevronDown, ChevronUp, Lock, RefreshCw, HelpCircle 
} from 'lucide-react';
import Markdown from 'react-markdown';
import { generatePlainLanguageSummary } from '../../../services/aiService';

interface MyConsultationsProps {
  patientData: any;
}

export function MyConsultations({ patientData }: MyConsultationsProps) {
  const records = patientData?.clinical_records || [];
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);
  const [plainSummaries, setPlainSummaries] = useState<Record<string, string>>({});
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [viewMode, setViewMode] = useState<'patient' | 'technical'>('patient');

  // Trigger plain language generation for a record
  const handleTranslate = async (record: any) => {
    if (plainSummaries[record.id] || loadingMap[record.id]) return;

    setLoadingMap(prev => ({ ...prev, [record.id]: true }));
    try {
      const summary = await generatePlainLanguageSummary({
        title: record.title,
        subjective: record.subjective,
        objective: record.objective,
        assessment: record.assessment,
        plan: record.plan,
        icd10Codes: record.icd10Codes || [],
        content: record.content
      });
      setPlainSummaries(prev => ({ ...prev, [record.id]: summary }));
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMap(prev => ({ ...prev, [record.id]: false }));
    }
  };

  const formatDate = (dateValue: any) => {
    if (!dateValue) return 'Recent Visit';
    try {
      const date = dateValue.seconds ? new Date(dateValue.seconds * 1000) : new Date(dateValue);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return String(dateValue);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Module Header card */}
      <Card className="border border-emerald-100 shadow-sm bg-gradient-to-r from-emerald-50/40 via-white to-blue-50/20">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 text-[10px] font-black uppercase tracking-wider rounded-full border border-emerald-100">
                <FileText className="h-3 w-3" />
                <span>Encounter Records Vault</span>
              </div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">My Consultation Notes & Plain Summaries</h2>
              <p className="text-xs text-slate-500 font-medium max-w-2xl">
                Access your provider encounter notes, redacted of clinic-internal technical logging, paired with AI-powered plain English translations.
              </p>
            </div>
            
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
              <button
                onClick={() => setViewMode('patient')}
                className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'patient' 
                    ? 'bg-emerald-600 text-white shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Eye className="h-3 w-3" /> Patient View
              </button>
              <button
                onClick={() => setViewMode('technical')}
                className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'technical' 
                    ? 'bg-amber-600 text-white shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Lock className="h-3 w-3" /> Technical View
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Records Display */}
      <div className="space-y-4">
        {records.length === 0 ? (
          <div className="text-center p-8 bg-white border border-[#EBEFEA] rounded-2xl border-dashed">
            <FileText className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-black text-slate-800">No Consultation History Yet</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Once you complete an appointment with your health care team, the finalized clinical SOAP note summary will appear here.
            </p>
          </div>
        ) : (
          records.map((record: any) => {
            const isExpanded = expandedRecordId === record.id;
            const summaryText = plainSummaries[record.id];
            const isLoading = loadingMap[record.id];

            return (
              <Card 
                key={record.id} 
                className={`border transition-all duration-200 shadow-xs ${
                  isExpanded ? 'border-emerald-300 ring-2 ring-emerald-500/5 bg-white' : 'border-slate-200 hover:bg-slate-50/40 bg-white'
                }`}
              >
                {/* Header overview area always visible */}
                <div 
                  onClick={() => {
                    setExpandedRecordId(isExpanded ? null : record.id);
                    // Proactively load translation on first expand
                    if (!isExpanded && !summaryText) {
                      handleTranslate(record);
                    }
                  }}
                  className="p-5 flex items-center justify-between gap-4 cursor-pointer select-none"
                >
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 shrink-0">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 truncate tracking-tight">{record.title || 'General Consultation'}</h4>
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-xs text-slate-500">
                        <span className="flex items-center gap-1 font-medium text-slate-700">
                          <User className="h-3 w-3 text-emerald-600" /> {record.authorName || 'Clinical Provider'}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="font-semibold text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-100 px-1.5 py-0.25 rounded-md uppercase tracking-wider">
                          {record.specialty || 'General Care'}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="flex items-center gap-1 font-medium font-mono text-[11px]">
                          <Calendar className="h-3 w-3 text-slate-400" /> {formatDate(record.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="shrink-0 flex items-center gap-3">
                    <Badge className="bg-emerald-50 text-emerald-800 border-emerald-100 font-bold text-[9px] uppercase tracking-wider">
                      {record.status || 'Signed'}
                    </Badge>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                  </div>
                </div>

                {/* Expanded Patient details body */}
                {isExpanded && (
                  <div className="px-5 pb-6 pt-2 border-t border-slate-100 space-y-6">
                    {/* Mode-specific content panel */}
                    {viewMode === 'patient' ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* 1. Patient friendly overview cards - REDACTED Subjective/Objective fields */}
                        <div className="space-y-4">
                          <div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Clinical Logs Redaction</span>
                            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl text-slate-500 text-xs leading-relaxed space-y-2.5 mt-1.5">
                              <div className="flex items-start gap-2 text-slate-400 font-medium">
                                <Lock className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                                <span>Subjective & Objective clinician-only raw tracking fields have been redacted from direct view to prevent diagnostic jargon confusion. Use the AI Translator panel to summarize.</span>
                              </div>
                            </div>
                          </div>

                          {/* Treatment Plan Section (Patient-Focused) */}
                          <div className="space-y-1.5">
                            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 block">My Active Directives & Care Guidelines</span>
                            <div className="p-4 bg-emerald-50/25 border border-emerald-100/60 rounded-2xl">
                              {record.plan ? (
                                <p className="text-xs text-slate-700 leading-relaxed font-medium whitespace-pre-wrap">{record.plan}</p>
                              ) : (
                                <p className="text-xs text-slate-500 italic">No direct action plan was logged for this encounter.</p>
                              )}
                            </div>
                          </div>

                          {/* Diagnostic Summary */}
                          {record.icd10Codes && record.icd10Codes.length > 0 && (
                            <div className="space-y-1.5">
                              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Target Diagnoses Covered</span>
                              <div className="flex flex-wrap gap-1.5">
                                {record.icd10Codes.map((code: string, idx: number) => (
                                  <Badge key={idx} className="bg-slate-100 text-slate-800 border-slate-200/80 font-mono text-[10px] py-1">
                                    {code} • {code.startsWith('E11') || code.startsWith('E08') ? 'Type 2 Diabetes' : code.startsWith('E28') ? 'PCOS' : 'Under Supervision'}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* 2. Plain Language translation card powered by Gemini */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 flex items-center gap-1">
                              <Sparkles className="h-3.5 w-3.5" />
                              Plain English Patient digested translation
                            </span>
                            {!summaryText && !isLoading && (
                              <Button
                                size="xs"
                                variant="outline"
                                onClick={() => handleTranslate(record)}
                                className="h-6 px-2 text-[9px] font-black uppercase tracking-widest text-[#0078D4] border-[#0078D4] hover:bg-sky-50"
                              >
                                <RefreshCw className="h-2.5 w-2.5 mr-1" /> Re-Translate
                              </Button>
                            )}
                          </div>

                          <div className="p-5 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/20 via-white to-indigo-50/10 min-h-36 flex flex-col justify-between">
                            {isLoading ? (
                              <div className="flex flex-col items-center justify-center py-8 text-center space-y-2.5">
                                <Loader2 className="h-6 w-6 animate-spin text-[#0078D4]" />
                                <span className="text-xs font-bold text-slate-500">Retrieving plain English clinical summary...</span>
                              </div>
                            ) : summaryText ? (
                              <div className="text-xs text-slate-700 leading-relaxed font-medium prose prose-slate max-w-none">
                                <Markdown>{summaryText}</Markdown>
                              </div>
                            ) : (
                              <div className="py-8 text-center space-y-3">
                                <p className="text-xs text-slate-500">Need help understanding medical terms or raw notes?</p>
                                <Button
                                  size="sm"
                                  onClick={() => handleTranslate(record)}
                                  className="mx-auto bg-[#0078D4] hover:bg-[#005A9E] text-white font-black text-[10px] uppercase tracking-wider px-4"
                                >
                                  Translate to Plain English
                                </Button>
                              </div>
                            )}

                            {/* Guarded context explanation */}
                            <div className="pt-3 border-t border-slate-100 mt-4 flex items-center gap-2 text-[9.5px] text-slate-400 italic">
                              <Lock className="h-3 w-3" />
                              <span>Protected plain English summaries are computed using secure, clinical-grade medical decoders.</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Raw clinician technical view
                      <div className="space-y-4">
                        <div className="p-3.5 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl text-xs flex items-start gap-2">
                          <Lock className="h-4.5 w-4.5 shrink-0 text-amber-600 mt-0.5" />
                          <div>
                            <strong>Clinical Technical View Active:</strong> This screen exposes the unmodified SOAP note fields and ICD-10 diagnostic billing markers. Some parts of these fields use clinical shorthand standard for team charting.
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                          <div className="p-4 border rounded-xl bg-slate-50 space-y-1">
                            <span className="text-[10px] text-slate-400 font-bold uppercase block font-sans">[S] SUBJECTIVE / CHIEF COMPLAINT</span>
                            <div className="text-slate-800 leading-normal font-medium whitespace-pre-wrap">{record.subjective || record.content || 'No subjective complaints logged.'}</div>
                          </div>

                          <div className="p-4 border rounded-xl bg-slate-50 space-y-1">
                            <span className="text-[10px] text-slate-400 font-bold uppercase block font-sans">[O] OBJECTIVE / CLINICAL FINDINGS & VITALS</span>
                            <div className="text-slate-800 leading-normal font-medium whitespace-pre-wrap">{record.objective || 'No objective vitals or examinations registered.'}</div>
                          </div>

                          <div className="p-4 border rounded-xl bg-slate-50 space-y-1">
                            <span className="text-[10px] text-slate-400 font-bold uppercase block font-sans">[A] ASSESSMENT / MEDICAL CONCLUSION</span>
                            <div className="text-slate-800 leading-normal font-medium whitespace-pre-wrap">{record.assessment || 'Under continuous clinical review.'}</div>
                          </div>

                          <div className="p-4 border rounded-xl bg-slate-50 space-y-1">
                            <span className="text-[10px] text-slate-400 font-bold uppercase block font-sans">[P] PLAN / PHARMACOTHERAPY & ORDERS</span>
                            <div className="text-slate-800 leading-normal font-medium whitespace-pre-wrap">{record.plan || 'Establish default telemetry baselines.'}</div>
                          </div>
                        </div>

                        {record.icd10Codes && record.icd10Codes.length > 0 && (
                          <div className="p-4 border border-dashed rounded-xl space-y-2">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Recorded ICD-10 Classification codes</span>
                            <div className="flex flex-wrap gap-2">
                              {record.icd10Codes.map((code: string, idx: number) => (
                                <Badge key={idx} className="bg-slate-100 text-slate-800 border-slate-200/80 font-mono text-xs font-semibold">
                                  {code}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
