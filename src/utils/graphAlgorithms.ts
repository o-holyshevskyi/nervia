/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Normalize link endpoint (react-force-graph may mutate link.source/target to objects).
 */
function getLinkSourceId(link: any): string | undefined {
  const s = link.source;
  return typeof s === "string" ? s : s?.id;
}

function getLinkTargetId(link: any): string | undefined {
  const t = link.target;
  return typeof t === "string" ? t : t?.id;
}

/**
 * Find shortest path between two nodes using BFS.
 * Graph is treated as undirected: a link A-B can be traversed both A→B and B→A.
 * Returns path node ids in order and the links that form the path.
 */
export function findShortestPath(
  sourceId: string,
  targetId: string,
  nodes: any[],
  links: any[]
): { pathNodes: string[]; pathLinks: any[] } {
  const getNodeId = (n: any) => (typeof n === "string" ? n : n?.id);
  const nodeIds = new Set(
    nodes.map((n) => getNodeId(n)).filter((id): id is string => id != null)
  );

  if (!nodeIds.has(sourceId) || !nodeIds.has(targetId)) {
    return { pathNodes: [], pathLinks: [] };
  }

  if (sourceId === targetId) {
    return { pathNodes: [sourceId], pathLinks: [] };
  }

  // Build undirected adjacency list: for each link A-B, add both A→B and B→A
  const adj: Record<string, string[]> = {};
  for (const link of links) {
    const sId = getLinkSourceId(link);
    const tId = getLinkTargetId(link);
    if (sId == null || tId == null) continue;
    if (!adj[sId]) adj[sId] = [];
    adj[sId].push(tId);
    if (!adj[tId]) adj[tId] = [];
    adj[tId].push(sId);
  }

  // BFS
  const queue: string[] = [sourceId];
  const visited = new Set<string>([sourceId]);
  const parent: Record<string, string> = {};

  while (queue.length > 0) {
    const u = queue.shift()!;
    if (u === targetId) break;
    const neighbors = adj[u] ?? [];
    for (const v of neighbors) {
      if (visited.has(v)) continue;
      visited.add(v);
      parent[v] = u;
      queue.push(v);
    }
  }

  if (!parent[targetId] && targetId !== sourceId) {
    return { pathNodes: [], pathLinks: [] };
  }

  // Reconstruct path nodes (source ... target)
  const pathNodes: string[] = [];
  let cur: string | undefined = targetId;
  while (cur != null) {
    pathNodes.unshift(cur);
    cur = parent[cur];
  }

  // Collect path links: for each consecutive pair (pathNodes[i], pathNodes[i+1]),
  // find the original link (in either direction) from links
  const pathLinks: any[] = [];
  const linkKey = (a: string, b: string) =>
    a < b ? `${a}\0${b}` : `${b}\0${a}`;
  const pathEdgeSet = new Set<string>();
  for (let i = 0; i < pathNodes.length - 1; i++) {
    pathEdgeSet.add(linkKey(pathNodes[i], pathNodes[i + 1]));
  }

  for (const link of links) {
    const sId = getLinkSourceId(link);
    const tId = getLinkTargetId(link);
    if (sId != null && tId != null && pathEdgeSet.has(linkKey(sId, tId))) {
      pathLinks.push(link);
    }
  }

  return { pathNodes, pathLinks };
}
