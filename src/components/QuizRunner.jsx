import React, { useState } from 'react';
import { Check, X, Trophy, RotateCcw, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { awardXp, unlockAchievement } from '@/lib/studyUtils';
import { base44 } from '@/api/base44Client';
import { toast } from 'react-hot-toast';

export default function QuizRunner({ questions, quizType, materialId, materialTitle, onComplete }) {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!questions || !questions.length) {
    return <p className="text-sm text-muted-foreground text-center py-10">No questions available.</p>;
  }

  const q = questions[current];
  const isTrueFalse = quizType === 'true_false';
  const options = isTrueFalse ? ['True', 'False'] : q.options;
  const correctIndex = isTrueFalse ? (q.is_true ? 0 : 1) : q.answer_index;

  const choose = (i) => {
    if (selected !== null) return;
    setSelected(i);
  };

  const next = async () => {
    const newAnswers = [...answers, { q: isTrueFalse ? q.statement : q.question, selected, correct: correctIndex, correct_bool: selected === correctIndex }];
    setAnswers(newAnswers);
    setSelected(null);
    if (current + 1 < questions.length) {
      setCurrent(current + 1);
    } else {
      await finish(newAnswers);
    }
  };

  const finish = async (allAnswers) => {
    setSubmitting(true);
    const correct = allAnswers.filter((a) => a.correct_bool).length;
    const score = Math.round((correct / questions.length) * 100);
    const weak = Array.from(new Set(
      questions.filter((_, i) => !allAnswers[i].correct_bool).map((qq) => qq.topic || (qq.question || qq.statement || '').slice(0, 30))
    )).slice(0, 6);
    try {
      await base44.entities.QuizAttempt.create({
        material_id: materialId || '',
        material_title: materialTitle || '',
        quiz_type: quizType || 'mcq',
        total_questions: questions.length,
        correct,
        score,
        weak_topics: weak,
        duration_seconds: 0,
        xp_earned: Math.max(10, correct * 5)
      });
      await awardXp(Math.max(10, correct * 5), { quizScore: score, minutes: Math.round(questions.length * 0.5) });
      await unlockAchievement('first_quiz');
      if (score >= 90) await unlockAchievement('quiz_master');
    } catch (e) { /* ignore */ }
    setSubmitting(false);
    setShowResult(true);
    if (onComplete) onComplete({ score, correct, total: questions.length });
  };

  const restart = () => {
    setCurrent(0); setSelected(null); setAnswers([]); setShowResult(false);
  };

  if (showResult) {
    const correct = answers.filter((a) => a.correct_bool).length;
    const score = Math.round((correct / questions.length) * 100);
    const passed = score >= 70;
    return (
      <div className="text-center py-6">
        <div className={cn('w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-4', passed ? 'bg-emerald-100 dark:bg-emerald-900/40' : 'bg-amber-100 dark:bg-amber-900/40')}>
          <Trophy className={cn('w-10 h-10', passed ? 'text-emerald-600' : 'text-amber-600')} />
        </div>
        <h3 className="text-2xl font-heading font-bold">{score}%</h3>
        <p className="text-muted-foreground mt-1">{correct} of {questions.length} correct</p>
        <p className="text-sm mt-2 font-medium">{passed ? 'Great work! 🎉' : 'Keep practicing — you\'ll get there! 💪'}</p>
        <div className="flex gap-3 mt-6 justify-center">
          <Button variant="outline" onClick={restart}><RotateCcw className="w-4 h-4 mr-2" /> Retry</Button>
          {onComplete && <Button onClick={() => onComplete({ score, correct, total: questions.length })} className="bg-violet-600 hover:bg-violet-700">Done</Button>}
        </div>
        <div className="mt-8 text-left space-y-2 max-h-64 overflow-y-auto">
          {answers.map((a, i) => (
            <div key={i} className="flex items-start gap-2 text-sm p-3 rounded-xl bg-muted/50">
              {a.correct_bool ? <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" /> : <X className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />}
              <span className="text-muted-foreground">{a.q}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-semibold text-muted-foreground">Question {current + 1} of {questions.length}</span>
        <div className="w-32 h-1.5 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-violet-500 transition-all" style={{ width: ((current) / questions.length) * 100 + '%' }} />
        </div>
      </div>

      <h3 className="text-lg font-heading font-semibold mb-5 leading-relaxed">
        {isTrueFalse ? q.statement : q.question}
      </h3>

      <div className={cn('space-y-2.5', isTrueFalse && 'grid grid-cols-2 gap-3')}>
        {options.map((opt, i) => {
          const isCorrect = i === correctIndex;
          const isSelected = i === selected;
          return (
            <button
              key={i}
              onClick={() => choose(i)}
              disabled={selected !== null}
              className={cn(
                'w-full text-left px-4 py-3.5 rounded-xl border-2 text-sm font-medium transition-all flex items-center justify-between',
                selected === null && 'border-border hover:border-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/30',
                selected !== null && isCorrect && 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30',
                selected !== null && isSelected && !isCorrect && 'border-rose-500 bg-rose-50 dark:bg-rose-950/30',
                selected !== null && !isCorrect && !isSelected && 'border-border opacity-60'
              )}
            >
              <span>{opt}</span>
              {selected !== null && isCorrect && <Check className="w-4 h-4 text-emerald-500" />}
              {selected !== null && isSelected && !isCorrect && <X className="w-4 h-4 text-rose-500" />}
            </button>
          );
        })}
      </div>

      {selected !== null && (
        <div className="mt-4 p-4 rounded-xl bg-muted/60 text-sm">
          <p className="font-semibold mb-1">{selected === correctIndex ? '✅ Correct!' : '❌ Not quite'}</p>
          <p className="text-muted-foreground">{q.explanation || (isTrueFalse ? (q.is_true ? 'This statement is true.' : 'This statement is false.') : '')}</p>
        </div>
      )}

      <Button
        onClick={next}
        disabled={selected === null || submitting}
        className="w-full mt-5 bg-violet-600 hover:bg-violet-700"
      >
        {current + 1 < questions.length ? <>Next <ArrowRight className="w-4 h-4 ml-1" /></> : 'Finish quiz'}
      </Button>
    </div>
  );
}