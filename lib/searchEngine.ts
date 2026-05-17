import { getLevenshteinDistance } from '@/utils/searchRanker';

export interface SearchTask {
  _id: string;
  code: string;
  title: string;
  description?: string;
  assignees: any[];
  updatedAt: string | Date;
}

/**
 * Enterprise Fuzzy Search Engine
 * Features weighted scoring, Levenshtein distance typo tolerance, recent activity boosting, and assignee relevance boosting.
 */
export function rankTasks(tasks: any[], query: string, currentUserId?: string): any[] {
  const q = query.trim().toLowerCase();
  if (!q) return tasks;

  const now = new Date().getTime();

  return tasks
    .map((task) => {
      let score = 0;
      const code = (task.code || '').toLowerCase();
      const title = (task.title || '').toLowerCase();
      const desc = (task.description || '').toLowerCase();

      // 1. Match code exactly or as prefix (highest priority)
      if (code === q) score += 35;
      else if (code.startsWith(q)) score += 25;
      else if (code.includes(q)) score += 12;

      // 2. Title exact or prefix
      if (title === q) score += 30;
      else if (title.startsWith(q)) score += 18;
      else if (title.includes(q)) score += 10;

      // 3. Typo tolerance check for title words
      const words = title.split(/\s+/);
      words.forEach((word: string) => {
        const dist = getLevenshteinDistance(word, q);
        if (dist === 0) score += 15;
        else if (dist === 1) score += 8;
        else if (dist === 2) score += 4;
      });

      // 4. Description match
      if (desc.includes(q)) score += 5;

      // Only apply boosts if there's an initial textual relevance match (score > 0)
      if (score > 0) {
        // 5. Recent Activity Boosting (+10 points for updates within last 48 hours)
        const updatedTime = new Date(task.updatedAt).getTime();
        const diffHours = (now - updatedTime) / (1000 * 60 * 60);
        if (diffHours <= 48) {
          score += 10;
        }

        // 6. Assignee Relevance Boosting (+15 points if assigned to the searching user)
        if (currentUserId) {
          const isAssignee = (task.assignees || []).some((a: any) => {
            const idStr = typeof a === 'object' ? a._id?.toString() : a.toString();
            return idStr === currentUserId;
          });
          if (isAssignee) {
            score += 15;
          }
        }
      }

      return { task, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.task);
}
