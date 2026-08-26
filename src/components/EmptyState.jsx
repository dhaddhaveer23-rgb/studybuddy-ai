import React from 'react';
import { Sparkles } from 'lucide-react';

export default function EmptyState({ title, description, action }) {
  return (
    <div className="text-center py-16 px-4">
      <div className="w-16 h-16 rounded-2xl bg-violet-100 dark:bg-violet-950/40 flex items-center justify-center mx-auto mb-4">
        <Sparkles className="w-8 h-8 text-violet-500" />
      </div>
      <h3 className="font-heading font-bold text-lg">{title}</h3>
      {description && <p className="text-sm text-muted-foreground mt-1.5 max-w-sm mx-auto">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}