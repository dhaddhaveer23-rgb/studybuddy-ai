import React, { useEffect, useState } from 'react';
import { Radar as RadarIcon, Loader2, Sparkles, TrendingUp, Target, ArrowRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const catColor = { strong: 'emerald', average: 'amber', weak: 'rose' };
const catBg = { strong: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400', average: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400', weak: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400' };

export default function WeaknessRadar() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('analyzeWeakness', {});
      setData(res.data);
    } catch (e) {
      setData({ topics: [], recommendations: [] });
    }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-violet-500 animate-spin" /></div>;

  const topics = data?.topics || [];
  const strong = topics.filter((t) => t.category === 'strong');
  const average = topics.filter((t) => t.category === 'average');
  const weak = topics.filter((t) => t.category === 'weak');
  const chartData = topics.map((t) => ({ topic: t.name.length > 14 ? t.name.slice(0, 12) + '…' : t.name, score: t.score }));

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold flex items-center gap-2"><RadarIcon className="w-6 h-6 text-violet-500" /> Weakness Radar</h1>
          <p className="text-sm text-muted-foreground mt-1">A live map of your strong, average & weak topics across quizzes and answer checks.</p>
        </div>
        <Button size="sm" variant="outline" onClick={load}><Sparkles className="w-4 h-4 mr-1.5" /> Refresh</Button>
      </div>

      {topics.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-violet-100 dark:bg-violet-950/40 flex items-center justify-center mx-auto mb-3"><RadarIcon className="w-8 h-8 text-violet-500" /></div>
          <p className="font-semibold text-sm">No data yet</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">Take quizzes and check answers to build your weakness radar.</p>
          <Link to="/library"><Button size="sm" className="bg-violet-600 hover:bg-violet-700 mt-4">Start practicing</Button></Link>
        </div>
      ) : (
        <>
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-heading font-semibold mb-4">Topic Strength</h2>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={chartData} outerRadius="75%">
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="topic" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} angle={90} />
                  <Radar dataKey="score" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.35} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-xs font-semibold text-emerald-600 mb-2">STRONG ({strong.length})</p>
              <div className="space-y-1">{strong.map((t) => <p key={t.name} className="text-sm font-medium">{t.name} <span className="text-xs text-muted-foreground">{t.score}%</span></p>)}{strong.length === 0 && <p className="text-xs text-muted-foreground">None yet</p>}</div>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-xs font-semibold text-amber-600 mb-2">AVERAGE ({average.length})</p>
              <div className="space-y-1">{average.map((t) => <p key={t.name} className="text-sm font-medium">{t.name} <span className="text-xs text-muted-foreground">{t.score}%</span></p>)}{average.length === 0 && <p className="text-xs text-muted-foreground">None yet</p>}</div>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-xs font-semibold text-rose-600 mb-2">WEAK ({weak.length})</p>
              <div className="space-y-1">{weak.map((t) => <p key={t.name} className="text-sm font-medium">{t.name} <span className="text-xs text-muted-foreground">{t.score}%</span></p>)}{weak.length === 0 && <p className="text-xs text-muted-foreground">None yet</p>}</div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-heading font-semibold flex items-center gap-2 mb-3"><Target className="w-4 h-4 text-violet-500" /> Revise next</h2>
            <div className="space-y-2">
              {(data?.recommendations || []).map((r, i) => (
                <div key={i} className="flex gap-3 p-3 rounded-xl bg-muted/40">
                  <span className="w-6 h-6 rounded-full bg-violet-600 text-white text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                  <p className="text-sm text-muted-foreground">{r}</p>
                </div>
              ))}
            </div>
            <Link to="/planner"><Button className="w-full mt-4 bg-violet-600 hover:bg-violet-700">Build a study plan for these <ArrowRight className="w-4 h-4 ml-1.5" /></Button></Link>
          </div>
        </>
      )}
    </div>
  );
}