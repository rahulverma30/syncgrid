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

/**
 * Enterprise Document Search Ranking Engine
 * Implements weighted scoring, Levenshtein distance typo tolerance, title boosts,
 * recency multipliers, and department-aware relevance mapping.
 */
export function rankDocuments(
  documents: any[],
  query: string,
  currentUserId?: string,
  userDepartment?: string
): any[] {
  const q = query.trim().toLowerCase();
  if (!q) return documents;

  const now = new Date().getTime();

  return documents
    .map((doc) => {
      let score = 0;
      const title = (doc.title || '').toLowerCase();
      const content = (doc.content || '').toLowerCase();
      const tags = (doc.tags || []).map((t: string) => t.toLowerCase());

      // 1. Match title exactly or as prefix (extremely high priority)
      if (title === q) score += 100;
      else if (title.startsWith(q)) score += 60;
      else if (title.includes(q)) score += 30;

      // 2. Title Levenshtein Typo Tolerance
      const words = title.split(/\s+/);
      words.forEach((word: string) => {
        const dist = getLevenshteinDistance(word, q);
        if (dist === 0) score += 20;
        else if (dist === 1) score += 10;
        else if (dist === 2) score += 5;
      });

      // 3. Content matches
      if (content.includes(q)) {
        score += 15;
        // Boost score based on query occurrences inside body
        const matchesCount = (
          content.match(new RegExp(q.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g')) || []
        ).length;
        score += Math.min(20, matchesCount * 2);
      }

      // 4. Tags match
      tags.forEach((tag: string) => {
        if (tag === q) score += 25;
        else if (tag.includes(q)) score += 10;
      });

      // Apply boosts only if there is a primary search hit (score > 0)
      if (score > 0) {
        // 5. Weighted Recency Boost (+15 points for updates in last 7 days, decay afterward)
        const updatedTime = new Date(doc.updatedAt || doc.createdAt).getTime();
        const diffDays = (now - updatedTime) / (1000 * 60 * 60 * 24);
        if (diffDays <= 7) {
          score += 25;
        } else if (diffDays <= 30) {
          score += 12;
        }

        // 6. Department-aware Relevance Boost (+20 points if matches searching user's department)
        if (userDepartment) {
          const docDept = (
            doc.spaceId?.department ||
            doc.categoryId?.department ||
            ''
          ).toLowerCase();
          if (docDept === userDepartment.toLowerCase()) {
            score += 20;
          }
        }
      }

      return { doc, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.doc);
}
