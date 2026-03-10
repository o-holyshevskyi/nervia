import { findShortestPath } from '../src/utils/graphAlgorithms';

// Helpers to build simple test graphs
function node(id: string) {
  return { id };
}
function link(source: string, target: string) {
  return { source, target };
}

describe('findShortestPath', () => {
  // ──────────────────────────────────────────────
  // Basic cases
  // ──────────────────────────────────────────────

  test('returns single-node path when source === target', () => {
    const nodes = [node('A'), node('B')];
    const links = [link('A', 'B')];
    const result = findShortestPath('A', 'A', nodes, links);
    expect(result.pathNodes).toEqual(['A']);
    expect(result.pathLinks).toHaveLength(0);
  });

  test('finds direct path between two adjacent nodes', () => {
    const nodes = [node('A'), node('B')];
    const links = [link('A', 'B')];
    const result = findShortestPath('A', 'B', nodes, links);
    expect(result.pathNodes).toEqual(['A', 'B']);
    expect(result.pathLinks).toHaveLength(1);
  });

  test('traverses graph in reverse direction (undirected)', () => {
    // Link is stored B→A but we query A→B
    const nodes = [node('A'), node('B')];
    const links = [link('B', 'A')];
    const result = findShortestPath('A', 'B', nodes, links);
    expect(result.pathNodes).toEqual(['A', 'B']);
    expect(result.pathLinks).toHaveLength(1);
  });

  test('finds shortest path in a linear chain', () => {
    // A - B - C - D
    const nodes = [node('A'), node('B'), node('C'), node('D')];
    const links = [link('A', 'B'), link('B', 'C'), link('C', 'D')];
    const result = findShortestPath('A', 'D', nodes, links);
    expect(result.pathNodes).toEqual(['A', 'B', 'C', 'D']);
    expect(result.pathLinks).toHaveLength(3);
  });

  test('finds shortest path when multiple routes exist', () => {
    // A - B - C
    //  \     /
    //   D---
    // Shortest: A → D → C  (2 hops) vs A → B → C (2 hops as well, BFS takes first found)
    const nodes = [node('A'), node('B'), node('C'), node('D')];
    const links = [link('A', 'B'), link('B', 'C'), link('A', 'D'), link('D', 'C')];
    const result = findShortestPath('A', 'C', nodes, links);
    expect(result.pathNodes).toHaveLength(3); // 3 nodes = 2 hops
    expect(result.pathNodes[0]).toBe('A');
    expect(result.pathNodes[result.pathNodes.length - 1]).toBe('C');
    expect(result.pathLinks).toHaveLength(2);
  });

  test('returns empty arrays when no path exists (disconnected graph)', () => {
    const nodes = [node('A'), node('B'), node('C')];
    const links = [link('A', 'B')]; // C is isolated
    const result = findShortestPath('A', 'C', nodes, links);
    expect(result.pathNodes).toEqual([]);
    expect(result.pathLinks).toEqual([]);
  });

  // ──────────────────────────────────────────────
  // Missing nodes
  // ──────────────────────────────────────────────

  test('returns empty arrays when source node does not exist', () => {
    const nodes = [node('B'), node('C')];
    const links = [link('B', 'C')];
    const result = findShortestPath('GHOST', 'C', nodes, links);
    expect(result.pathNodes).toEqual([]);
    expect(result.pathLinks).toEqual([]);
  });

  test('returns empty arrays when target node does not exist', () => {
    const nodes = [node('A'), node('B')];
    const links = [link('A', 'B')];
    const result = findShortestPath('A', 'GHOST', nodes, links);
    expect(result.pathNodes).toEqual([]);
    expect(result.pathLinks).toEqual([]);
  });

  // ──────────────────────────────────────────────
  // react-force-graph mutated objects (source/target become objects)
  // ──────────────────────────────────────────────

  test('handles object-form source/target in links (react-force-graph mutation)', () => {
    const nodes = [node('A'), node('B'), node('C')];
    const links = [
      { source: { id: 'A' }, target: { id: 'B' } },
      { source: { id: 'B' }, target: { id: 'C' } },
    ];
    const result = findShortestPath('A', 'C', nodes, links);
    expect(result.pathNodes).toEqual(['A', 'B', 'C']);
    expect(result.pathLinks).toHaveLength(2);
  });

  test('handles mixed string/object forms in same link list', () => {
    const nodes = [node('A'), node('B'), node('C')];
    const links = [
      { source: 'A', target: { id: 'B' } },
      { source: { id: 'B' }, target: 'C' },
    ];
    const result = findShortestPath('A', 'C', nodes, links);
    expect(result.pathNodes).toEqual(['A', 'B', 'C']);
  });

  // ──────────────────────────────────────────────
  // Edge cases
  // ──────────────────────────────────────────────

  test('handles empty nodes and links', () => {
    const result = findShortestPath('A', 'B', [], []);
    expect(result.pathNodes).toEqual([]);
    expect(result.pathLinks).toEqual([]);
  });

  test('handles a single node graph with self-lookup', () => {
    const result = findShortestPath('A', 'A', [node('A')], []);
    expect(result.pathNodes).toEqual(['A']);
    expect(result.pathLinks).toHaveLength(0);
  });

  test('skips links with null/undefined endpoints', () => {
    const nodes = [node('A'), node('B')];
    // Malformed links interspersed with a valid one
    const links = [
      { source: null, target: 'B' },
      { source: 'A', target: undefined },
      { source: 'A', target: 'B' },
    ];
    const result = findShortestPath('A', 'B', nodes, links);
    expect(result.pathNodes).toEqual(['A', 'B']);
    expect(result.pathLinks).toHaveLength(1);
  });

  test('BFS finds shortest (fewest hops) not just any path', () => {
    // Long path: A-X1-X2-X3-B  (4 hops)
    // Short path: A-B            (1 hop)
    const nodes = [node('A'), node('X1'), node('X2'), node('X3'), node('B')];
    const links = [
      link('A', 'X1'),
      link('X1', 'X2'),
      link('X2', 'X3'),
      link('X3', 'B'),
      link('A', 'B'), // direct shortcut
    ];
    const result = findShortestPath('A', 'B', nodes, links);
    expect(result.pathNodes).toEqual(['A', 'B']); // takes the 1-hop route
    expect(result.pathLinks).toHaveLength(1);
  });
});
