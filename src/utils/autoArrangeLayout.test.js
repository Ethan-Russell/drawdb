import { describe, it, expect } from "vitest";
import { computeAutoArrangePositions } from "./autoArrangeLayout";

describe("computeAutoArrangePositions", () => {
  const tableWidth = 200;

  describe("without relationships (grid layout)", () => {
    it("arranges tables in a grid when there are no edges", () => {
      const tables = [
        { id: "a", x: 0, y: 0, locked: false },
        { id: "b", x: 100, y: 100, locked: false },
        { id: "c", x: 200, y: 200, locked: false },
        { id: "d", x: 300, y: 300, locked: false },
      ];
      const positions = computeAutoArrangePositions(tables, [], { tableWidth });
      const spacingX = tableWidth + 80;
      const spacingY = 160;
      // 4 tables -> cols = 2, rows = 2
      expect(positions.get("a")).toEqual({ x: 0, y: 0 });
      expect(positions.get("b")).toEqual({ x: spacingX, y: 0 });
      expect(positions.get("c")).toEqual({ x: 0, y: spacingY });
      expect(positions.get("d")).toEqual({ x: spacingX, y: spacingY });
    });

    it("uses reasonable spacing (not excessively large)", () => {
      const tables = [
        { id: "a", x: 0, y: 0, locked: false },
        { id: "b", x: 0, y: 0, locked: false },
      ];
      const positions = computeAutoArrangePositions(tables, [], { tableWidth });
      const spacingX = tableWidth + 80;
      expect(positions.get("a")).toEqual({ x: 0, y: 0 });
      expect(positions.get("b")).toEqual({ x: spacingX, y: 0 });
      // Spacing should be tableWidth + 80, not orders of magnitude larger
      expect(spacingX).toBeLessThan(500);
      expect(spacingX).toBeGreaterThan(200);
    });
  });

  describe("with relationships (force-directed)", () => {
    it("runs and returns positions when there are edges", () => {
      const tables = [
        { id: "t1", x: 0, y: 0, locked: false },
        { id: "t2", x: 500, y: 500, locked: false },
      ];
      const relationships = [{ startTableId: "t1", endTableId: "t2" }];
      const positions = computeAutoArrangePositions(tables, relationships, {
        tableWidth,
      });
      expect(positions.get("t1")).toBeDefined();
      expect(positions.get("t2")).toBeDefined();
      expect(positions.size).toBe(2);
    });

    it("keeps locked tables in place; only unlocks move", () => {
      const tables = [
        { id: "locked", x: 1000, y: 1000, locked: true },
        { id: "free", x: 0, y: 0, locked: false },
      ];
      const relationships = [{ startTableId: "locked", endTableId: "free" }];
      const positions = computeAutoArrangePositions(tables, relationships, {
        tableWidth,
      });
      // Locked table position must be unchanged (normalization subtracts min, so locked stays at 1000,1000 until we normalize - but in the util we only subtract from non-locked, so locked stays at their computed position which after FR is still their initial position since we skip applying forces to them... Actually in the loop we don't move locked nodes, so locked stays at (1000,1000). Then we compute minX/minY over all nodes - so min might be from the free node. Then we subtract min only from non-locked. So locked stays at (1000, 1000), free gets shifted. So locked table should still be at (1000, 1000).
      expect(positions.get("locked")).toEqual({ x: 1000, y: 1000 });
      // Free table should have moved (we only assert it's present and is a pair of numbers)
      const freePos = positions.get("free");
      expect(freePos).toBeDefined();
      expect(typeof freePos.x).toBe("number");
      expect(typeof freePos.y).toBe("number");
    });
  });

  describe("spacing is reasonable", () => {
    it("grid: tables are not spaced much further than needed", () => {
      const tables = [
        { id: "a", x: 0, y: 0, locked: false },
        { id: "b", x: 0, y: 0, locked: false },
        { id: "c", x: 0, y: 0, locked: false },
      ];
      const positions = computeAutoArrangePositions(tables, [], { tableWidth });
      const spacingX = tableWidth + 80;
      const spacingY = 160;
      const a = positions.get("a");
      const b = positions.get("b");
      const c = positions.get("c");
      const distHoriz = Math.abs((b?.x ?? 0) - (a?.x ?? 0));
      const distVert = Math.abs((c?.y ?? 0) - (a?.y ?? 0));
      expect(distHoriz).toBeLessThanOrEqual(spacingX + 1);
      expect(distVert).toBeLessThanOrEqual(spacingY + 1);
      // Reasonable upper bound: not 1000+ pixels between adjacent tables
      expect(distHoriz).toBeLessThan(400);
      expect(distVert).toBeLessThan(250);
    });

    it("force-directed: connected tables end up in bounded spread", () => {
      const tables = [
        { id: "t1", x: 0, y: 0, locked: false },
        { id: "t2", x: 100, y: 0, locked: false },
      ];
      const relationships = [{ startTableId: "t1", endTableId: "t2" }];
      const positions = computeAutoArrangePositions(tables, relationships, {
        tableWidth,
      });
      const p1 = positions.get("t1");
      const p2 = positions.get("t2");
      const dist = Math.hypot((p2?.x ?? 0) - (p1?.x ?? 0), (p2?.y ?? 0) - (p1?.y ?? 0));
      // Layout should keep them in a reasonable range (not thousands of pixels apart)
      expect(dist).toBeLessThan(2000);
    });
  });
});
