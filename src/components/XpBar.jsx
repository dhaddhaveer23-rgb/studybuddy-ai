import React from 'react';
import { xpProgress } from '@/lib/studyUtils';

export default function XpBar({ totalXp, compact }) {
  const { level, xpIntoLevel, xpForNext, pct } = xpProgress(totalXp || 0);
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-violet-600 dark:text-violet-400">Lvl {level}</span>
        <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500" style={{ width: pct + '%' }} />
        </div>
      </div>
    );
  }
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-bold">Level {level}</span>
        <span className="text-xs text-muted-foreground font-medium">{xpIntoLevel} / {xpForNext} XP</span>
      </div>
      <div className="h-2.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-500"
          style={{ width: pct + '%' }}
        />
      </div>
    </div>
  );
}