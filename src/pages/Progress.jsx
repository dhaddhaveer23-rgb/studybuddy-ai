import React, { useEffect, useState } from 'react';
import { Award, TrendingUp, Target, Clock, Zap, Flame, Brain, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import StatCard from '@/components/StatCard';
import ProgressRing from '@/components/ProgressRing';
import { ACHIEVEMENTS, ensureProfile } from '@/lib/studyUtils';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function Progress() {
  const [profile, setProfile] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [unlocked, setUnlocked] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const user = await base44.auth.me();
      const [p, a, s, ach, m] = await Promise.all([
        ensureProfile(user),
        base44.entities.QuizAttempt.list('-created_date', 50).catch(() => []),
        base44.entities.StudySession.list('-created_date', 50).catch(() => []),
        base44.entities.Achievement.list('-created_date', 50).catch(() => []),
        base44.entities.StudyMaterial.list('-updated_date', 50).catch(() => [])
      ]);
      setProfile(p); setAttempts(a || []); setSessions(s || []); setUnlocked(ach || []); setMaterials(m || []);
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-violet-500 animate-spin" /></div>;

  const unlockedKeys = new Set(unlocked.map((u) => u.key));
  const avgScore = attempts.length ? Math.round(attempts.reduce((s, a) => s + a.score, 0) / attempts.length) : 0;
  const studyMinutes = sessions.reduce((s, x) => s + (x.duration_minutes || 0), 0);

  // weak topics
  const topicFreq = {};
  attempts.forEach((a) => (a.weak_topics || []).forEach((t) => { topicFreq[t] = (topicFreq[t] || 0) + 1; }));
  const weakTopics = Object.entries(topicFreq).sort((a, b) => b[1] - a[1]).slice(0, 6);

  // last 7 days activity
  const days = [...Array(7)].map((_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000);
    const ds = d.toISOString().slice(0, 10);
    const count = sessions.filter((s) => s.created_date?.slice(0, 10) === ds).length;
    return { label: d.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 1), count };
  });
  const maxCount = Math.max(1, ...days.map((d) => d.count));

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold flex items-center gap-2"><TrendingUp className="w-6 h-6 text-violet-500" /> Your Progress</h1>
        <p className="text-sm text-muted-foreground mt-1">Track your growth, mastery, and achievements.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Zap} label="Total XP" value={profile.total_xp || 0} sub={`Level ${profile.level}`} accent="violet" />
        <StatCard icon={Flame} label="Day streak" value={profile.streak || 0} accent="amber" />
        <StatCard icon={Target} label="Avg score" value={`${avgScore}%`} accent="emerald" />
        <StatCard icon={Clock} label="Study time" value={`${studyMinutes}m`} accent="sky" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Mastery overview */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-heading font-bold text-lg flex items-center gap-2 mb-4"><Brain className="w-5 h-5 text-violet-500" /> Overall Mastery</h2>
          <div className="flex flex-col items-center py-2">
            <ProgressRing value={avgScore} size={120} stroke={10} color="#7c3aed" />
            <p className="text-sm text-muted-foreground mt-3">{attempts.length} quiz{attempts.length === 1 ? '' : 'es'} taken</p>
          </div>
        </div>

        {/* Weak topics */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-5">
          <h2 className="font-heading font-bold text-lg flex items-center gap-2 mb-4"><Target className="w-5 h-5 text-rose-500" /> Weak Topics</h2>
          {weakTopics.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Take quizzes to detect your weak topics.</p>
          ) : (
            <div className="space-y-3">
              {weakTopics.map(([topic, count]) => (
                <div key={topic} className="flex items-center gap-3">
                  <span className="text-sm font-medium flex-1 truncate">{topic}</span>
                  <span className="text-xs text-muted-foreground">missed {count}x</span>
                  <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-rose-500" style={{ width: Math.min(100, count * 25) + '%' }} />
                  </div>
                </div>
              ))}
              <Link to="/planner"><Button size="sm" className="bg-violet-600 hover:bg-violet-700 mt-2">Practice these →</Button></Link>
            </div>
          )}
        </div>
      </div>

      {/* Weekly activity */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-heading font-bold text-lg flex items-center gap-2 mb-4"><TrendingUp className="w-5 h-5 text-emerald-500" /> This Week</h2>
        <div className="flex items-end justify-between gap-2 h-32">
          {days.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full flex-1 flex items-end">
                <div className="w-full rounded-t-lg bg-gradient-to-t from-violet-500 to-indigo-400 transition-all" style={{ height: (d.count / maxCount) * 100 + '%', minHeight: d.count ? '8px' : '2px' }} />
              </div>
              <span className="text-xs text-muted-foreground font-medium">{d.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Achievements */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-heading font-bold text-lg flex items-center gap-2 mb-4"><Award className="w-5 h-5 text-amber-500" /> Achievements</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {ACHIEVEMENTS.map((a) => {
            const has = unlockedKeys.has(a.key);
            return (
              <div key={a.key} className={`flex flex-col items-center text-center p-4 rounded-xl border ${has ? 'border-amber-300 bg-amber-50 dark:bg-amber-950/20' : 'border-border opacity-50 grayscale'}`}>
                <span className="text-3xl mb-1">{a.icon}</span>
                <span className="text-xs font-bold leading-tight">{a.title}</span>
                <span className="text-[10px] text-muted-foreground mt-0.5">{a.description}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}