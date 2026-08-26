import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { awardXp } from '@/lib/studyUtils';

export default function FlashcardViewer({ cards, materialId, onComplete }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [studied, setStudied] = useState(0);

  if (!cards || !cards.length) {
    return <p className="text-sm text-muted-foreground text-center py-10">No flashcards available.</p>;
  }

  const card = cards[index];
  const next = () => {
    setStudied((s) => s + 1);
    setFlipped(false);
    setIndex((i) => (i + 1) % cards.length);
  };
  const prev = () => { setFlipped(false); setIndex((i) => (i - 1 + cards.length) % cards.length); };

  const finish = async () => {
    await awardXp(Math.max(10, studied * 2), { minutes: Math.round(studied * 0.5) });
    if (onComplete) onComplete();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-semibold text-muted-foreground">Card {index + 1} of {cards.length}</span>
        <span className="text-xs font-medium text-violet-600 dark:text-violet-400">{studied} reviewed</span>
      </div>

      <button
        onClick={() => setFlipped((f) => !f)}
        className="w-full min-h-[260px] rounded-3xl border border-border bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/20 p-8 flex flex-col items-center justify-center text-center transition-all hover:shadow-lg active:scale-[0.99]"
      >
        <span className="text-[11px] uppercase tracking-widest font-bold text-violet-500 mb-4">
          {flipped ? 'Answer' : 'Question'}
        </span>
        <p className="text-lg font-heading font-semibold leading-relaxed max-w-md">{flipped ? card.back : card.front}</p>
        <span className="text-xs text-muted-foreground mt-6">Tap to flip</span>
      </button>

      <div className="flex items-center justify-between mt-6">
        <Button variant="outline" size="icon" onClick={prev}><ChevronLeft className="w-5 h-5" /></Button>
        <Button variant="outline" onClick={() => { setFlipped(false); setIndex(0); setStudied(0); }}>
          <RotateCcw className="w-4 h-4 mr-2" /> Restart
        </Button>
        <Button variant="outline" size="icon" onClick={next}><ChevronRight className="w-5 h-5" /></Button>
      </div>

      <Button onClick={finish} className="w-full mt-4 bg-violet-600 hover:bg-violet-700">
        <Check className="w-4 h-4 mr-2" /> Finish & earn XP
      </Button>
    </div>
  );
}