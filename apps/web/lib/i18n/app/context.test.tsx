// @vitest-environment jsdom
/**
 * Unit tests for I18nProvider and useTranslations.
 *
 * Feature: apps.web.localization
 * Validates: Requirements 3.2, 3.5
 */
import { render, renderHook, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { I18nProvider, useTranslations } from "./context.tsx";
import type { AppCatalog } from "./index.ts";

// Minimal catalog fixture matching the AppCatalog shape
const testCatalog: AppCatalog = {
  common: {
    loading: "Loading…",
    save: "Save",
    cancel: "Cancel",
    language: "Language",
  },
  settings: {
    locale: {
      title: "Language",
      description: "Choose the language for the MiniSlack interface.",
      save: "Save preference",
      saved: "Language updated.",
    },
  },
  workspaces: {
    title: "Workspaces",
    subtitle: "Select or create a workspace.",
  },
};

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider locale="en" catalog={testCatalog}>
      {children}
    </I18nProvider>
  );
}

// ── useTranslations outside provider ──────────────────────────────────────

describe("useTranslations — outside provider", () => {
  it("throws when called outside <I18nProvider>", () => {
    expect(() => {
      renderHook(() => useTranslations());
    }).toThrow("useTranslations must be used within <I18nProvider>");
  });
});

// ── useTranslations inside provider ───────────────────────────────────────

describe("useTranslations — inside provider", () => {
  it("returns the full translator when no namespace is given", () => {
    const { result } = renderHook(() => useTranslations(), { wrapper });
    const t = result.current;
    expect(typeof t).toBe("function");
    expect(t("common.loading" as Parameters<typeof t>[0])).toBe("Loading…");
  });

  it("returns a scoped translator that prepends the namespace", () => {
    const { result } = renderHook(() => useTranslations("settings"), { wrapper });
    const t = result.current;
    // t("locale.title") should resolve settings.locale.title
    expect(t("locale.title")).toBe("Language");
  });

  it("scoped translator resolves a deeper key correctly", () => {
    const { result } = renderHook(() => useTranslations("settings"), { wrapper });
    const t = result.current;
    expect(t("locale.description")).toBe(
      "Choose the language for the MiniSlack interface.",
    );
  });

  it("scoped translator for 'workspaces' resolves workspaces.title", () => {
    const { result } = renderHook(() => useTranslations("workspaces"), { wrapper });
    const t = result.current;
    expect(t("title")).toBe("Workspaces");
  });
});

// ── I18nProvider renders children ─────────────────────────────────────────

describe("I18nProvider", () => {
  it("renders children without error", () => {
    render(
      <I18nProvider locale="en" catalog={testCatalog}>
        <span>hello</span>
      </I18nProvider>,
    );
    expect(screen.getByText("hello")).toBeDefined();
  });
});
