/**
 * Unit tests for FeaturesSection component.
 * Requirements: 3.1, 3.2, 3.3, 3.4
 */
import { renderToString } from "react-dom/server";
import { describe, it, expect } from "vitest";
import { FeaturesSection } from "./features-section.tsx";

describe("FeaturesSection", () => {
  it("renders a <ul> list container", () => {
    const html = renderToString(<FeaturesSection />);
    expect(html).toContain("<ul");
  });

  it("renders exactly 3 feature <li> items", () => {
    const html = renderToString(<FeaturesSection />);
    // Count the number of <li> opening tags (not including <line> SVG elements)
    const liMatches = html.match(/<li[\s>]/g);
    expect(liMatches).not.toBeNull();
    expect(liMatches?.length).toBe(3);
  });

  it("each feature item contains an icon wrapper, a name, and a description", () => {
    const html = renderToString(<FeaturesSection />);
    
    // Check for icon wrappers (divs with icon-related classes)
    // The icon wrapper has classes like "w-11 h-11 rounded-xl"
    expect(html).toContain("w-11");
    expect(html).toContain("h-11");
    expect(html).toContain("rounded-xl");
    
    // Check for feature names (these are the actual feature names from the component)
    expect(html).toContain("Real-time Messaging");
    expect(html).toContain("Workspaces &amp; Channels");
    expect(html).toContain("File Sharing");
    
    // Check for descriptions (partial text from each description)
    expect(html).toContain("Instant messages");
    expect(html).toContain("Organise your team");
    expect(html).toContain("Share files");
  });

  it("grid container has md:grid-cols-3 in its class list", () => {
    const html = renderToString(<FeaturesSection />);
    // The grid container should have md:grid-cols-3 class
    expect(html).toMatch(/class="[^"]*md:grid-cols-3[^"]*"/);
  });
});
