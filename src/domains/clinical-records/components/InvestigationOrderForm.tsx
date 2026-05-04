import React, { useState } from 'react';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { Input } from '../../../components/ui/input';
import { Search, X, FileText } from 'lucide-react';
import { Button } from '../../../components/ui/button';

export type OrderCategory = 'laboratory' | 'imaging' | 'functional' | null;

interface InvestigationOrderFormProps {
  category: NonNullable<OrderCategory>;
  selectedTests: string[];
  searchQuery: string;
  indication: string;
  instructions: string;
  priority: string;
  onSearchChange: (q: string) => void;
  onToggleTest: (test: string) => void;
  onIndicationChange: (val: string) => void;
  onInstructionsChange: (val: string) => void;
  onPriorityChange: (val: string) => void;
}

export function InvestigationOrderForm({
  category,
  selectedTests,
  searchQuery,
  indication,
  instructions,
  priority,
  onSearchChange,
  onToggleTest,
  onIndicationChange,
  onInstructionsChange,
  onPriorityChange
}: InvestigationOrderFormProps) {

  const filteredItems = (items: string[]) => {
    if (!searchQuery) return items;
    return items.filter(i => i.toLowerCase().includes(searchQuery.toLowerCase()));
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Left Column - Search & Selection */}
      <div className="w-full lg:w-2/3 space-y-6">
        <div className="bg-white p-5 rounded-xl border border-[#EDEBE9] shadow-sm">
          <Label className="text-[13px] font-bold text-[#242424] mb-2 block">Search {category} items</Label>
          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              <Search className="h-4 w-4 text-[#A19F9D] group-focus-within:text-[#0078D4] transition-colors" />
            </div>
            <Input 
              placeholder={`Search items by name or code...`}
              className="h-11 pl-10 bg-[#FAFAFA] border-[#EDEBE9] focus:bg-white focus:border-[#0078D4] focus:ring-2 focus:ring-[#0078D4]/20 rounded-lg text-[14px] transition-all"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
          
          <div className="mt-5 pt-5 border-t border-[#F3F2F1]">
            <Label className="text-[11px] font-bold text-[#616161] uppercase tracking-widest mb-3 block">Common Items</Label>
            <div className="flex flex-wrap gap-2">
              {category === 'laboratory' && filteredItems([
                'CBC with Diff', 'Comprehensive Metabolic Panel', 'Basic Metabolic Panel',
                'Lipid Panel', 'TSH', 'HbA1c', 'Urinalysis', 'PT/INR', 'Vitamin B12', 'Vitamin D'
              ]).map(t => (
                <button 
                  key={t}
                  type="button"
                  onClick={() => onToggleTest(t)}
                  className={`px-3 py-1.5 text-[12px] font-semibold rounded-full border transition-colors ${selectedTests.includes(t) ? 'bg-[#0078D4] text-white border-[#0078D4]' : 'bg-[#FAFAFA] text-[#616161] border-[#EDEBE9] hover:border-[#A19F9D]'}`}
                >
                  {t}
                </button>
              ))}
              {category === 'imaging' && filteredItems([
                'Chest X-Ray', 'CT Head without contrast', 'CT Abdomen', 'Ultrasound Pelvis',
                'MRI Brain', 'MRI Lumbar Spine', 'Ultrasound Abdomen', 'Mammogram'
              ]).map(t => (
                <button 
                  key={t}
                  type="button"
                  onClick={() => onToggleTest(t)}
                  className={`px-3 py-1.5 text-[12px] font-semibold rounded-full border transition-colors ${selectedTests.includes(t) ? 'bg-[#0078D4] text-white border-[#0078D4]' : 'bg-[#FAFAFA] text-[#616161] border-[#EDEBE9] hover:border-[#A19F9D]'}`}
                >
                  {t}
                </button>
              ))}
              {category === 'functional' && filteredItems([
                '12-Lead ECG', 'Echocardiogram', 'Holter Monitor (24h)', 'Sleep Study', 'Stress Test (Treadmill)'
              ]).map(t => (
                <button 
                  key={t}
                  type="button"
                  onClick={() => onToggleTest(t)}
                  className={`px-3 py-1.5 text-[12px] font-semibold rounded-full border transition-colors ${selectedTests.includes(t) ? 'bg-[#0078D4] text-white border-[#0078D4]' : 'bg-[#FAFAFA] text-[#616161] border-[#EDEBE9] hover:border-[#A19F9D]'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#EDEBE9] shadow-sm">
          <Label className="text-[13px] font-bold text-[#242424] mb-3 block">Clinical Indication / Diagnosis Details <span className="text-[#D13438]">*</span></Label>
          <Textarea 
            placeholder="Reason for requesting this test (e.g., suspected anemia, R51)..." 
            className="min-h-[100px] bg-[#FAFAFA] border-[#EDEBE9] focus:bg-white focus:border-[#0078D4] focus:ring-2 focus:ring-[#0078D4]/20 rounded-lg text-[14px] p-3 leading-relaxed resize-y transition-all"
            value={indication}
            onChange={(e) => onIndicationChange(e.target.value)}
          />
        </div>
      </div>

      {/* Right Column - Summary & Actions */}
      <div className="w-full lg:w-1/3 space-y-6">
        {/* Summary Card */}
        <div className="bg-[#F3F9FD] p-5 rounded-xl border border-[#DEECF9]">
          <h4 className="text-[11px] font-bold text-[#005A9E] uppercase tracking-widest mb-3">Selected Items</h4>
          {selectedTests.length > 0 ? (
            <div className="space-y-3">
               {selectedTests.map(test => (
                 <div key={test} className="flex items-start gap-3 bg-white p-2.5 rounded-lg border border-[#DEECF9]">
                   <FileText className="w-4 h-4 text-[#0078D4] shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <span className="text-[13px] font-bold text-[#242424] block">{test}</span>
                    </div>
                    <button type="button" onClick={() => onToggleTest(test)} className="text-[#A19F9D] hover:text-[#D13438]">
                      <X className="w-4 h-4" />
                    </button>
                 </div>
               ))}
            </div>
          ) : (
            <div className="py-4 text-center">
              <p className="text-[12px] text-[#0078D4]/70 italic">No tests selected yet. Search or select from common items.</p>
            </div>
          )}
        </div>

        {/* Priority */}
        <div className="space-y-2">
          <Label className="text-[13px] font-bold text-[#242424]">Priority Status</Label>
          <div className="grid grid-cols-3 gap-2">
            {['Routine', 'Urgent', 'STAT'].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => onPriorityChange(p)}
                className={`h-10 rounded-lg border text-[12px] font-bold transition-all ${
                  priority === p 
                    ? p === 'STAT' ? 'bg-[#FDF3F4] border-[#D13438] text-[#D13438]' : 'bg-[#F3F9FD] border-[#0078D4] text-[#0078D4]'
                    : 'bg-white border-[#EDEBE9] text-[#616161] hover:bg-[#F3F2F1]'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="space-y-2">
          <Label className="text-[13px] font-bold text-[#242424]">Handling Requirements or Notes</Label>
          <Textarea 
            placeholder="e.g., Fasting 12hrs, notify results immediately..." 
            className="min-h-[80px] bg-white border-[#EDEBE9] focus:border-[#0078D4] rounded-lg text-[13px] p-3 resize-y"
            value={instructions}
            onChange={(e) => onInstructionsChange(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
