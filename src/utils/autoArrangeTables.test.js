import { describe, expect, it } from "vitest";
import { autoArrangeTables } from "./autoArrangeTables";

function makeTable(id, fields = 1) {
  return {
    id,
    name: id,
    x: 0,
    y: 0,
    fields: Array.from({ length: fields }, (_, i) => ({ id: `${id}_f${i}` })),
  };
}

describe("autoArrangeTables graph layout", () => {
  it("returns empty map for empty input", () => {
    const result = autoArrangeTables([], []);
    expect(result).toBeInstanceOf(Map);
    expect(result.size).toBe(0);
  });

  it("is deterministic for same graph input", () => {
    const tables = [makeTable("A"), makeTable("B"), makeTable("C")];
    const relationships = [
      { startTableId: "A", endTableId: "B" },
      { startTableId: "B", endTableId: "C" },
    ];

    const first = autoArrangeTables(tables, relationships);
    const second = autoArrangeTables(tables, relationships);

    expect(Array.from(first.entries())).toEqual(Array.from(second.entries()));
  });

  it("places layered chain nodes in increasing x by layer", () => {
    const tables = [makeTable("A"), makeTable("B"), makeTable("C")];
    const relationships = [
      { startTableId: "A", endTableId: "B" },
      { startTableId: "B", endTableId: "C" },
    ];

    const result = autoArrangeTables(tables, relationships);
    expect(result.size).toBe(3);
    expect(result.get("A").x).toBeLessThan(result.get("B").x);
    expect(result.get("B").x).toBeLessThan(result.get("C").x);
  });

  it("separates disconnected components along x", () => {
    const tables = [makeTable("A"), makeTable("B"), makeTable("X"), makeTable("Y")];
    const relationships = [
      { startTableId: "A", endTableId: "B" },
      { startTableId: "X", endTableId: "Y" },
    ];

    const result = autoArrangeTables(tables, relationships);
    const comp1MaxX = Math.max(result.get("A").x, result.get("B").x);
    const comp2MinX = Math.min(result.get("X").x, result.get("Y").x);

    // Components are laid out side-by-side with a positive inter-component gap.
    expect(Math.abs(comp2MinX - comp1MaxX)).toBeGreaterThan(0);
  });

  it("keeps directed edges left-to-right in a connected DAG", () => {
    const tables = [makeTable("A"), makeTable("B"), makeTable("C"), makeTable("D")];
    const relationships = [
      { startTableId: "A", endTableId: "C" },
      { startTableId: "A", endTableId: "D" },
      { startTableId: "B", endTableId: "C" },
      { startTableId: "C", endTableId: "D" },
    ];

    const result = autoArrangeTables(tables, relationships);

    for (const edge of relationships) {
      const from = result.get(edge.startTableId);
      const to = result.get(edge.endTableId);
      expect(from.x).toBeLessThan(to.x);
    }
  });
});

