import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Search, Sparkles, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import EmptyState from '@/components/EmptyState';
import { Button } from '@/components/ui/button';

export default function Library() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    base44.entities.StudyMaterial.list('-updated_date', 100).then((m) => { setMaterials(m || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const filtered = materials.filter((m) => (m.title + m.subject).toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold flex items-center gap-2"><BookOpen className="w-6 h-6 text-violet-500" /> Library</h1>
          <p className="text-sm text-muted-foreground mt-1">{materials.length} stud{materials.length === 1 ? 'y' : 'ies'} material{materials.length === 1 ? '' : 's'}</p>
        </div>
        <Link to="/upload"><Button className="bg-violet-600 hover:bg-violet-700"><Sparkles className="w-4 h-4 mr-1.5" /> New</Button></Link>
      </div>

      <div className="relative mb-6">
        <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search your materials..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40" />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-violet-500 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState title={query ? 'No matches' : 'Your library is empty'} description={query ? 'Try a different search.' : 'Upload your first textbook chapter or notes to get started.'}
          action={!query && <Link to="/upload"><Button className="bg-violet-600 hover:bg-violet-700"><Sparkles className="w-4 h-4 mr-1.5" /> Upload material</Button></Link>} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((m) => (
            <Link to={`/material/${m.id}`} key={m.id} className="group p-5 rounded-2xl border border-border bg-card hover:border-violet-400 hover:shadow-lg transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-md shadow-violet-500/20">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                {m.status === 'processing' ? <Loader2 className="w-4 h-4 text-amber-500 animate-spin" /> : (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400">{m.flashcards?.length || 0} cards</span>
                )}
              </div>
              <p className="font-heading font-semibold leading-snug line-clamp-2 group-hover:text-violet-600 dark:group-hover:text-violet-400">{m.title}</p>
              <p className="text-xs text-muted-foreground mt-1.5">{m.subject} · {m.grade_level}</p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {m.generated_types?.slice(0, 4).map((t) => (
                  <span key={t} className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-muted text-muted-foreground capitalize">{t.replace('_', ' ')}</span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}