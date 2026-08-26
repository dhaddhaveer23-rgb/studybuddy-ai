import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, Image as ImageIcon, Type } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function UploadZone({ onFile, onText, disabled }) {
  const [drag, setDrag] = useState(false);
  const [text, setText] = useState('');
  const [mode, setMode] = useState('text');
  const inputRef = useRef(null);

  const handleFile = (file) => {
    if (!file) return;
    onFile(file);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 p-1 bg-muted rounded-xl">
        {[
          { id: 'text', label: 'Paste Text', icon: Type },
          { id: 'photo', label: 'Photo', icon: ImageIcon },
          { id: 'pdf', label: 'PDF / File', icon: FileText }
        ].map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all',
              mode === m.id ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'
            )}
          >
            <m.icon className="w-4 h-4" /> {m.label}
          </button>
        ))}
      </div>

      {mode === 'text' ? (
        <div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste your textbook chapter, notes, or any study text here..."
            className="w-full min-h-[180px] p-4 rounded-2xl border border-border bg-card text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/40"
          />
          <button
            onClick={() => onText(text)}
            disabled={disabled || !text.trim()}
            className="w-full mt-3 py-3 rounded-xl bg-violet-600 text-white font-semibold text-sm hover:bg-violet-700 disabled:opacity-50 transition-colors"
          >
            Generate study materials
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files[0]); }}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer transition-all',
            drag ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/30' : 'border-border hover:border-violet-400'
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept={mode === 'photo' ? 'image/*' : mode === 'pdf' ? 'application/pdf,image/*' : '*/*'}
            className="hidden"
            onChange={(e) => handleFile(e.target.files[0])}
          />
          <div className="w-14 h-14 rounded-2xl bg-violet-100 dark:bg-violet-950/50 flex items-center justify-center mx-auto mb-4">
            <UploadCloud className="w-7 h-7 text-violet-600 dark:text-violet-400" />
          </div>
          <p className="font-semibold text-sm">{mode === 'photo' ? 'Upload a photo of your textbook' : 'Upload a PDF or file'}</p>
          <p className="text-xs text-muted-foreground mt-1">Tap to browse or drag & drop</p>
        </div>
      )}
    </div>
  );
}