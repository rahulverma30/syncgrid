import React, { useMemo } from 'react';
import { HelpCircle, Network, Flame, AlertCircle } from 'lucide-react';

interface DependencyNode {
  id: string;
  code: string;
  title: string;
  status: string;
  category: string;
}

interface DependencyLink {
  from: string;
  to: string;
  type: 'blocks' | 'blocked_by';
}

interface DependencyGraphProps {
  currentTaskId: string;
  tasks: any[];
}

export function DependencyGraph({ currentTaskId, tasks }: DependencyGraphProps) {
  // 1. Gather all tasks linked in the dependency graph of currentTaskId (Cycle-safe DFS)
  const graphData = useMemo(() => {
    const visited = new Set<string>();
    const nodesMap = new Map<string, DependencyNode>();
    const links: DependencyLink[] = [];

    // Helper to traverse and collect related tasks safely
    function traverse(tid: string) {
      if (visited.has(tid)) return;
      visited.add(tid);

      const task = tasks.find((t) => t._id === tid);
      if (!task) return;

      const category = task.statusId?.category || 'todo';

      nodesMap.set(tid, {
        id: tid,
        code: task.code || 'TASK',
        title: task.title || '',
        status: task.statusId?.name || 'Todo',
        category,
      });

      // Process dependencies
      const deps = task.dependencies || [];
      deps.forEach((dep: any) => {
        const targetId = dep.targetTaskId?.toString() || dep.targetTaskId;
        if (!targetId) return;

        // Add link
        if (dep.type === 'blocked_by') {
          links.push({ from: targetId, to: tid, type: 'blocked_by' });
        } else if (dep.type === 'blocks') {
          links.push({ from: tid, to: targetId, type: 'blocks' });
        }

        traverse(targetId);
      });
    }

    traverse(currentTaskId);

    // Compute layout coordinates (Layered layout for clean readability)
    const nodes = Array.from(nodesMap.values());

    // Assign horizontal layers based on dependency count
    const nodeLayers = new Map<string, number>();

    // Default layer
    nodes.forEach((n) => nodeLayers.set(n.id, 0));

    // Simple top-sort layer assignment
    let changed = true;
    let iterations = 0;
    while (changed && iterations < 10) {
      changed = false;
      iterations++;
      links.forEach((link) => {
        const fromLayer = nodeLayers.get(link.from) || 0;
        const toLayer = nodeLayers.get(link.to) || 0;
        if (toLayer <= fromLayer) {
          nodeLayers.set(link.to, fromLayer + 1);
          changed = true;
        }
      });
    }

    // Position coordinates
    const layerCountMap = new Map<number, number>();
    const positionedNodes = nodes.map((node) => {
      const layer = nodeLayers.get(node.id) || 0;
      const count = layerCountMap.get(layer) || 0;
      layerCountMap.set(layer, count + 1);

      // Coordinate offset ratios (X gap: 140px, Y gap: 90px)
      const x = 50 + layer * 150;
      const y = 45 + count * 90;

      return {
        ...node,
        x,
        y,
        layer,
      };
    });

    // 2. Identify Critical Path (the longest active sequence of blocking nodes)
    const criticalPaths = new Set<string>();
    const memoPath = new Map<string, { len: number; path: string[] }>();

    function getLongestPath(nodeId: string): { len: number; path: string[] } {
      if (memoPath.has(nodeId)) return memoPath.get(nodeId)!;

      const activeBlocks = links.filter((l) => l.from === nodeId);
      if (activeBlocks.length === 0) {
        return { len: 1, path: [nodeId] };
      }

      let longest = { len: 0, path: [] as string[] };
      activeBlocks.forEach((link) => {
        const res = getLongestPath(link.to);
        if (res.len > longest.len) {
          longest = res;
        }
      });

      const result = { len: longest.len + 1, path: [nodeId, ...longest.path] };
      memoPath.set(nodeId, result);
      return result;
    }

    // Traverse longest path from all root nodes
    const rootNodes = positionedNodes.filter((n) => !links.some((l) => l.to === n.id));

    let maxChainLength = 0;
    let criticalChain: string[] = [];

    rootNodes.forEach((node) => {
      const res = getLongestPath(node.id);
      if (res.len > maxChainLength) {
        maxChainLength = res.len;
        criticalChain = res.path;
      }
    });

    // If chain spans multiple nodes, tag critical sequence path
    if (criticalChain.length > 1) {
      criticalChain.forEach((nid) => criticalPaths.add(nid));
    }

    return {
      nodes: positionedNodes,
      links,
      criticalPaths,
      criticalChain,
    };
  }, [currentTaskId, tasks]);

  if (graphData.nodes.length <= 1) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-zinc-950/40 border border-zinc-800/80 rounded-2xl select-none">
        <Network className="h-8 w-8 text-zinc-500 mb-2" />
        <span className="text-xs text-zinc-400 font-medium">No external dependencies linked</span>
        <span className="text-[10px] text-zinc-500 mt-1 max-w-[200px] text-center">
          Link task relations inside the dependencies panel to map active network trees.
        </span>
      </div>
    );
  }

  // Calculate viewBox width and height dynamically based on node layers
  const maxLayer = Math.max(...graphData.nodes.map((n) => n.layer));
  const svgWidth = Math.max(480, 100 + maxLayer * 150);

  // Get max node index in any layer to estimate height
  const layerCounts = Array.from(
    graphData.nodes
      .reduce((acc, curr) => {
        acc.set(curr.layer, (acc.get(curr.layer) || 0) + 1);
        return acc;
      }, new Map<number, number>())
      .values()
  );
  const maxNodesInLayer = Math.max(...layerCounts);
  const svgHeight = Math.max(200, 30 + maxNodesInLayer * 95);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border border-zinc-800/60 bg-zinc-900/30 px-3.5 py-2.5 rounded-xl">
        <div className="flex items-center gap-2">
          <Network className="h-4.5 w-4.5 text-indigo-400" />
          <span className="text-xs font-semibold text-zinc-200">Interactive Blocker Map</span>
        </div>

        {graphData.criticalPaths.size > 0 && (
          <div className="flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full">
            <Flame className="h-3 w-3 text-rose-400 animate-pulse" />
            <span className="text-[9px] text-rose-400 font-bold uppercase tracking-wider">
              Critical Path Blocker Detected
            </span>
          </div>
        )}
      </div>

      <div className="overflow-x-auto border border-zinc-800/80 bg-zinc-950/80 rounded-2xl relative shadow-2xl p-4 flex justify-center">
        <svg
          width={svgWidth}
          height={svgHeight}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="select-none"
        >
          {/* Glowing Filters */}
          <defs>
            <filter id="glow-critical" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Links / Relations */}
          {graphData.links.map((link, idx) => {
            const fromNode = graphData.nodes.find((n) => n.id === link.from);
            const toNode = graphData.nodes.find((n) => n.id === link.to);
            if (!fromNode || !toNode) return null;

            // Is this link part of the critical path?
            const isCritical =
              graphData.criticalPaths.has(link.from) &&
              graphData.criticalPaths.has(link.to) &&
              graphData.criticalChain.indexOf(link.to) ===
                graphData.criticalChain.indexOf(link.from) + 1;

            return (
              <g key={`link-${idx}`}>
                <line
                  x1={fromNode.x}
                  y1={fromNode.y}
                  x2={toNode.x}
                  y2={toNode.y}
                  stroke={isCritical ? '#f43f5e' : '#27272a'}
                  strokeWidth={isCritical ? 3.5 : 2}
                  strokeDasharray={isCritical ? 'none' : '4, 4'}
                  filter={isCritical ? 'url(#glow-critical)' : 'none'}
                  className="transition-all duration-300"
                />

                {/* Direction marker indicator */}
                <circle
                  cx={(fromNode.x + toNode.x) / 2}
                  cy={(fromNode.y + toNode.y) / 2}
                  r={3.5}
                  fill={isCritical ? '#f43f5e' : '#71717a'}
                />
              </g>
            );
          })}

          {/* Nodes */}
          {graphData.nodes.map((node) => {
            const isCurrent = node.id === currentTaskId;
            const isCritical = graphData.criticalPaths.has(node.id);

            // Set node category coloring
            let fillClass = 'bg-zinc-900 border-zinc-800 text-zinc-300';
            if (isCurrent) fillClass = 'bg-indigo-950/80 border-indigo-500 text-indigo-200';
            else if (isCritical) fillClass = 'bg-rose-950/70 border-rose-500 text-rose-300';
            else if (node.category === 'done')
              fillClass = 'bg-emerald-950/40 border-emerald-800 text-emerald-400';

            return (
              <g
                key={node.id}
                transform={`translate(${node.x},${node.y})`}
                className="cursor-help group"
              >
                {/* Node Box */}
                <rect
                  x="-55"
                  y="-22"
                  width="110"
                  height="44"
                  rx="10"
                  className={`transition-all duration-300 fill-zinc-950 stroke-2 ${
                    isCurrent
                      ? 'stroke-indigo-500 shadow-lg shadow-indigo-500/20'
                      : isCritical
                        ? 'stroke-rose-500 shadow-lg shadow-rose-500/20'
                        : node.category === 'done'
                          ? 'stroke-emerald-600/80'
                          : 'stroke-zinc-800 hover:stroke-zinc-500'
                  }`}
                />

                {/* Node Task Code */}
                <text
                  x="0"
                  y="-4"
                  textAnchor="middle"
                  className="text-[10px] font-extrabold font-mono tracking-wider fill-zinc-400 uppercase"
                >
                  {node.code}
                </text>

                {/* Node Status */}
                <text
                  x="0"
                  y="12"
                  textAnchor="middle"
                  className={`text-[8px] font-bold uppercase tracking-wider ${
                    isCurrent
                      ? 'fill-indigo-300'
                      : isCritical
                        ? 'fill-rose-400'
                        : node.category === 'done'
                          ? 'fill-emerald-400'
                          : 'fill-zinc-500'
                  }`}
                >
                  {node.status.substring(0, 15)}
                </text>

                {/* HTML Tooltip Hover Box (Native SVG Title) */}
                <title>{`${node.code}: ${node.title} (${node.status})`}</title>
              </g>
            );
          })}
        </svg>
      </div>

      {graphData.criticalPaths.size > 0 && (
        <div className="flex items-start gap-2 bg-rose-500/5 border border-rose-500/10 p-3 rounded-xl">
          <AlertCircle className="h-4.5 w-4.5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-rose-300">Critical Chain Active</span>
            <p className="text-[9px] text-rose-400/90 leading-normal">
              Completion bottleneck identified in your blocker line: (
              {graphData.nodes
                .filter((n) => graphData.criticalPaths.has(n.id))
                .map((n) => n.code)
                .join(' → ')}
              ). Tasks on this path require immediate capacity prioritize rebalancing.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
