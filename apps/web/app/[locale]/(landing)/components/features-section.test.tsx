/**
 * Unit tests for FeaturesSection component.
 * Requirements: 3.1, 3.2, 3.3, 3.4
 */
import { renderToString } from "react-dom/server";
import { describe, it, expect } from "vitest";
import { FeaturesSection } from "./features-section.tsx";

const defaultProps = {
  sectionLabel: "Features",
  heading: "Everything your team needs",
  subheading: "Built for speed and simplicity — the tools your team actually uses, without the bloat.",
  features: [
    {
      name: "Real-time Messaging",
      description: "Instant messages across channels and direct conversations, with zero perceptible lag.",
    },
    {
      name: "Workspaces & Channels",
      description: "Organise your team into focused workspaces with public and private channels.",
    },
    {
      name: "File Sharing",
      description: "Share files directly in conversations — images, documents, and more.",
    },
  ],
};

describe("FeaturesSection", () => {
  it("renders a <ul> list container", () => {
    const html = renderToString(<FeaturesSection {...defaultProps} />);
    expect(html).toContain("<ul");
  });

  it("renders exactly 3 feature <li> items", () => {
    const html = renderToString(<FeaturesSection {...defaultProps} />);
    // Count the number of <li> opening tags (not including <line> SVG elements)
    const liMatches = html.match(/<li[\s>]/g);
    expect(liMatches).not.toBeNull();
    expect(liMatches?.length).toBe(3);
  });

  it("each feature item contains an icon wrapper, a name, and a description", () => {
    const html = renderToString(<FeaturesSection {...defaultProps} />);
    
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
    const html = renderToString(<FeaturesSection {...defaultProps} />);
    // The grid container should have md:grid-cols-3 class
    expect(html).toMatch(/class="[^"]*md:grid-cols-3[^"]*"/);
  });

  it("renders the sectionLabel prop", () => {
    const html = renderToString(<FeaturesSection {...defaultProps} sectionLabel="Capabilities" />);
    expect(html).toContain("Capabilities");
  });

  it("renders the heading prop", () => {
    const html = renderToString(<FeaturesSection {...defaultProps} heading="Test heading" />);
    expect(html).toContain("Test heading");
  });

  it("renders the subheading prop", () => {
    const html = renderToString(<FeaturesSection {...defaultProps} subheading="Test subheading" />);
    expect(html).toContain("Test subheading");
  });

  it("renders custom features from the features prop", () => {
    const customFeatures = [
      { name: "Feature A", description: "Description A" },
      { name: "Feature B", description: "Description B" },
    ];
    const html = renderToString(<FeaturesSection {...defaultProps} features={customFeatures} />);
    expect(html).toContain("Feature A");
    expect(html).toContain("Description A");
    expect(html).toContain("Feature B");
    expect(html).toContain("Description B");
  });
});
