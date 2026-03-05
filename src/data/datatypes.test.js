import { describe, expect, it } from "vitest";
import { defaultTypes } from "./datatypes";

describe("MYPRIMETYPE datatype", () => {
  it("accepts only the configured prime values", () => {
    const valid = ["1", "2", "3", "5", "7", "11", "13", "17", "19", "23", "'11'"];
    const invalid = ["0", "4", "9", "24", "abc", ""];

    for (const value of valid) {
      expect(defaultTypes.MYPRIMETYPE.checkDefault({ default: value })).toBe(true);
    }

    for (const value of invalid) {
      expect(defaultTypes.MYPRIMETYPE.checkDefault({ default: value })).toBe(false);
    }
  });
});

