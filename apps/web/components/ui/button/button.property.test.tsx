// @vitest-environment jsdom
/**
 * Property-based tests for Button component.
 * Uses fast-check to verify invariants across all variant combinations.
 *
 * Feature: auth-pages
 * Property 1: Button loading state implies disabled and Spinner (Requirements 1.9)
 * Property 5: Disabled Button always sets the disabled attribute (Requirements 4.6)
 */
import { render } from "@testing-library/react";
import { describe, it } from "vitest";
import * as fc from "fast-check";
import { Button } from "./button.tsx";

// ── Generators ─────────────────────────────────────────────────────────────

const appearanceArb = fc.constantFrom(
  "default" as const,
  "primary" as const,
  "outline" as const,
  "subtle" as const,
  "transparent" as const,
  "link" as const,
);

const sizeArb = fc.constantFrom(
  "default" as const,
  "sm" as const,
  "lg" as const,
);

const shapeArb = fc.constantFrom(
  "default" as const,
  "square" as const,
  "circle" as const,
);

const variantRecord = fc.record({
  appearance: appearanceArb,
  size: sizeArb,
  shape: shapeArb,
});

// ── Property 1: isLoading=true → button is disabled AND Spinner is present ─

describe("Property 1: Button loading state implies disabled and Spinner", () => {
  it(
    "isLoading=true always disables the button and renders a Spinner for any variant combination",
    async () => {
      await fc.assert(
        fc.asyncProperty(variantRecord, async (props) => {
          const { getByRole, container, unmount } = render(
            <Button {...props} isLoading>
              Click me
            </Button>,
          );

          const button = getByRole("button");
          // Button must be disabled
          if (!button.hasAttribute("disabled")) {
            unmount();
            return false;
          }
          // Spinner must be present in the subtree
          if (container.querySelector("[data-spinner]") === null) {
            unmount();
            return false;
          }

          unmount();
          return true;
        }),
        { numRuns: 100 },
      );
    },
  );
});

// ── Property 5: disabled=true → underlying <button> has disabled attribute ─

describe("Property 5: Disabled Button always sets the disabled attribute", () => {
  it(
    "disabled=true always sets the disabled attribute on the underlying <button> regardless of variant",
    async () => {
      await fc.assert(
        fc.asyncProperty(variantRecord, async (props) => {
          const { getByRole, unmount } = render(
            <Button {...props} disabled>
              Click me
            </Button>,
          );

          const button = getByRole("button");
          const isDisabled = button.hasAttribute("disabled");

          unmount();
          return isDisabled;
        }),
        { numRuns: 100 },
      );
    },
  );
});
