import React, { useEffect, useRef, useState } from 'react';
import { Files, Loader2, UploadCloud, Sparkles, Trash2, Tag, TrendingUp, ListChecks, ChevronDown, ChevronRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { awardXp } from '@/lib/studyUtils';
import QuizRunner from '@/components/QuizRunner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';

const diffClass = {
  Easy: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
  Medium: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  Hard: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
};

export default function PastPapers() {
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(null);
  const [quizMode, setQuizMode] = useState(false);
  const fileRef = useRef(null);

  const load = async () => {
    const p = await base44.entities.PastPaper.list('-created_date', 30).catch(() => []);
    setPapers(p || []);
  };
  useEffect(() => { load(); }, []);

  const onFile = async (file) => {
    if (!file) return;
    setLoading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const res = await base44.functions.invoke('analyzePastPaper', { file_url, title: file.name.replace(/\.[^.]+$/, '') });
      await awardXp(15);
      toast.success('Past paper analyzed! 📄');
      load();
      setActive(res.data?.paper);
    } catch (e) {
      toast.error(e.response?.data?.error || 'Analysis failed');
    } finally { setLoading(false); }
  };

  const remove = async (id) => { await base44.entities.PastPaper.delete(id); load(); if (active?.id === id) setActive(null); };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-5">
      <div>
        <h1 className="text-2xl font-heading font-bold flex items-center gap-2"><Files className="w-6 h-6 text-violet-500" /> Past Paper Mode</h1>
        <p className="text-sm text-muted-foreground mt-1">Upload a past exam paper — AI maps topics, difficulty & question types, then generates practice questions and a revision list.</p>
      </div>

      <div className="rounded-2xl border-2 border-dashed border-border hover:border-violet-400 p-8 text-center cursor-pointer transition-colors" onClick={() => !loading && fileRef.current?.click()}>
        <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => onFile(e.target.files[0])} />
        {loading ? <><Loader2 className="w-8 h-8 text-violet-500 animate-spin mx-auto" /><p className="text-sm font-medium mt-3">Analyzing past paper...</p><p className="text-xs text-muted-foreground mt-1">Reading questions, topics & difficulty</p></> : (
          <>
            <div className="w-14 h-14 rounded-2xl bg-violet-100 dark:bg-violet-950/40 flex items-center justify-center mx-auto mb-3"><UploadCloud className="w-7 h-7 text-violet-500" /></div>
            <p className="font-semibold text-sm">Upload a past exam paper</p>
            <p className="text-xs text-muted-foreground mt-1">Photo or PDF — tap to browse</p>
          </>
        )}
      </div>

      {papers.length > 0 && !active && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Analyzed papers</p>
          {papers.map((p) => (
            <div key={p.id} className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-card group">
              <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-950/40 flex items-center justify-center"><Files className="w-5 h-5 text-violet-500" /></div>
              <button onClick={() => { setActive(p); setQuizMode(false); }} className="flex-1 text-left min-w-0"><p className="font-semibold text-sm truncate">{p.title}</p><p className="text-xs text-muted-foreground">{p.subjects?.join(', ') || 'General'} · {p.difficulty}</p></button>
              <button onClick={() => remove(p.id)} className="p-2 rounded-lg text-muted-foreground hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      )}

      {active && (
        <div className="space-y-4">
          <button onClick={() => setActive(null)} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">← Back to papers</button>
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-heading font-bold text-lg">{active.title}</h2>
            {active.summary && <p className="text-sm text-muted-foreground mt-1">{active.summary}</p>}
            <div className="flex flex-wrap gap-2 mt-3">
              <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full', diffClass[active.difficulty] || diffClass.Medium)}>{active.difficulty}</span>
              {active.question_types?.map((q) => <span key={q} className="text-xs font-medium px-2.5 py-1 rounded-full bg-muted text-muted-foreground">{q}</span>)}
            </div>
            <div className="grid sm:grid-cols-2 gap-4 mt-4">
              <div><p className="text-xs font-semibold text-muted-foreground mb-1.5">Subjects</p><div className="flex flex-wrap gap-1.5">{active.subjects?.map((s) => <span key={s} className="text-xs px-2 py-0.5 rounded-md bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400">{s}</span>)}</div></div>
              <div><p className="text-xs font-semibold text-muted-foreground mb-1.5">Topics</p><div className="flex flex-wrap gap-1.5">{active.topics?.map((s) => <span key={s} className="text-xs px-2 py-0.5 rounded-md bg-muted text-muted-foreground">{s}</span>)}</div></div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-heading font-semibold flex items-center gap-2"><ListChecks className="w-4 h-4 text-violet-500" /> Practice questions</h3>
              <Button size="sm" variant="outline" onClick={() => setQuizMode((q) => !q)}>{quizMode ? 'Hide' : 'Take quiz'}</Button>
            </div>
            {quizMode && active.generated_questions?.length > 0 ? (
              <QuizRunner questions={active.generated_questions} quizType="mcq" materialTitle={active.title} onComplete={() => setQuizMode(false)} />
            ) : (
              <p className="text-sm text-muted-foreground">{active.generated_questions?.length || 0} questions generated. Tap "Take quiz" to practice.</p>
            )}
          </div>

          {active.revision_list?.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="font-heading font-semibold flex items-center gap-2 mb-3"><TrendingUp className="w-4 h-4 text-emerald-500" /> Revision list</h3>
              <div className="space-y-2">
                {active.revision_list.map((r, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-muted/40">
                    <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', r.priority === 'High' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400' : r.priority === 'Medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400')}>{r.priority}</span>
                    <div className="min-w-0"><p className="text-sm font-medium">{r.topic}</p>{r.reason && <p className="text-xs text-muted-foreground">{r.reason}</p>}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}