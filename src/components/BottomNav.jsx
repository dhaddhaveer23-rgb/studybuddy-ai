import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Upload, Sparkles, BarChart3, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const ITEMS = [
  { path: '/', icon: LayoutDashboard, label: 'Home' },
  { path: '/upload', icon: Upload, label: 'Upload' },
  { path: '/tutor', icon: Sparkles, label: 'Tutor' },
  { path: '/progress', icon: BarChart3, label: 'Progress' },
  { path: '/settings', icon: Settings, label: 'Settings' }
];

export default function BottomNav() {
  const location = useLocation();
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-background/90 backdrop-blur-xl border-t border-border">
      <div className="flex items-stretch justify-around px-2 pb-[env(safe-area-inset-bottom)]">
        {ITEMS.map((item) => {
          const active = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center justify-center gap-1 py-2.5 px-3 rounded-xl transition-colors flex-1',
                active ? 'text-violet-600 dark:text-violet-400' : 'text-muted-foreground'
              )}
            >
              <Icon className={cn('w-[22px] h-[22px]', active && 'stroke-[2.4]')} />
              <span className="text-[10px] font-semibold">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}