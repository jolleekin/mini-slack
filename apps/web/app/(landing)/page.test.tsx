/**
 * Unit tests for Landing Page metadata.
 * **Validates: Requirements 6.1**
 */
import { describe, it, expect } from "vitest";
import { metadata } from "./page.tsx";

describe("Landing Page Metadata", () => {
  it("has title 'MiniSlack — Team Messaging'", () => {
    expect(metadata.title).toBe("MiniSlack — Team Messaging");
  });

  it("has a non-empty description string", () => {
    expect(metadata.description).toBeDefined();
    expect(typeof metadata.description).toBe("string");
    expect(metadata.description).not.toBe("");
    expect((metadata.description as string).length).toBeGreaterThan(0);
  });
});
