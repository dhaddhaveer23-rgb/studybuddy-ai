import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Upload, Library, Sparkles, BarChart3, CalendarClock, CalendarRange, Trophy, Settings, GraduationCap, Moon, Sun } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { cn } from '@/lib/utils';

export const NAV_ITEMS = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Upload', path: '/upload', icon: Upload },
  { label: 'Library', path: '/library', icon: Library },
  { label: 'AI Tutor', path: '/tutor', icon: Sparkles },
  { label: 'Progress', path: '/progress', icon: BarChart3 },
  { label: 'Exams', path: '/exams', icon: CalendarClock },
  { label: 'Planner', path: '/planner', icon: CalendarRange },
  { label: 'Leaderboard', path: '/leaderboard', icon: Trophy },
  { label: 'Settings', path: '/settings', icon: Settings }
];

export const MOBILE_NAV = ['/', '/upload', '/tutor', '/progress', '/settings'];

export default function Sidebar() {
  const location = useLocation();
  const { theme, toggle } = useTheme();

  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-border bg-sidebar h-screen sticky top-0">
      <div className="flex items-center gap-2.5 px-6 h-20 border-b border-sidebar-border">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
          <GraduationCap className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-heading font-bold text-lg leading-none">StudyBuddy</p>
          <p className="text-[11px] text-muted-foreground font-medium tracking-wide">AI Study Coach</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const active = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all',
                active
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground'
              )}
            >
              <Icon className={cn('w-[18px] h-[18px]', active && 'text-violet-600 dark:text-violet-400')} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <button
          onClick={toggle}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/60 transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>
      </div>
    </aside>
  );
}