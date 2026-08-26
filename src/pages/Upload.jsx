import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Loader2, Check, FileText, Brain, ListChecks, ToggleRight, ClipboardList, StickyNote, BookOpen } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import UploadZone from '@/components/UploadZone';
import { gradeLevels, awardXp, unlockAchievement } from '@/lib/studyUtils';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';

const TYPES = [
  { id: 'simple_notes', label: 'Simple Notes', icon: StickyNote },
  { id: 'detailed_notes', label: 'Detailed Notes', icon: FileText },
  { id: 'revision_sheet', label: 'Revision Sheet', icon: BookOpen },
  { id: 'flashcards', label: 'Flashcards', icon: Brain },
  { id: 'mcqs', label: 'MCQs', icon: ListChecks },
  { id: 'true_false', label: 'True / False', icon: ToggleRight },
  { id: 'practice_test', label: 'Practice Test', icon: ClipboardList }
];

export default function Upload() {
  const navigate = useNavigate();
  const [grade, setGrade] = useState('High School');
  const [subject, setSubject] = useState('');
  const [title, setTitle] = useState('');
  const [selectedTypes, setSelectedTypes] = useState(TYPES.map((t) => t.id));
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState('');

  const toggleType = (id) => {
    setSelectedTypes((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
  };

  const generate = async (sourceContent, fileUrl) => {
    if (selectedTypes.length === 0) { toast.error('Select at least one resource type'); return; }
    setLoading(true); setStage('Uploading & analyzing...');
    try {
      const res = await base44.functions.invoke('generateStudyMaterials', {
        title: title || (subject ? subject + ' notes' : 'New Study Material'),
        source_content: sourceContent || '',
        file_url: fileUrl || '',
        grade_level: grade,
        subject: subject || 'General',
        material_types: selectedTypes
      });
      const material = res.data?.material;
      if (material) {
        await awardXp(20);
        await unlockAchievement('upload_5');
        toast.success('Study materials ready! 🎉');
        navigate(`/material/${material.id}`);
      } else {
        toast.error('Could not generate materials');
      }
    } catch (e) {
      toast.error(e.response?.data?.error || e.message || 'Generation failed');
    } finally {
      setLoading(false); setStage('');
    }
  };

  const handleFile = async (file) => {
    if (!file) return;
    setLoading(true); setStage('Uploading file...');
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await generate('', file_url);
    } catch (e) {
      toast.error('Upload failed');
      setLoading(false); setStage('');
    }
  };

  const handleText = (text) => generate(text, '');

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 lg:py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-bold flex items-center gap-2"><Sparkles className="w-6 h-6 text-violet-500" /> Create Study Materials</h1>
        <p className="text-sm text-muted-foreground mt-1">Upload a textbook chapter, paste text, or snap a photo — AI turns it into everything you need.</p>
      </div>

      <div className="space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Title (optional)</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Chapter 5: Photosynthesis"
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Subject</label>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Biology"
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40" />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Grade level</label>
          <div className="flex flex-wrap gap-2">
            {gradeLevels().map((g) => (
              <button key={g} onClick={() => setGrade(g)}
                className={cn('px-3.5 py-2 rounded-xl text-sm font-medium border transition-all',
                  grade === g ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400' : 'border-border hover:border-violet-300')}>
                {g}
              </button>
            ))}
          </div>
        </div>

        <UploadZone onFile={handleFile} onText={handleText} disabled={loading} />

        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-2 block">What should we generate?</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {TYPES.map((t) => {
              const active = selectedTypes.includes(t.id);
              const Icon = t.icon;
              return (
                <button key={t.id} onClick={() => toggleType(t.id)}
                  className={cn('flex items-center gap-2.5 p-3 rounded-xl border-2 text-left transition-all',
                    active ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/30' : 'border-border opacity-60')}>
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', active ? 'bg-violet-600 text-white' : 'bg-muted text-muted-foreground')}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold flex-1">{t.label}</span>
                  {active && <Check className="w-4 h-4 text-violet-600" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {loading && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-10 h-10 text-violet-500 animate-spin mx-auto" />
            <p className="text-sm font-medium mt-4">{stage || 'Working on it...'}</p>
            <p className="text-xs text-muted-foreground mt-1">AI is reading your material and crafting resources</p>
          </div>
        </div>
      )}
    </div>
  );
}