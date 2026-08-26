import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { GraduationCap, Moon, Sun, Flame } from 'lucide-react';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import { useTheme } from '@/lib/theme';
import { base44 } from '@/api/base44Client';
import { ensureProfile, xpProgress } from '@/lib/studyUtils';

export default function Layout() {
  const { theme, toggle } = useTheme();
  const [profile, setProfile] = useState(null);
  const location = useLocation();

  useEffect(() => {
    let active = true;
    base44.auth.me().then((u) => u && ensureProfile(u).then((p) => active && setProfile(p))).catch(() => {});
    return () => { active = false; };
  }, [location.pathname]);

  const prog = profile ? xpProgress(profile.total_xp) : null;

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 h-16 bg-background/90 backdrop-blur-xl border-b border-border">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-md shadow-violet-500/30">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-heading font-bold text-base">StudyBuddy</span>
          </Link>
          <div className="flex items-center gap-3">
            {profile && (
              <div className="flex items-center gap-1 text-sm font-semibold text-orange-500">
                <Flame className="w-4 h-4 fill-orange-500" />
                {profile.streak || 0}
              </div>
            )}
            <button onClick={toggle} className="p-2 rounded-lg hover:bg-muted transition-colors">
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </header>

        <main className="flex-1 pb-24 lg:pb-0">
          <Outlet context={{ profile, setProfile }} />
        </main>
      </div>
      <BottomNav />
    </div>
  );
}