/**
 * Pure layout computation for auto-arrange: grid when no relationships,
 * Fruchterman–Reingold force-directed when there are edges.
 * Locked tables keep their positions; others are laid out around them.
 *
 * @param {Array<{ id: string, x: number, y: number, locked?: boolean }>} tables
 * @param {Array<{ startTableId: string, endTableId: string }>} relationships
 * @param {{ tableWidth?: number }} options
 * @returns {Map<string, { x: number, y: number }>} id -> new position (only for tables that were moved; locked unchanged in map for convenience)
 */
export function computeAutoArrangePositions(tables, relationships, options = {}) {
  const { tableWidth = 200 } = options;
  const nodes = tables.map((t) => ({
    id: t.id,
    x: t.x,
    y: t.y,
    locked: !!t.locked,
  }));

  const idToIndex = new Map(nodes.map((n, i) => [n.id, i]));
  const edges = relationships
    .map((r) => {
      const s = idToIndex.get(r.startTableId);
      const e = idToIndex.get(r.endTableId);
      if (s === undefined || e === undefined || s === e) return null;
      return { source: s, target: e };
    })
    .filter(Boolean);

  if (edges.length === 0) {
    const cols = Math.ceil(Math.sqrt(nodes.length));
    const spacingX = tableWidth + 80;
    const spacingY = 160;
    nodes.forEach((node, index) => {
      if (node.locked) return;
      const col = index % cols;
      const row = Math.floor(index / cols);
      node.x = col * spacingX;
      node.y = row * spacingY;
    });
  } else {
    const area = 2000 * 2000;
    const n = nodes.length;
    const k = Math.sqrt(area / Math.max(1, n));
    const iterations = 200;
    let temperature = 400;

    for (let iter = 0; iter < iterations; iter++) {
      const disp = nodes.map(() => ({ x: 0, y: 0 }));

      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.max(1, Math.hypot(dx, dy));
          const force = (k * k) / dist;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          disp[i].x += fx;
          disp[i].y += fy;
          disp[j].x -= fx;
          disp[j].y -= fy;
        }
      }

      for (const edge of edges) {
        const source = nodes[edge.source];
        const target = nodes[edge.target];
        const dx = source.x - target.x;
        const dy = source.y - target.y;
        const dist = Math.max(1, Math.hypot(dx, dy));
        const force = (dist * dist) / k;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        disp[edge.source].x -= fx;
        disp[edge.source].y -= fy;
        disp[edge.target].x += fx;
        disp[edge.target].y += fy;
      }

      for (let i = 0; i < n; i++) {
        if (nodes[i].locked) continue;
        const dx = disp[i].x;
        const dy = disp[i].y;
        const dist = Math.max(1, Math.hypot(dx, dy));
        const limited = Math.min(dist, temperature);
        if (dist > 0) {
          nodes[i].x += (dx / dist) * limited;
          nodes[i].y += (dy / dist) * limited;
        }
      }

      temperature *= 0.95;
      if (temperature < 5) break;
    }

    let minX = Infinity;
    let minY = Infinity;
    nodes.forEach((n) => {
      minX = Math.min(minX, n.x);
      minY = Math.min(minY, n.y);
    });
    nodes.forEach((n) => {
      if (n.locked) return;
      n.x -= minX;
      n.y -= minY;
    });
  }

  return new Map(nodes.map((n) => [n.id, { x: n.x, y: n.y }]));
}
