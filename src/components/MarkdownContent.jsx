import React from 'react';
import ReactMarkdown from 'react-markdown';

export default function MarkdownContent({ content, className }) {
  if (!content) return <p className="text-sm text-muted-foreground">Nothing here yet.</p>;
  return (
    <div className={'prose-study ' + (className || '')}>
      <ReactMarkdown
        components={{
          h1: ({ node, ...p }) => <h1 className="text-xl font-heading font-bold mt-5 mb-2" {...p} />,
          h2: ({ node, ...p }) => <h2 className="text-lg font-heading font-bold mt-4 mb-2" {...p} />,
          h3: ({ node, ...p }) => <h3 className="text-base font-heading font-semibold mt-3 mb-1.5" {...p} />,
          p: ({ node, ...p }) => <p className="text-sm leading-relaxed my-2 text-foreground/90" {...p} />,
          ul: ({ node, ...p }) => <ul className="list-disc pl-5 my-2 space-y-1 text-sm" {...p} />,
          ol: ({ node, ...p }) => <ol className="list-decimal pl-5 my-2 space-y-1 text-sm" {...p} />,
          li: ({ node, ...p }) => <li className="text-foreground/90 leading-relaxed" {...p} />,
          strong: ({ node, ...p }) => <strong className="font-semibold text-foreground" {...p} />,
          code: ({ node, ...p }) => <code className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono" {...p} />
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}