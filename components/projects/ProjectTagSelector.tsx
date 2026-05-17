import React from 'react';
import { Badge } from '@/components/ui';

const PROJECT_TAGS = [
  'Frontend',
  'Backend',
  'Full-Stack',
  'Mobile',
  'DevOps',
  'AI/ML',
  'E-Commerce',
  'SaaS',
  'MVP',
  'Redesign',
  'Maintenance',
  'Urgent',
];

const TAG_COLORS: Record<string, string> = {
  Frontend: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  Backend: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  'Full-Stack': 'bg-violet-500/10 text-violet-500 border-violet-500/20',
  Mobile: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
  DevOps: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  'AI/ML': 'bg-pink-500/10 text-pink-500 border-pink-500/20',
  'E-Commerce': 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  SaaS: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
  MVP: 'bg-lime-500/10 text-lime-500 border-lime-500/20',
  Redesign: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
  Maintenance: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  Urgent: 'bg-red-500/10 text-red-500 border-red-500/20',
};

interface ProjectTagSelectorProps {
  selectedTags: string[];
  onChange: (tags: string[]) => void;
}

export const ProjectTagSelector: React.FC<ProjectTagSelectorProps> = ({
  selectedTags,
  onChange,
}) => {
  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onChange(selectedTags.filter((t) => t !== tag));
    } else {
      onChange([...selectedTags, tag]);
    }
  };

  return (
    <div className="space-y-1.5">
      <label className="text-[9px] font-bold text-muted-foreground uppercase">Project Tags</label>
      <div className="flex flex-wrap gap-1.5">
        {PROJECT_TAGS.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => toggleTag(tag)}
            className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border cursor-pointer transition-all select-none ${
              selectedTags.includes(tag)
                ? TAG_COLORS[tag] || 'bg-primary/10 text-primary border-primary/20'
                : 'bg-muted/10 text-muted-foreground border-border hover:bg-muted/20'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
};

export const ProjectTagPill: React.FC<{ tag: string }> = ({ tag }) => {
  const color = TAG_COLORS[tag] || 'bg-muted/20 text-muted-foreground border-border';
  return (
    <span
      className={`inline-flex px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border select-none ${color}`}
    >
      {tag}
    </span>
  );
};
