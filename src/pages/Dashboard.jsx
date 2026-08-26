import React, { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { Flame, Target, CalendarClock, BookOpen, TrendingUp, Award, ArrowRight, Sparkles, Clock, Zap } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import StatCard from '@/components/StatCard';
import XpBar from '@/components/XpBar';
import ProgressRing from '@/components/ProgressRing';
import EmptyState from '@/components/EmptyState';
import { todayStr, daysBetween, awardXp, ensureProfile } from '@/lib/studyUtils';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  const { profile, setProfile } = useOutletContext();
  const [goals, setGoals] = useState([]);
  const [exams, setExams] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const today = todayStr();
    const [g, e, m, a, s, ach] = await Promise.all([
      base44.entities.StudyGoal.filter({ goal_date: today }, '-created_date', 10).catch(() => []),
      base44.entities.Exam.list('-exam_date', 5).catch(() => []),
      base44.entities.StudyMaterial.list('-updated_date', 6).catch(() => []),
      base44.entities.QuizAttempt.list('-created_date', 5).catch(() => []),
      base44.entities.StudySession.list('-created_date', 30).catch(() => []),
      base44.entities.Achievement.list('-created_date', 20).catch(() => [])
    ]);
    setGoals(g || []); setExams(e || []); setMaterials(m || []); setAttempts(a || []); setSessions(s || []); setAchievements(ach || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggleGoal = async (goal) => {
    const done = !goal.done;
    await base44.entities.StudyGoal.update(goal.id, { done, completed: done ? goal.target_count : 0 });
    if (done) { await awardXp(15); }
    load();
    if (setProfile) { const u = await base44.auth.me(); const p = await ensureProfile(u); setProfile(p); }
  };

  const upcomingExams = (exams || []).filter((e) => new Date(e.exam_date) >= new Date(todayStr())).sort((a, b) => new Date(a.exam_date) - new Date(b.exam_date));
  const readyMaterials = (materials || []).filter((m) => m.status === 'ready');
  const studyMinutes = (sessions || []).reduce((s, x) => s + (x.duration_minutes || 0), 0);
  const avgScore = attempts.length ? Math.round(attempts.reduce((s, a) => s + (a.score || 0), 0) / attempts.length) : 0;
  const goalsDone = (goals || []).filter((g) => g.done).length;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const firstName = profile?.display_name?.split(' ')[0] || 'there';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-6">
      {/* Hero */}
      <div className="rounded-3xl bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 p-6 sm:p-8 text-white relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -right-20 bottom-0 w-40 h-40 rounded-full bg-fuchsia-400/20 blur-3xl" />
        <div className="relative">
          <p className="text-white/80 text-sm font-medium">{greeting},</p>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold mt-0.5">{firstName} 👋</h1>
          <p className="text-white/70 text-sm mt-2 max-w-md">Let's make today count. You have {goals.length} goals and {upcomingExams.length} upcoming exam{upcomingExams.length === 1 ? '' : 's'}.</p>

          <div className="flex flex-wrap items-center gap-5 mt-6">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center"><Flame className="w-5 h-5 text-amber-300" /></div>
              <div><p className="text-xs text-white/70 leading-none">Streak</p><p className="font-bold text-lg leading-tight">{profile?.streak || 0} days</p></div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center"><Zap className="w-5 h-5 text-amber-200" /></div>
              <div><p className="text-xs text-white/70 leading-none">Total XP</p><p className="font-bold text-lg leading-tight">{profile?.total_xp || 0}</p></div>
            </div>
            <div className="flex-1 min-w-[160px]">
              <div className="flex items-center justify-between text-xs text-white/80 mb-1">
                <span className="font-semibold">Level {profile?.level || 1}</span>
                <span>to Level {(profile?.level || 1) + 1}</span>
              </div>
              <XpBar totalXp={profile?.total_xp} />
            </div>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Target} label="Today's goals" value={`${goalsDone}/${goals.length || 0}`} accent="violet" />
        <StatCard icon={CalendarClock} label="Upcoming exams" value={upcomingExams.length} accent="rose" />
        <StatCard icon={Clock} label="Study time" value={`${studyMinutes}m`} accent="emerald" />
        <StatCard icon={TrendingUp} label="Avg quiz score" value={`${avgScore}%`} accent="amber" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Today's goals */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-bold text-lg flex items-center gap-2"><Target className="w-5 h-5 text-violet-500" /> Today's Goals</h2>
            <Link to="/planner" className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline">Plan</Link>
          </div>
          {goals.length === 0 ? (
            <EmptyState title="No goals for today" description="Set a study goal or generate a plan to stay on track." action={<Link to="/planner"><Button size="sm" className="bg-violet-600 hover:bg-violet-700">Create a plan</Button></Link>} />
          ) : (
            <div className="space-y-2">
              {goals.map((g) => (
                <button key={g.id} onClick={() => toggleGoal(g)} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors text-left">
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${g.done ? 'bg-violet-600 border-violet-600' : 'border-border'}`}>
                    {g.done && <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  <span className={`text-sm font-medium flex-1 ${g.done ? 'line-through text-muted-foreground' : ''}`}>{g.title}</span>
                  <span className="text-xs text-muted-foreground capitalize">{g.target_type}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming exams */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-bold text-lg flex items-center gap-2"><CalendarClock className="w-5 h-5 text-rose-500" /> Exams</h2>
            <Link to="/exams" className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline">All</Link>
          </div>
          {upcomingExams.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No upcoming exams.</p>
          ) : (
            <div className="space-y-3">
              {upcomingExams.slice(0, 3).map((e) => {
                const days = daysBetween(new Date(), e.exam_date);
                return (
                  <Link to="/exams" key={e.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 hover:bg-muted transition-colors">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 text-white flex flex-col items-center justify-center shrink-0">
                      <span className="text-lg font-bold leading-none">{days}</span>
                      <span className="text-[9px] uppercase">{days === 1 ? 'day' : 'days'}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{e.title}</p>
                      <p className="text-xs text-muted-foreground">{e.subject} · {new Date(e.exam_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent chapters */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-bold text-lg flex items-center gap-2"><BookOpen className="w-5 h-5 text-violet-500" /> Recent Chapters</h2>
          <Link to="/library" className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1">View all <ArrowRight className="w-3 h-3" /></Link>
        </div>
        {readyMaterials.length === 0 ? (
          <EmptyState title="No materials yet" description="Upload a textbook chapter, notes, or photo to start studying." action={<Link to="/upload"><Button size="sm" className="bg-violet-600 hover:bg-violet-700"><Sparkles className="w-4 h-4 mr-1.5" /> Upload material</Button></Link>} />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {readyMaterials.slice(0, 6).map((m) => (
              <Link to={`/material/${m.id}`} key={m.id} className="group p-4 rounded-2xl border border-border hover:border-violet-400 hover:shadow-md transition-all">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="w-9 h-9 rounded-lg bg-violet-100 dark:bg-violet-950/40 flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                  </div>
                  {m.flashcards?.length > 0 && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">{m.flashcards.length} cards</span>}
                </div>
                <p className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-violet-600 dark:group-hover:text-violet-400">{m.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{m.subject} · {m.grade_level}</p>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Quiz performance */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-heading font-bold text-lg flex items-center gap-2 mb-4"><TrendingUp className="w-5 h-5 text-emerald-500" /> Quiz Performance</h2>
          {attempts.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Take a quiz to see your performance.</p>
          ) : (
            <div className="space-y-3">
              {attempts.slice(0, 4).map((a) => (
                <div key={a.id} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{a.material_title || a.quiz_type}</p>
                    <p className="text-xs text-muted-foreground">{a.correct}/{a.total_questions} correct</p>
                  </div>
                  <div className="w-16 h-2 rounded-full bg-muted overflow-hidden">
                    <div className={`h-full rounded-full ${a.score >= 70 ? 'bg-emerald-500' : a.score >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: a.score + '%' }} />
                  </div>
                  <span className="text-sm font-bold w-10 text-right">{a.score}%</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Achievements */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-heading font-bold text-lg flex items-center gap-2 mb-4"><Award className="w-5 h-5 text-amber-500" /> Achievements</h2>
          {achievements.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Earn achievements by studying!</p>
          ) : (
            <div className="grid grid-cols-4 gap-3">
              {achievements.slice(0, 8).map((a) => (
                <div key={a.id} className="flex flex-col items-center text-center p-2 rounded-xl bg-muted/40">
                  <span className="text-2xl">{a.icon}</span>
                  <span className="text-[10px] font-semibold mt-1 leading-tight">{a.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}