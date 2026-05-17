import React from 'react';
import { Tag } from 'lucide-react';

export const TAG_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  VIP: { bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/20' },
  Enterprise: { bg: 'bg-indigo-500/10', text: 'text-indigo-500', border: 'border-indigo-500/20' },
  Retainer: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/20' },
  Startup: { bg: 'bg-sky-500/10', text: 'text-sky-500', border: 'border-sky-500/20' },
  'High Value': { bg: 'bg-rose-500/10', text: 'text-rose-500', border: 'border-rose-500/20' },
  Inactive: { bg: 'bg-slate-500/10', text: 'text-slate-500', border: 'border-slate-500/20' },
};

interface ClientTagSelectorProps {
  selectedTags: string[];
  onChange: (tags: string[]) => void;
}

export const ClientTagSelector: React.FC<ClientTagSelectorProps> = ({ selectedTags, onChange }) => {
  const allTags = ['VIP', 'Enterprise', 'Retainer', 'Startup', 'High Value', 'Inactive'];

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onChange(selectedTags.filter((t) => t !== tag));
    } else {
      onChange([...selectedTags, tag]);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
        <Tag className="w-3 h-3" /> Account Class Tags
      </label>
      <div className="flex flex-wrap gap-2 p-3 bg-muted/40 rounded-xl border border-border">
        {allTags.map((tag) => {
          const isSelected = selectedTags.includes(tag);
          const color = TAG_COLORS[tag] || {
            bg: 'bg-muted',
            text: 'text-foreground',
            border: 'border-border',
          };

          return (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all duration-200 cursor-pointer ${
                isSelected
                  ? `${color.bg} ${color.text} ${color.border} shadow-sm scale-[1.03] ring-1 ring-offset-0 ring-current`
                  : 'bg-background hover:bg-muted text-muted-foreground border-border hover:text-foreground scale-100'
              }`}
            >
              {tag}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export const TagPill: React.FC<{ tag: string }> = ({ tag }) => {
  const color = TAG_COLORS[tag] || {
    bg: 'bg-muted/10',
    text: 'text-muted-foreground',
    border: 'border-muted/20',
  };
  return (
    <span
      className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${color.bg} ${color.text} ${color.border} uppercase tracking-wider`}
    >
      {tag}
    </span>
  );
};
