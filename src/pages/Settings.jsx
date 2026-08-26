import React, { useEffect, useState } from 'react';
import { Moon, Sun, LogOut, User, Zap, Flame, Award, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useTheme } from '@/lib/theme';
import { ensureProfile, levelFromXp, ACHIEVEMENTS } from '@/lib/studyUtils';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';

const AVATARS = ['🦉', '🦊', '🐼', '🦁', '🐯', '🐨', '🦄', '🐲', '🦅', '🐙'];

export default function Settings() {
  const { theme, toggle } = useTheme();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🦉');

  useEffect(() => {
    (async () => {
      const u = await base44.auth.me();
      setUser(u);
      const p = await ensureProfile(u);
      setProfile(p);
      setName(p.display_name || u.full_name || '');
      setEmoji(p.avatar_emoji || '🦉');
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    await base44.entities.UserProfile.update(profile.id, { display_name: name, avatar_emoji: emoji });
    setProfile({ ...profile, display_name: name, avatar_emoji: emoji });
    setEditing(false);
    toast.success('Profile updated');
  };

  const logout = async () => { await base44.auth.logout(); window.location.href = '/login'; };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-violet-500 animate-spin" /></div>;

  const unlockedCount = 0; // achievements count fetched elsewhere; keep simple

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 lg:py-8 space-y-6">
      <h1 className="text-2xl font-heading font-bold">Settings</h1>

      {/* Profile card */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-3xl shadow-lg shadow-violet-500/20">{profile.avatar_emoji || '🦉'}</div>
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="space-y-2">
                <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40" />
                <div className="flex flex-wrap gap-1.5">
                  {AVATARS.map((a) => <button key={a} onClick={() => setEmoji(a)} className={`w-8 h-8 rounded-lg text-lg ${emoji === a ? 'bg-violet-100 dark:bg-violet-950/40 ring-2 ring-violet-500' : 'bg-muted'}`}>{a}</button>)}
                </div>
              </div>
            ) : (
              <>
                <p className="font-heading font-bold text-lg">{profile.display_name}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                <div className="flex gap-3 mt-1.5 text-xs">
                  <span className="flex items-center gap-1 text-violet-500 font-semibold"><Zap className="w-3 h-3" /> Lvl {levelFromXp(profile.total_xp)}</span>
                  <span className="flex items-center gap-1 text-amber-500 font-semibold"><Flame className="w-3 h-3" /> {profile.streak || 0}</span>
                </div>
              </>
            )}
          </div>
          {editing ? (
            <Button size="sm" onClick={save} className="bg-violet-600 hover:bg-violet-700">Save</Button>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>Edit</Button>
          )}
        </div>
      </div>

      {/* Appearance */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-heading font-semibold mb-3 flex items-center gap-2"><Moon className="w-4 h-4 text-violet-500" /> Appearance</h2>
        <button onClick={toggle} className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-muted transition-colors">
          <span className="text-sm font-medium flex items-center gap-2">{theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />} {theme === 'dark' ? 'Dark mode' : 'Light mode'}</span>
          <div className={`w-11 h-6 rounded-full transition-colors relative ${theme === 'dark' ? 'bg-violet-600' : 'bg-muted'}`}>
            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${theme === 'dark' ? 'left-5' : 'left-0.5'}`} />
          </div>
        </button>
      </div>

      {/* Account */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-heading font-semibold mb-3 flex items-center gap-2"><User className="w-4 h-4 text-violet-500" /> Account</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between p-2"><span className="text-muted-foreground">Email</span><span className="font-medium truncate ml-2">{user?.email}</span></div>
          <div className="flex justify-between p-2"><span className="text-muted-foreground">Role</span><span className="font-medium capitalize">{user?.role}</span></div>
        </div>
        <Button onClick={logout} variant="outline" className="w-full mt-3 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"><LogOut className="w-4 h-4 mr-2" /> Log out</Button>
      </div>

      <p className="text-center text-xs text-muted-foreground pt-2">StudyBuddy AI · Made for curious minds ✨</p>
    </div>
  );
}