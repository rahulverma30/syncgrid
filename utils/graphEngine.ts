export interface MilestoneNode {
  _id: string;
  title: string;
  dueDate?: string;
  dependsOn?: string[];
  status: string;
}

/**
 * Checks recursively if adding a dependency from `milestoneId` -> `dependsOnId`
 * creates a circular loop in the dependency graph.
 */
export function detectCircularDependency(
  milestones: MilestoneNode[],
  milestoneId: string,
  candidateDependsOnId: string
): boolean {
  // If a milestone depends on itself, it's a direct cycle
  if (milestoneId === candidateDependsOnId) return true;

  // Build adj list for the CURRENT state of the graph
  const adj = new Map<string, string[]>();
  milestones.forEach((m) => {
    adj.set(m._id, m.dependsOn || []);
  });

  // Temporarily ADD the proposed edge: milestoneId now depends on candidateDependsOnId
  // which means candidateDependsOnId blocks milestoneId, so there is a directed path from candidateDependsOnId -> milestoneId.
  const currentDeps = adj.get(milestoneId) || [];
  adj.set(milestoneId, [...currentDeps, candidateDependsOnId]);

  // Use DFS cycle detection
  const visited = new Set<string>();
  const recStack = new Set<string>();

  function dfs(u: string): boolean {
    visited.add(u);
    recStack.add(u);

    const neighbors = adj.get(u) || [];
    for (const v of neighbors) {
      if (!visited.has(v)) {
        if (dfs(v)) return true;
      } else if (recStack.has(v)) {
        return true; // found back-edge / cycle!
      }
    }

    recStack.delete(u);
    return false;
  }

  // Run DFS from each node in the graph
  for (const m of milestones) {
    if (!visited.has(m._id)) {
      if (dfs(m._id)) return true;
    }
  }

  return false;
}

/**
 * Traverses recursively all blocker milestones and returns a unique array of their IDs.
 */
export function getRecursiveBlockers(
  milestones: MilestoneNode[],
  milestoneId: string,
  visited = new Set<string>()
): string[] {
  if (visited.has(milestoneId)) return [];
  visited.add(milestoneId);

  const m = milestones.find((x) => x._id === milestoneId);
  if (!m || !m.dependsOn || m.dependsOn.length === 0) return [];

  const direct = m.dependsOn;
  let all: string[] = [...direct];

  for (const depId of direct) {
    all = [...all, ...getRecursiveBlockers(milestones, depId, visited)];
  }

  return Array.from(new Set(all));
}

/**
 * Calculates the Critical Path of incomplete milestones.
 * A critical path includes milestones that are currently incomplete and are blocking other milestones.
 */
export function getCriticalPathMilestones(milestones: MilestoneNode[]): string[] {
  const incomplete = milestones.filter((m) => m.status !== 'completed');
  if (incomplete.length === 0) return [];

  // Build a reverse adjacency list to track what blocks what
  const blocksMap = new Map<string, string[]>();
  incomplete.forEach((m) => {
    const deps = m.dependsOn || [];
    deps.forEach((depId) => {
      const current = blocksMap.get(depId) || [];
      if (!current.includes(m._id)) {
        blocksMap.set(depId, [...current, m._id]);
      }
    });
  });

  // Find all incomplete milestones that have at least one blocker dependency,
  // or are currently direct bottlenecks.
  const critical = new Set<string>();

  // A node is critical if it is incomplete and has dependent milestones waiting on it
  incomplete.forEach((m) => {
    const blockedList = blocksMap.get(m._id) || [];
    if (blockedList.length > 0) {
      critical.add(m._id);
      // Recursively add all dependencies of this node as critical
      const recursiveDeps = getRecursiveBlockers(milestones, m._id);
      recursiveDeps.forEach((depId) => critical.add(depId));
    }
  });

  return Array.from(critical);
}
