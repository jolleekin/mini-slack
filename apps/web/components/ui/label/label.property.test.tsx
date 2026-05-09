// @vitest-environment jsdom
// Feature: apps.web.common-ui.label, Property 1: Custom required string is always rendered

/**
 * Property-based tests for Label component.
 * Uses fast-check to verify invariants across all input combinations.
 *
 * Feature: apps.web.common-ui.label
 * Property 1: Custom required string is always rendered (Validates: Requirements 3.2)
 */
import { render } from "@testing-library/react";
import { describe, it } from "vitest";
import * as fc from "fast-check";
import { Label } from "@/components/ui/label/label.tsx";

// ── Property 1: For any non-empty string passed as `required`, the rendered label output contains that string ─

describe("Property 1: Custom required string is always rendered", () => {
  it(
    "for any non-empty string passed as required, the rendered label text content includes that string",
    async () => {
      await fc.assert(
        fc.asyncProperty(fc.string({ minLength: 1 }), async (requiredStr) => {
          const { container, unmount } = render(
            <Label required={requiredStr}>Field label</Label>,
          );

          const textContent = container.textContent ?? "";
          const includes = textContent.includes(requiredStr);

          unmount();
          return includes;
        }),
        { numRuns: 25 },
      );
    },
  );
});
