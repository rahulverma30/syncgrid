/**
 * Helper to compute Levenshtein distance between two strings
 */
export function getLevenshteinDistance(a: string, b: string): number {
  const tmpA = a.toLowerCase();
  const tmpB = b.toLowerCase();

  const dp: number[][] = Array(tmpA.length + 1)
    .fill(null)
    .map(() => Array(tmpB.length + 1).fill(0));

  for (let i = 0; i <= tmpA.length; i++) dp[i][0] = i;
  for (let j = 0; j <= tmpB.length; j++) dp[0][j] = j;

  for (let i = 1; i <= tmpA.length; i++) {
    for (let j = 1; j <= tmpB.length; j++) {
      if (tmpA[i - 1] === tmpB[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1, // deletion
          dp[i][j - 1] + 1, // insertion
          dp[i - 1][j - 1] + 1 // substitution
        );
      }
    }
  }
  return dp[tmpA.length][tmpB.length];
}

export interface SearchableProject {
  _id: string;
  name: string;
  code?: string;
  description?: string;
  projectManager?: string;
  tags?: string[];
  [key: string]: any;
}

/**
 * Calculates a search score for a project based on relevance parameters
 */
export function calculateRelevanceScore(project: SearchableProject, query: string): number {
  const q = query.trim().toLowerCase();
  if (!q) return 1;

  let score = 0;

  // 1. Exact project code prefix match (Highest Priority)
  if (project.code) {
    const code = project.code.toLowerCase();
    if (code === q) {
      score += 25;
    } else if (code.startsWith(q)) {
      score += 15;
    } else if (code.includes(q)) {
      score += 8;
    }
  }

  // 2. Project Name matches
  const name = project.name.toLowerCase();
  if (name === q) {
    score += 20;
  } else if (name.startsWith(q)) {
    score += 12;
  } else if (name.includes(q)) {
    score += 6;
  }

  // 3. Typo-tolerance thresholding (distance <= 2)
  const words = name.split(/\s+/);
  words.forEach((word) => {
    const dist = getLevenshteinDistance(word, q);
    if (dist === 0) score += 10;
    else if (dist === 1) score += 5;
    else if (dist === 2) score += 2;
  });

  // 4. Description tag matches
  if (project.tags && project.tags.length > 0) {
    project.tags.forEach((tag) => {
      const t = tag.toLowerCase();
      if (t === q) {
        score += 8;
      } else if (t.includes(q)) {
        score += 3;
      }
    });
  }

  // 5. Project manager match
  if (project.projectManager) {
    const pm = project.projectManager.toLowerCase();
    if (pm === q) {
      score += 10;
    } else if (pm.includes(q)) {
      score += 4;
    }
  }

  // 6. Description match
  if (project.description) {
    const desc = project.description.toLowerCase();
    if (desc.includes(q)) {
      score += 2;
    }
  }

  return score;
}

/**
 * Sorts and filters projects based on search query score
 */
export function rankProjects(projects: SearchableProject[], query: string): SearchableProject[] {
  if (!query.trim()) return projects;

  return projects
    .map((p) => ({
      project: p,
      score: calculateRelevanceScore(p, query),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.project);
}
