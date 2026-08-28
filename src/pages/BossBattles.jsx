import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Swords, Loader2, Sparkles, BookOpen, Crown, Check, ChevronRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';

export default function BossBattles() {
  const [materials, setMaterials] = useState([]);
  const [battles, setBattles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(null);

  const load = async () => {
    setLoading(true);
    const [m, b] = await Promise.all([
      base44.entities.StudyMaterial.list('-updated_date', 50).catch(() => []),
      base44.entities.BossBattle.list('-created_date', 50).catch(() => [])
    ]);
    setMaterials((m || []).filter((x) => x.status === 'ready'));
    setBattles(b || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const generate = async (material) => {
    setGenerating(material.id);
    try {
      const res = await base44.functions.invoke('generateBossBattle', { material_id: material.id });
      toast.success('Battle ready! ⚔️');
      load();
      window.location.href = `/boss-battle/${res.data?.battle?.id}`;
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to create battle');
    } finally { setGenerating(null); }
  };

  const battleFor = (mid) => battles.find((b) => b.material_id === mid);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-5">
      <div>
        <h1 className="text-2xl font-heading font-bold flex items-center gap-2"><Swords className="w-6 h-6 text-violet-500" /> Boss Battles</h1>
        <p className="text-sm text-muted-foreground mt-1">Turn completed chapters into challenge battles. Climb 3 levels, then face the Boss Question for big XP.</p>
      </div>

      {loading ? <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-violet-500 animate-spin" /></div> : materials.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-violet-100 dark:bg-violet-950/40 flex items-center justify-center mx-auto mb-3"><BookOpen className="w-8 h-8 text-violet-500" /></div>
          <p className="font-semibold text-sm">No chapters to battle yet</p>
          <p className="text-xs text-muted-foreground mt-1">Upload study material first, then come back to battle it.</p>
          <Link to="/upload"><Button className="bg-violet-600 hover:bg-violet-700 mt-4"><Sparkles className="w-4 h-4 mr-1.5" /> Upload material</Button></Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {materials.map((m) => {
            const battle = battleFor(m.id);
            return (
              <div key={m.id} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-md shadow-violet-500/20"><BookOpen className="w-6 h-6 text-white" /></div>
                  <div className="flex-1 min-w-0"><p className="font-heading font-semibold leading-snug">{m.title}</p><p className="text-xs text-muted-foreground mt-0.5">{m.subject} · {m.grade_level}</p></div>
                </div>
                {battle ? (
                  <Link to={`/boss-battle/${battle.id}`}>
                    <Button className="w-full bg-violet-600 hover:bg-violet-700">
                      {battle.status === 'completed' ? <><Check className="w-4 h-4 mr-1.5" /> Replay battle</> : <><Swords className="w-4 h-4 mr-1.5" /> {battle.status === 'in_progress' ? 'Continue battle' : 'Start battle'}</>}
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                ) : (
                  <Button onClick={() => generate(m)} disabled={generating === m.id} variant="outline" className="w-full">
                    {generating === m.id ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Building battle...</> : <><Sparkles className="w-4 h-4 mr-1.5" /> Create battle</>}
                  </Button>
                )}
                {battle?.status === 'completed' && <p className="text-xs text-emerald-600 font-medium text-center mt-2 flex items-center justify-center gap-1"><Crown className="w-3.5 h-3.5" /> Boss defeated · +{battle.xp_earned} XP</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}