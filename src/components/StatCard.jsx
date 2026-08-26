import React from 'react';
import { cn } from '@/lib/utils';

export default function StatCard({ icon: Icon, label, value, sub, accent = 'violet', className }) {
  const accents = {
    violet: 'from-violet-500/10 to-indigo-500/5 text-violet-600 dark:text-violet-400',
    emerald: 'from-emerald-500/10 to-teal-500/5 text-emerald-600 dark:text-emerald-400',
    amber: 'from-amber-500/10 to-orange-500/5 text-amber-600 dark:text-amber-400',
    rose: 'from-rose-500/10 to-pink-500/5 text-rose-600 dark:text-rose-400',
    sky: 'from-sky-500/10 to-blue-500/5 text-sky-600 dark:text-sky-400'
  };
  return (
    <div className={cn('rounded-2xl border border-border bg-card p-5 transition-shadow hover:shadow-md', className)}>
      <div className="flex items-center justify-between mb-3">
        <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center', accents[accent])}>
          {Icon && <Icon className="w-5 h-5" />}
        </div>
      </div>
      <p className="text-2xl font-heading font-bold tracking-tight">{value}</p>
      <p className="text-sm font-medium text-muted-foreground mt-0.5">{label}</p>
      {sub && <p className="text-xs text-muted-foreground/70 mt-1">{sub}</p>}
    </div>
  );
}