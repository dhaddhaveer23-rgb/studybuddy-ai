import React, { useEffect, useState } from 'react';
import { CalendarRange, Sparkles, Loader2, Check, Clock, Target, Zap } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { gradeLevels, awardXp, unlockAchievement } from '@/lib/studyUtils';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';

export default function StudyPlanner() {
  const [exams, setExams] = useState([]);
  const [plans, setPlans] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [form, setForm] = useState({ exam_title: '', exam_date: '', hours_per_day: 2, grade_level: 'High School' });

  const load = async () => {
    const [e, p, a] = await Promise.all([
      base44.entities.Exam.list('-exam_date', 10).catch(() => []),
      base44.entities.StudyPlan.list('-created_date', 5).catch(() => []),
      base44.entities.QuizAttempt.list('-created_date', 30).catch(() => [])
    ]);
    setExams(e || []); setPlans(p || []); setAttempts(a || []);
    if (e && e[0]) setForm((f) => ({ ...f, exam_title: e[0].title, exam_date: e[0].exam_date }));
  };
  useEffect(() => { load(); }, []);

  const weakTopics = Array.from(new Set(attempts.flatMap((a) => a.weak_topics || []))).slice(0, 6);

  const generate = async () => {
    if (!form.exam_title) { toast.error('Pick or name an exam'); return; }
    setGenerating(true);
    try {
      const res = await base44.functions.invoke('generateStudyPlan', { ...form, weak_topics: weakTopics });
      await awardXp(15);
      await unlockAchievement('plan_maker');
      toast.success('Study plan created! 🗓️');
      load();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to generate plan');
    } finally {
      setGenerating(false);
    }
  };

  const toggleTask = async (plan, dayIdx, taskIdx) => {
    const newPlan = [...plan.plan];
    const tasks = [...(newPlan[dayIdx].tasks || [])];
    tasks[taskIdx] = { ...tasks[taskIdx], done: !tasks[taskIdx].done };
    newPlan[dayIdx] = { ...newPlan[dayIdx], tasks };
    await base44.entities.StudyPlan.update(plan.id, { plan: newPlan });
    load();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold flex items-center gap-2"><CalendarRange className="w-6 h-6 text-violet-500" /> Study Planner</h1>
        <p className="text-sm text-muted-foreground mt-1">AI builds a personalized plan around your exams and weak spots.</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-heading font-semibold mb-3 flex items-center gap-2"><Sparkles className="w-4 h-4 text-violet-500" /> Generate a plan</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Exam</label>
            <select value={form.exam_title} onChange={(e) => { const ex = exams.find((x) => x.title === e.target.value); setForm({ ...form, exam_title: e.target.value, exam_date: ex?.exam_date || form.exam_date }); }} className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40">
              <option value="">Custom exam</option>
              {exams.map((e) => <option key={e.id} value={e.title}>{e.title}</option>)}
            </select>
          </div>
          <div><label className="text-xs font-semibold text-muted-foreground mb-1 block">Exam date</label><input type="date" value={form.exam_date} onChange={(e) => setForm({ ...form, exam_date: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40" /></div>
          <div><label className="text-xs font-semibold text-muted-foreground mb-1 block">Hours / day</label><input type="number" min="1" max="8" value={form.hours_per_day} onChange={(e) => setForm({ ...form, hours_per_day: Number(e.target.value) })} className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40" /></div>
          <div><label className="text-xs font-semibold text-muted-foreground mb-1 block">Grade</label><select value={form.grade_level} onChange={(e) => setForm({ ...form, grade_level: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none">{gradeLevels().map((g) => <option key={g}>{g}</option>)}</select></div>
        </div>
        {weakTopics.length > 0 && <p className="text-xs text-muted-foreground mt-3">📌 Focusing on your weak topics: {weakTopics.join(', ')}</p>}
        <Button onClick={generate} disabled={generating} className="w-full mt-4 bg-violet-600 hover:bg-violet-700">{generating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating plan...</> : <><Sparkles className="w-4 h-4 mr-1.5" /> Generate study plan</>}</Button>
      </div>

      {plans.map((plan) => (
        <div key={plan.id} className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-heading font-bold text-lg mb-4">{plan.title}</h2>
          <div className="space-y-4">
            {plan.plan.map((day, di) => (
              <div key={di} className="border-l-2 border-violet-300 dark:border-violet-700 pl-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400">Day {day.day}</span>
                  <span className="text-xs text-muted-foreground">{day.focus}</span>
                </div>
                <div className="space-y-1.5">
                  {(day.tasks || []).map((task, ti) => (
                    <button key={ti} onClick={() => toggleTask(plan, di, ti)} className="w-full flex items-center gap-2.5 text-left group">
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${task.done ? 'bg-emerald-500 border-emerald-500' : 'border-border group-hover:border-emerald-400'}`}>{task.done && <Check className="w-2.5 h-2.5 text-white" />}</div>
                      <span className={`text-sm flex-1 ${task.done ? 'line-through text-muted-foreground' : ''}`}>{task.title}</span>
                      {task.minutes > 0 && <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><Clock className="w-3 h-3" />{task.minutes}m</span>}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {plans.length === 0 && !generating && (
        <div className="text-center py-12">
          <div className="w-14 h-14 rounded-2xl bg-violet-100 dark:bg-violet-950/40 flex items-center justify-center mx-auto mb-3"><CalendarRange className="w-7 h-7 text-violet-500" /></div>
          <p className="font-semibold text-sm">No plans yet</p>
          <p className="text-xs text-muted-foreground mt-1">Generate your first AI study plan above.</p>
        </div>
      )}
    </div>
  );
}