import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Swords, Crown, Loader2, Check, X, Heart, ArrowRight, RotateCcw, Zap, Shield } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { awardXp, unlockAchievement } from '@/lib/studyUtils';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';

export default function BossArena() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [battle, setBattle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState('intro'); // intro | level | levelClear | boss | victory
  const [levelIdx, setLevelIdx] = useState(0);
  const [qIdx, setQIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [levelCorrect, setLevelCorrect] = useState(0);
  const [lives, setLives] = useState(3);
  const [shake, setShake] = useState(false);

  const load = async () => {
    const b = await base44.entities.BossBattle.get(id).catch(() => null);
    setBattle(b);
    setLoading(false);
  };
  useEffect(() => { load(); }, [id]);

  const fireConfetti = useCallback(() => {
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 }, colors: ['#7c3aed', '#a78bfa', '#f0abfc', '#fbbf24'] });
  }, []);

  const level = battle?.levels?.[levelIdx];
  const question = level?.questions?.[qIdx];
  const isBoss = phase === 'boss';
  const bossQ = battle?.boss_question;

  const startBattle = () => { setPhase('level'); setLevelIdx(0); setQIdx(0); setLevelCorrect(0); setLives(3); setSelected(null); };

  const choose = (i) => { if (selected !== null) return; setSelected(i); };

  const advance = async () => {
    const correct = selected === (isBoss ? bossQ.answer_index : question.answer_index);
    if (!correct) {
      setShake(true); setTimeout(() => setShake(false), 500);
      setLives((l) => l - 1);
      if (lives - 1 <= 0) { toast.error('Out of lives! Retrying level.'); setQIdx(0); setLevelCorrect(0); setLives(3); setSelected(null); return; }
      setSelected(null); return;
    }

    if (isBoss) {
      // Victory!
      const xp = 100 + (battle.levels?.length || 3) * 20;
      await awardXp(xp, { minutes: 10 });
      await unlockAchievement('quiz_master');
      try { await base44.entities.BossBattle.update(battle.id, { status: 'completed', xp_earned: xp, completed_levels: battle.levels?.length || 0 }); } catch (e) {}
      fireConfetti();
      setTimeout(fireConfetti, 400);
      setPhase('victory');
      return;
    }

    const newCorrect = levelCorrect + 1;
    setLevelCorrect(newCorrect);
    setSelected(null);

    if (qIdx + 1 < level.questions.length) {
      setQIdx(qIdx + 1);
    } else {
      // level done
      await awardXp(30);
      fireConfetti();
      setPhase('levelClear');
    }
  };

  const nextLevel = () => {
    if (levelIdx + 1 < battle.levels.length) {
      setLevelIdx(levelIdx + 1); setQIdx(0); setLevelCorrect(0); setLives(3); setSelected(null); setPhase('level');
    } else {
      setPhase('boss'); setSelected(null);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-violet-500 animate-spin" /></div>;
  if (!battle) return <div className="text-center py-20"><p className="text-muted-foreground">Battle not found.</p><Link to="/boss-battles" className="text-violet-500 text-sm">Back</Link></div>;

  if (phase === 'intro') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 text-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-24 h-24 rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center mx-auto mb-5 shadow-2xl shadow-violet-500/40">
          <Swords className="w-12 h-12 text-white" />
        </motion.div>
        <h1 className="text-3xl font-heading font-bold">{battle.title}</h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">Conquer {battle.levels?.length || 3} levels of increasing difficulty, then defeat the Boss Question to win the chapter.</p>
        <div className="flex justify-center gap-2 mt-4">
          {battle.levels?.map((l, i) => <span key={i} className="text-xs font-semibold px-2.5 py-1 rounded-full bg-muted text-muted-foreground">Lvl {i + 1} · {l.difficulty}</span>)}
        </div>
        <Button onClick={startBattle} className="mt-6 bg-violet-600 hover:bg-violet-700 text-base px-8 py-3 h-auto"><Swords className="w-5 h-5 mr-2" /> Enter the arena</Button>
      </div>
    );
  }

  if (phase === 'levelClear') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <motion.div initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring' }} className="text-6xl mb-3">🎉</motion.div>
        <h2 className="text-2xl font-heading font-bold">Level {level.level} cleared!</h2>
        <p className="text-sm text-muted-foreground mt-1">{levelCorrect}/{level.questions.length} correct · +30 XP</p>
        <Button onClick={nextLevel} className="mt-6 bg-violet-600 hover:bg-violet-700">Next level <ArrowRight className="w-4 h-4 ml-1.5" /></Button>
      </div>
    );
  }

  if (phase === 'victory') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <motion.div initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', delay: 0.1 }} className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-amber-500/40">
          <Crown className="w-12 h-12 text-white" />
        </motion.div>
        <h1 className="text-3xl font-heading font-bold">Boss Defeated! 👑</h1>
        <p className="text-sm text-muted-foreground mt-2">You conquered <span className="font-semibold text-foreground">{battle.material_title}</span></p>
        <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 font-bold"><Zap className="w-4 h-4" /> +{100 + (battle.levels?.length || 3) * 20} XP earned</div>
        <div className="flex gap-3 justify-center mt-6">
          <Button variant="outline" onClick={() => navigate('/boss-battles')}><ArrowRight className="w-4 h-4 mr-1.5" /> Back to battles</Button>
          <Button onClick={startBattle} className="bg-violet-600 hover:bg-violet-700"><RotateCcw className="w-4 h-4 mr-1.5" /> Play again</Button>
        </div>
      </div>
    );
  }

  const q = isBoss ? bossQ : question;
  const opts = q?.options || [];
  const correctIdx = q?.answer_index;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 lg:py-8">
      {/* HUD */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {isBoss ? (
            <span className="flex items-center gap-1.5 text-sm font-bold text-amber-600"><Crown className="w-4 h-4" /> BOSS</span>
          ) : (
            <span className="text-sm font-bold text-violet-600">Level {level.level} · {level.difficulty}</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {[...Array(lives)].map((_, i) => <Heart key={i} className="w-4 h-4 fill-rose-500 text-rose-500" />)}
          {[...Array(3 - lives)].map((_, i) => <Heart key={i} className="w-4 h-4 text-muted" />)}
        </div>
      </div>

      {/* Progress across all questions */}
      {!isBoss && (
        <div className="flex gap-1.5 mb-5">
          {battle.levels.map((l, li) => (
            <div key={li} className={cn('h-1.5 flex-1 rounded-full', li < levelIdx ? 'bg-emerald-500' : li === levelIdx ? 'bg-violet-500' : 'bg-muted')} />
          ))}
          <div className={cn('h-1.5 w-6 rounded-full', phase === 'boss' ? 'bg-amber-500' : 'bg-muted')} />
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={isBoss ? 'boss' : `${levelIdx}-${qIdx}`}
          initial={{ x: 40, opacity: 0 }} animate={{ x: shake ? [-8, 8, -8, 8, 0] : 0, opacity: 1 }} exit={{ x: -40, opacity: 0 }} transition={{ duration: 0.25 }}
          className="rounded-2xl border border-border bg-card p-5"
        >
          {isBoss && (
            <div className="flex items-center justify-center gap-2 mb-3 text-amber-600"><Shield className="w-5 h-5" /><span className="text-xs font-bold uppercase tracking-widest">Final Boss</span><Shield className="w-5 h-5" /></div>
          )}
          <h3 className="text-lg font-heading font-semibold mb-5 leading-relaxed">{q?.question}</h3>
          <div className="space-y-2.5">
            {opts.map((opt, i) => {
              const isCorrect = i === correctIdx;
              const isSel = i === selected;
              return (
                <button key={i} onClick={() => choose(i)} disabled={selected !== null}
                  className={cn('w-full text-left px-4 py-3.5 rounded-xl border-2 text-sm font-medium transition-all flex items-center justify-between',
                    selected === null && 'border-border hover:border-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/30',
                    selected !== null && isCorrect && 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30',
                    selected !== null && isSel && !isCorrect && 'border-rose-500 bg-rose-50 dark:bg-rose-950/30',
                    selected !== null && !isCorrect && !isSel && 'border-border opacity-60')}>
                  <span>{opt}</span>
                  {selected !== null && isCorrect && <Check className="w-4 h-4 text-emerald-500" />}
                  {selected !== null && isSel && !isCorrect && <X className="w-4 h-4 text-rose-500" />}
                </button>
              );
            })}
          </div>

          {selected !== null && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 p-4 rounded-xl bg-muted/60 text-sm">
              <p className="font-semibold mb-1">{selected === correctIdx ? '✅ Correct!' : '❌ Wrong — try again!'}</p>
              <p className="text-muted-foreground">{q?.explanation}</p>
            </motion.div>
          )}

          <Button onClick={advance} disabled={selected === null} className="w-full mt-5 bg-violet-600 hover:bg-violet-700">
            {isBoss ? 'Strike the boss! ⚔️' : (qIdx + 1 < level.questions.length ? 'Next question' : 'Finish level')} <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}