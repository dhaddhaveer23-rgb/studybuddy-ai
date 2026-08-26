import { base44 } from '@/api/base44Client';

export const XP_PER_LEVEL = 500;

export function levelFromXp(totalXp) {
  return Math.floor((totalXp || 0) / XP_PER_LEVEL) + 1;
}

export function xpProgress(totalXp) {
  const xp = totalXp || 0;
  const level = levelFromXp(xp);
  const xpIntoLevel = xp - (level - 1) * XP_PER_LEVEL;
  const pct = Math.round((xpIntoLevel / XP_PER_LEVEL) * 100);
  return { level, xpIntoLevel, xpForNext: XP_PER_LEVEL, pct };
}

export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function daysBetween(a, b) {
  return Math.ceil((new Date(b) - new Date(a)) / 86400000);
}

export async function ensureProfile(user) {
  const existing = await base44.entities.UserProfile.filter({ created_by_id: user.id });
  if (existing && existing.length) return existing[0];
  const created = await base44.entities.UserProfile.create({
    display_name: user.full_name || user.email?.split('@')[0] || 'Student',
    avatar_emoji: '🦉',
    total_xp: 0,
    level: 1,
    streak: 0,
    last_study_date: '',
    total_study_minutes: 0,
    quizzes_taken: 0,
    avg_score: 0
  });
  return created;
}

export async function awardXp(amount, opts = {}) {
  const user = await base44.auth.me();
  const profile = await ensureProfile(user);
  const today = todayStr();
  let streak = profile.streak || 0;
  if (profile.last_study_date !== today) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (profile.last_study_date === yesterday) streak = (profile.streak || 0) + 1;
    else streak = 1;
  }
  const totalXp = (profile.total_xp || 0) + amount;
  const update = {
    total_xp: totalXp,
    level: levelFromXp(totalXp),
    streak,
    last_study_date: today,
    total_study_minutes: (profile.total_study_minutes || 0) + (opts.minutes || 0)
  };
  if (opts.quizScore != null) {
    const n = (profile.quizzes_taken || 0) + 1;
    update.quizzes_taken = n;
    update.avg_score = Math.round(((profile.avg_score || 0) * (n - 1) + opts.quizScore) / n);
  }
  return base44.entities.UserProfile.update(profile.id, update);
}

export const ACHIEVEMENTS = [
  { key: 'first_quiz', title: 'First Steps', description: 'Complete your first quiz', icon: '🎯' },
  { key: 'streak_3', title: 'On a Roll', description: '3-day study streak', icon: '🔥' },
  { key: 'streak_7', title: 'Week Warrior', description: '7-day study streak', icon: '⚡' },
  { key: 'quiz_master', title: 'Quiz Master', description: 'Score 90%+ on a quiz', icon: '🏆' },
  { key: 'flashcard_50', title: 'Flashcard Pro', description: 'Study 50 flashcards', icon: '🃏' },
  { key: 'level_5', title: 'Rising Scholar', description: 'Reach level 5', icon: '🌟' },
  { key: 'upload_5', title: 'Collector', description: 'Upload 5 study materials', icon: '📚' },
  { key: 'plan_maker', title: 'Strategist', description: 'Generate a study plan', icon: '🗓️' }
];

export async function unlockAchievement(key) {
  const existing = await base44.entities.Achievement.filter({ key });
  if (existing && existing.length) return null;
  const def = ACHIEVEMENTS.find((a) => a.key === key);
  if (!def) return null;
  return base44.entities.Achievement.create({
    key: def.key, title: def.title, description: def.description, icon: def.icon
  });
}

export function gradeLevels() {
  return ['Elementary', 'Middle School', 'High School', 'College', 'University'];
}