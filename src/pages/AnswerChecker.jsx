import React, { useEffect, useRef, useState } from 'react';
import { PenLine, Loader2, UploadCloud, Sparkles, Check, X, Lightbulb, AlertCircle, BookOpen } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { awardXp } from '@/lib/studyUtils';
import ProgressRing from '@/components/ProgressRing';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';

export default function AnswerChecker() {
  const [question, setQuestion] = useState('');
  const [answerText, setAnswerText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [materials, setMaterials] = useState([]);
  const [materialId, setMaterialId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => {
    base44.entities.StudyMaterial.list('-updated_date', 50).then((m) => setMaterials((m || []).filter((x) => x.status === 'ready'))).catch(() => {});
  }, []);

  const onFile = async (file) => {
    if (!file) return;
    setLoading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setImageUrl(file_url);
    } catch (e) { toast.error('Upload failed'); }
    setLoading(false);
  };

  const check = async () => {
    if (!question.trim() && !imageUrl) { toast.error('Add a question and an answer'); return; }
    if (!imageUrl && !answerText.trim()) { toast.error('Provide your answer (text or photo)'); return; }
    setLoading(true); setResult(null);
    try {
      const res = await base44.functions.invoke('checkAnswer', {
        question, material_id: materialId, answer_image_url: imageUrl, answer_text: answerText
      });
      setResult(res.data?.check);
      await awardXp(10, { minutes: 3 });
      toast.success('Answer checked! +10 XP');
    } catch (e) {
      toast.error(e.response?.data?.error || 'Check failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 lg:py-8 space-y-5">
      <div>
        <h1 className="text-2xl font-heading font-bold flex items-center gap-2"><PenLine className="w-6 h-6 text-violet-500" /> AI Answer Checker</h1>
        <p className="text-sm text-muted-foreground mt-1">Upload a photo of your answer — AI grades it, finds gaps, and tells you how to improve.</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">The question</label>
          <textarea value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Paste the question you're answering..." className="w-full min-h-[80px] p-3 rounded-xl border border-border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/40" />
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Reference material (optional)</label>
          <select value={materialId} onChange={(e) => setMaterialId(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40">
            <option value="">No reference</option>
            {materials.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Your answer</label>
          <div className="flex gap-2 mb-3">
            <button onClick={() => fileRef.current?.click()} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-border hover:border-violet-400 text-sm font-medium transition-colors">
              <UploadCloud className="w-4 h-4" /> {imageUrl ? 'Photo added ✓' : 'Upload photo'}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files[0])} />
          </div>
          {imageUrl && <div className="mb-3"><img src={imageUrl} alt="answer" className="max-h-40 rounded-xl border border-border" /></div>}
          <textarea value={answerText} onChange={(e) => setAnswerText(e.target.value)} placeholder="...or type your answer here" className="w-full min-h-[100px] p-3 rounded-xl border border-border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/40" />
        </div>

        <Button onClick={check} disabled={loading} className="w-full bg-violet-600 hover:bg-violet-700">
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Checking...</> : <><Sparkles className="w-4 h-4 mr-1.5" /> Check my answer</>}
        </Button>
      </div>

      {result && (
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center gap-4">
            <ProgressRing value={(result.score / (result.max_score || 10)) * 100} size={84} stroke={8} color={result.score >= 7 ? '#10b981' : result.score >= 4 ? '#f59e0b' : '#ef4444'} />
            <div>
              <p className="text-3xl font-heading font-bold">{result.score}<span className="text-lg text-muted-foreground">/{result.max_score || 10}</span></p>
              <p className="text-sm text-muted-foreground">{result.score >= 7 ? 'Great answer!' : result.score >= 4 ? 'Decent — room to grow' : 'Needs work'}</p>
            </div>
          </div>

          {result.feedback && <p className="text-sm leading-relaxed bg-muted/40 p-3 rounded-xl">{result.feedback}</p>}

          {result.missing_points?.length > 0 && (
            <div>
              <p className="text-sm font-semibold flex items-center gap-1.5 mb-2 text-amber-600"><AlertCircle className="w-4 h-4" /> Missing points</p>
              <ul className="space-y-1.5">{result.missing_points.map((p, i) => <li key={i} className="text-sm text-muted-foreground flex gap-2"><span className="text-amber-500">•</span>{p}</li>)}</ul>
            </div>
          )}
          {result.incorrect_points?.length > 0 && (
            <div>
              <p className="text-sm font-semibold flex items-center gap-1.5 mb-2 text-rose-600"><X className="w-4 h-4" /> Incorrect points</p>
              <ul className="space-y-1.5">{result.incorrect_points.map((p, i) => <li key={i} className="text-sm text-muted-foreground flex gap-2"><span className="text-rose-500">•</span>{p}</li>)}</ul>
            </div>
          )}
          {result.suggestions?.length > 0 && (
            <div>
              <p className="text-sm font-semibold flex items-center gap-1.5 mb-2 text-emerald-600"><Lightbulb className="w-4 h-4" /> How to improve</p>
              <ul className="space-y-1.5">{result.suggestions.map((p, i) => <li key={i} className="text-sm text-muted-foreground flex gap-2"><Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />{p}</li>)}</ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}