import React, { useEffect, useState } from 'react';
import { Trophy, Flame, Zap, Loader2, Crown } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { ensureProfile, levelFromXp } from '@/lib/studyUtils';
import { cn } from '@/lib/utils';

export default function Leaderboard() {
  const [profiles, setProfiles] = useState([]);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const user = await base44.auth.me();
      const [myProfile, all] = await Promise.all([
        ensureProfile(user),
        base44.entities.UserProfile.list('-total_xp', 100).catch(() => [])
      ]);
      setMe(myProfile);
      setProfiles((all || []).sort((a, b) => (b.total_xp || 0) - (a.total_xp || 0)));
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-violet-500 animate-spin" /></div>;

  const myRank = profiles.findIndex((p) => p.id === me?.id) + 1;
  const top3 = profiles.slice(0, 3);
  const rest = profiles.slice(3);
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean);
  const podiumStyles = [
    { h: 'h-20', medal: '🥈', color: 'from-slate-300 to-slate-400' },
    { h: 'h-28', medal: '🥇', color: 'from-amber-300 to-amber-500' },
    { h: 'h-16', medal: '🥉', color: 'from-orange-300 to-orange-500' }
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-bold flex items-center gap-2"><Trophy className="w-6 h-6 text-amber-500" /> Leaderboard</h1>
        <p className="text-sm text-muted-foreground mt-1">See how you stack up against other students.</p>
      </div>

      {myRank > 0 && (
        <div className="rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 p-4 text-white mb-6 flex items-center justify-between">
          <div><p className="text-xs text-white/80">Your rank</p><p className="text-2xl font-heading font-bold">#{myRank}</p></div>
          <div className="text-right"><p className="text-xs text-white/80">Your XP</p><p className="text-xl font-bold">{me?.total_xp || 0}</p></div>
        </div>
      )}

      {profiles.length === 0 ? (
        <p className="text-center text-muted-foreground py-12 text-sm">No rankings yet. Start studying to climb the board!</p>
      ) : (
        <>
          {top3.length > 0 && (
            <div className="flex items-end justify-center gap-3 mb-8">
              {podiumOrder.map((p, i) => {
                const style = podiumStyles[i];
                const isMe = p.id === me?.id;
                return (
                  <div key={p.id} className="flex flex-col items-center" style={{ width: '30%' }}>
                    <div className={cn('w-12 h-12 rounded-full flex items-center justify-center text-2xl mb-2 border-2', isMe ? 'border-violet-500' : 'border-transparent')}>{p.avatar_emoji || '🦉'}</div>
                    <p className="text-xs font-semibold truncate max-w-full">{p.display_name}{isMe && ' (You)'}</p>
                    <p className="text-[10px] text-muted-foreground mb-1">{p.total_xp || 0} XP</p>
                    <div className={cn('w-full rounded-t-xl bg-gradient-to-t flex items-start justify-center pt-1.5', style.h, style.color)}>
                      <span className="text-lg">{style.medal}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="space-y-2">
            {rest.map((p, i) => {
              const rank = i + 4;
              const isMe = p.id === me?.id;
              return (
                <div key={p.id} className={cn('flex items-center gap-3 p-3.5 rounded-xl border', isMe ? 'border-violet-400 bg-violet-50 dark:bg-violet-950/20' : 'border-border bg-card')}>
                  <span className="w-6 text-center text-sm font-bold text-muted-foreground">{rank}</span>
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-xl">{p.avatar_emoji || '🦉'}</div>
                  <div className="flex-1 min-w-0"><p className="text-sm font-semibold truncate">{p.display_name}{isMe && ' (You)'}</p><p className="text-xs text-muted-foreground">Level {levelFromXp(p.total_xp)} · {p.streak || 0} day streak</p></div>
                  <div className="text-right"><p className="text-sm font-bold flex items-center gap-1"><Zap className="w-3.5 h-3.5 text-violet-500" />{p.total_xp || 0}</p>{p.streak > 0 && <p className="text-[10px] text-amber-500 flex items-center gap-0.5 justify-end"><Flame className="w-3 h-3" />{p.streak}</p>}</div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}