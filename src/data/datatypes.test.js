import { describe, it, expect } from "vitest";
import { defaultTypes } from "./datatypes";

describe("MYPRIMETYPE", () => {
  const checkDefault = defaultTypes.MYPRIMETYPE?.checkDefault;
  if (!checkDefault) {
    it.skip("MYPRIMETYPE has checkDefault", () => {});
    return;
  }

  it("accepts odd numbers as default (1, 3, 5, 9, 11)", () => {
    expect(checkDefault({ default: "1" })).toBe(true);
    expect(checkDefault({ default: "3" })).toBe(true);
    expect(checkDefault({ default: "5" })).toBe(true);
    expect(checkDefault({ default: "9" })).toBe(true);
    expect(checkDefault({ default: "11" })).toBe(true);
    expect(checkDefault({ default: "101" })).toBe(true);
    expect(checkDefault({ default: "-1" })).toBe(true);
    expect(checkDefault({ default: "-3" })).toBe(true);
  });

  it("rejects even numbers as default", () => {
    expect(checkDefault({ default: "0" })).toBe(false);
    expect(checkDefault({ default: "2" })).toBe(false);
    expect(checkDefault({ default: "4" })).toBe(false);
    expect(checkDefault({ default: "6" })).toBe(false);
    expect(checkDefault({ default: "8" })).toBe(false);
    expect(checkDefault({ default: "10" })).toBe(false);
    expect(checkDefault({ default: "-2" })).toBe(false);
  });

  it("rejects non-integers and invalid strings", () => {
    expect(checkDefault({ default: "1.5" })).toBe(false);
    expect(checkDefault({ default: "abc" })).toBe(false);
    expect(checkDefault({ default: "" })).toBe(false);
    expect(checkDefault({ default: "3.0" })).toBe(false);
  });
});
