import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, StickyNote, FileText, BookOpen, Brain, ListChecks, ToggleRight, ClipboardList, Loader2, Trash2, TrendingUp } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import MarkdownContent from '@/components/MarkdownContent';
import FlashcardViewer from '@/components/FlashcardViewer';
import QuizRunner from '@/components/QuizRunner';
import ProgressRing from '@/components/ProgressRing';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';

const TABS = [
  { id: 'simple_notes', label: 'Simple Notes', icon: StickyNote, type: 'notes' },
  { id: 'detailed_notes', label: 'Detailed Notes', icon: FileText, type: 'notes' },
  { id: 'revision_sheet', label: 'Revision Sheet', icon: BookOpen, type: 'notes' },
  { id: 'flashcards', label: 'Flashcards', icon: Brain, type: 'cards' },
  { id: 'mcqs', label: 'MCQs', icon: ListChecks, type: 'quiz' },
  { id: 'true_false', label: 'True/False', icon: ToggleRight, type: 'quiz' },
  { id: 'practice_test', label: 'Practice Test', icon: ClipboardList, type: 'quiz' }
];

export default function StudyMaterialDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [material, setMaterial] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('simple_notes');

  useEffect(() => {
    base44.entities.StudyMaterial.get(id).then((m) => {
      setMaterial(m);
      const firstReady = (m.generated_types || []).find((t) => TABS.find((x) => x.id === t));
      if (firstReady) setTab(firstReady);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  const remove = async () => {
    await base44.entities.StudyMaterial.delete(id);
    navigate('/library');
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-violet-500 animate-spin" /></div>;
  if (!material) return <div className="text-center py-20"><p className="text-muted-foreground">Material not found.</p><Link to="/library" className="text-violet-500 text-sm">Back to library</Link></div>;

  const activeTab = TABS.find((t) => t.id === tab);
  const available = TABS.filter((t) => (material.generated_types || []).includes(t.id));
  const avgMastery = material.topics?.length ? Math.round(material.topics.reduce((s, t) => s + (t.mastery || 0), 0) / material.topics.length) : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 lg:py-8">
      <Link to="/library" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4"><ArrowLeft className="w-4 h-4" /> Library</Link>

      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h1 className="text-2xl font-heading font-bold leading-tight">{material.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{material.subject} · {material.grade_level}</p>
        </div>
        <button onClick={remove} className="p-2 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"><Trash2 className="w-4 h-4" /></button>
      </div>

      {material.topics?.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-4 mb-5">
          <div className="flex items-center gap-2 mb-3"><TrendingUp className="w-4 h-4 text-emerald-500" /><span className="text-sm font-semibold">Topic Mastery</span><span className="text-xs text-muted-foreground ml-auto">avg {avgMastery}%</span></div>
          <div className="flex flex-wrap gap-4">
            {material.topics.map((t, i) => (
              <div key={i} className="flex items-center gap-2">
                <ProgressRing value={t.mastery || 0} size={44} stroke={4} color={t.mastery >= 70 ? '#10b981' : t.mastery >= 40 ? '#f59e0b' : '#ef4444'} />
                <span className="text-xs font-medium max-w-[120px] leading-tight">{t.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-2 mb-5 -mx-1 px-1">
        {available.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={cn('flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all border',
                tab === t.id ? 'bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-500/20' : 'border-border hover:border-violet-300 text-muted-foreground')}>
              <Icon className="w-4 h-4" /> {t.label}
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 lg:p-6">
        {activeTab?.type === 'notes' && <MarkdownContent content={material[tab]} />}
        {activeTab?.id === 'flashcards' && <FlashcardViewer cards={material.flashcards} materialId={material.id} onComplete={() => toast.success('+XP earned!')} />}
        {activeTab?.id === 'mcqs' && <QuizRunner questions={material.mcqs} quizType="mcq" materialId={material.id} materialTitle={material.title} />}
        {activeTab?.id === 'true_false' && <QuizRunner questions={material.true_false} quizType="true_false" materialId={material.id} materialTitle={material.title} />}
        {activeTab?.id === 'practice_test' && <QuizRunner questions={material.practice_test} quizType="practice_test" materialId={material.id} materialTitle={material.title} />}
      </div>
    </div>
  );
}