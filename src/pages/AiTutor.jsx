import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, Send, Volume2, Loader2, GraduationCap, HelpCircle, Bot, User } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { gradeLevels, awardXp } from '@/lib/studyUtils';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';

export default function AiTutor() {
  const [mode, setMode] = useState('tutor');
  const [grade, setGrade] = useState('High School');
  const [topic, setTopic] = useState('');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [voice, setVoice] = useState(false);
  const [audio, setAudio] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', content: input };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setInput('');
    setLoading(true);
    setAudio(null);
    try {
      const res = await base44.functions.invoke('aiTutor', {
        messages: newMsgs.map((m) => ({ role: m.role, content: m.content })),
        grade_level: grade,
        mode,
        topic,
        voice
      });
      const reply = res.data?.reply || 'Sorry, I could not generate a response.';
      setMessages([...newMsgs, { role: 'assistant', content: reply }]);
      if (res.data?.audio_url) setAudio(res.data.audio_url);
      await awardXp(5, { minutes: 2 });
    } catch (e) {
      toast.error(e.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const starter = mode === 'homework'
    ? 'Stuck on a problem? Type the question and I\'ll guide you step by step.'
    : 'Ask me to explain any topic in a way that makes sense for your grade.';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 lg:py-8 h-[calc(100vh-1rem)] lg:h-screen flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
            {mode === 'homework' ? <HelpCircle className="w-6 h-6 text-violet-500" /> : <Sparkles className="w-6 h-6 text-violet-500" />}
            {mode === 'homework' ? 'Homework Helper' : 'AI Tutor'}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{starter}</p>
        </div>
      </div>

      <div className="flex gap-2 mb-3">
        <button onClick={() => { setMode('tutor'); setMessages([]); }} className={cn('flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium border transition-all', mode === 'tutor' ? 'bg-violet-600 text-white border-violet-600' : 'border-border text-muted-foreground')}>
          <GraduationCap className="w-4 h-4" /> Tutor
        </button>
        <button onClick={() => { setMode('homework'); setMessages([]); }} className={cn('flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium border transition-all', mode === 'homework' ? 'bg-violet-600 text-white border-violet-600' : 'border-border text-muted-foreground')}>
          <HelpCircle className="w-4 h-4" /> Homework
        </button>
        <button onClick={() => setVoice((v) => !v)} className={cn('ml-auto flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium border transition-all', voice ? 'bg-amber-500 text-white border-amber-500' : 'border-border text-muted-foreground')}>
          <Volume2 className="w-4 h-4" /> Voice
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <select value={grade} onChange={(e) => setGrade(e.target.value)} className="px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-medium focus:outline-none">
          {gradeLevels().map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
        {mode === 'tutor' && <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Topic (optional)" className="px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-medium focus:outline-none flex-1 min-w-[140px]" />}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto rounded-2xl border border-border bg-card p-4 space-y-4 mb-3">
        {messages.length === 0 && (
          <div className="text-center py-10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-violet-500/30">
              <Bot className="w-8 h-8 text-white" />
            </div>
            <p className="font-semibold text-sm">Hi! I'm your StudyBuddy.</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">{mode === 'homework' ? 'Share your homework question and I\'ll walk you through it.' : 'Ask me anything — I\'ll explain it at your level.'}</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={cn('flex gap-2.5', m.role === 'user' && 'flex-row-reverse')}>
            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', m.role === 'user' ? 'bg-violet-600' : 'bg-muted')}>
              {m.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-violet-600 dark:text-violet-400" />}
            </div>
            <div className={cn('max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap', m.role === 'user' ? 'bg-violet-600 text-white rounded-tr-sm' : 'bg-muted rounded-tl-sm')}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && <div className="flex gap-2.5"><div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center"><Loader2 className="w-4 h-4 text-violet-500 animate-spin" /></div><div className="px-4 py-2.5 rounded-2xl bg-muted"><div className="flex gap-1"><span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} /><span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} /><span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} /></div></div></div>}
        {audio && <audio controls src={audio} className="w-full" />}
      </div>

      <div className="flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder={mode === 'homework' ? 'Type your homework question...' : 'Ask me to explain a topic...'}
          className="flex-1 px-4 py-3 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40" />
        <button onClick={send} disabled={loading || !input.trim()} className="w-12 h-12 rounded-xl bg-violet-600 text-white flex items-center justify-center disabled:opacity-50 hover:bg-violet-700 transition-colors shrink-0">
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}