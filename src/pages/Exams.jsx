import React, { useEffect, useState } from 'react';
import { CalendarClock, Plus, Trash2, Loader2, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { daysBetween, todayStr } from '@/lib/studyUtils';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';

const COLORS = ['violet', 'rose', 'emerald', 'amber', 'sky'];

export default function Exams() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', subject: '', exam_date: '', notes: '' });

  const load = async () => {
    setLoading(true);
    const e = await base44.entities.Exam.list('-exam_date', 50).catch(() => []);
    setExams(e || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!form.title || !form.exam_date) { toast.error('Title and date required'); return; }
    await base44.entities.Exam.create({ ...form, color: COLORS[exams.length % COLORS.length] });
    setForm({ title: '', subject: '', exam_date: '', notes: '' });
    setShowForm(false);
    toast.success('Exam added');
    load();
  };

  const remove = async (id) => { await base44.entities.Exam.delete(id); load(); };

  const sorted = [...exams].sort((a, b) => new Date(a.exam_date) - new Date(b.exam_date));
  const today = new Date(todayStr());

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold flex items-center gap-2"><CalendarClock className="w-6 h-6 text-rose-500" /> Exams</h1>
          <p className="text-sm text-muted-foreground mt-1">Countdown to your upcoming tests.</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-violet-600 hover:bg-violet-700"><Plus className="w-4 h-4 mr-1.5" /> Add</Button>
      </div>

      {loading ? <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-violet-500 animate-spin" /></div> : sorted.length === 0 ? (
        <div className="text-center py-20"><p className="text-muted-foreground text-sm">No exams yet. Add your first one!</p></div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {sorted.map((e, i) => {
            const days = daysBetween(today, e.exam_date);
            const past = days < 0;
            const color = COLORS[i % COLORS.length];
            const colorMap = { violet: 'from-violet-500 to-indigo-600', rose: 'from-rose-500 to-pink-600', emerald: 'from-emerald-500 to-teal-600', amber: 'from-amber-500 to-orange-600', sky: 'from-sky-500 to-blue-600' };
            return (
              <div key={e.id} className="rounded-2xl border border-border bg-card p-5 relative group">
                <button onClick={() => remove(e.id)} className="absolute top-3 right-3 p-1.5 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-4 h-4" /></button>
                <div className={cn('w-14 h-14 rounded-2xl bg-gradient-to-br text-white flex flex-col items-center justify-center mb-3', colorMap[color])}>
                  <span className="text-2xl font-bold leading-none">{Math.abs(days)}</span>
                  <span className="text-[9px] uppercase">{past ? 'ago' : 'days'}</span>
                </div>
                <p className="font-heading font-bold leading-snug pr-6">{e.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{e.subject} · {new Date(e.exam_date).toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric' })}</p>
                {e.notes && <p className="text-xs text-muted-foreground mt-2 italic">{e.notes}</p>}
                {past && <span className="inline-block mt-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Past</span>}
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-md rounded-3xl bg-card border border-border p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h3 className="font-heading font-bold text-lg">Add Exam</h3><button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-muted-foreground" /></button></div>
            <div className="space-y-3">
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Exam title" className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40" />
              <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Subject" className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40" />
              <input type="date" value={form.exam_date} onChange={(e) => setForm({ ...form, exam_date: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40" />
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notes (optional)" className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm min-h-[70px] resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/40" />
              <Button onClick={add} className="w-full bg-violet-600 hover:bg-violet-700">Add exam</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}