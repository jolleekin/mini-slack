// @vitest-environment jsdom
/**
 * Unit tests for LocaleSwitcher component.
 * Requirements: 9.7
 */
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { LocaleSwitcher } from "./locale-switcher.tsx";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

beforeEach(() => {
  mockPush.mockClear();
  // Set a default pathname for location
  Object.defineProperty(window, "location", {
    value: { ...window.location, pathname: "/en/some-page" },
    writable: true,
  });
});

describe("LocaleSwitcher", () => {
  it("renders a <select> with one <option> per supported locale", () => {
    render(
      <LocaleSwitcher
        currentLocale="en"
        supportedLocales={["en"]}
        label="Language"
      />
    );

    const select = screen.getByRole("combobox");
    expect(select).toBeDefined();

    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(1);
    expect(options[0].getAttribute("value")).toBe("en");
  });

  it("the current locale is set as the value of the <select> (marked as selected)", () => {
    render(
      <LocaleSwitcher
        currentLocale="en"
        supportedLocales={["en"]}
        label="Language"
      />
    );

    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(select.value).toBe("en");
  });

  it("renders the label text", () => {
    render(
      <LocaleSwitcher
        currentLocale="en"
        supportedLocales={["en"]}
        label="Language"
      />
    );

    expect(screen.getByText("Language")).toBeDefined();
  });

  it("renders option values as uppercase locale codes", () => {
    render(
      <LocaleSwitcher
        currentLocale="en"
        supportedLocales={["en"]}
        label="Language"
      />
    );

    const option = screen.getByRole("option", { name: "EN" });
    expect(option).toBeDefined();
    expect(option.getAttribute("value")).toBe("en");
  });

  it("calls router.push with the correct path when locale is changed", () => {
    window.location.pathname = "/en/some-page";

    render(
      <LocaleSwitcher
        currentLocale="en"
        supportedLocales={["en", "fr"]}
        label="Language"
      />
    );

    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "fr" } });

    expect(mockPush).toHaveBeenCalledOnce();
    expect(mockPush).toHaveBeenCalledWith("/fr/some-page");
  });

  it("calls router.push with the correct path for a different locale", () => {
    window.location.pathname = "/fr/about";

    render(
      <LocaleSwitcher
        currentLocale="fr"
        supportedLocales={["en", "fr"]}
        label="Language"
      />
    );

    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "en" } });

    expect(mockPush).toHaveBeenCalledOnce();
    expect(mockPush).toHaveBeenCalledWith("/en/about");
  });

  it("does not write cookies when locale is changed", () => {
    window.location.pathname = "/en/some-page";
    const cookieSetter = vi.spyOn(document, "cookie", "set");

    render(
      <LocaleSwitcher
        currentLocale="en"
        supportedLocales={["en", "fr"]}
        label="Language"
      />
    );

    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "fr" } });

    expect(cookieSetter).not.toHaveBeenCalled();
    cookieSetter.mockRestore();
  });
});
