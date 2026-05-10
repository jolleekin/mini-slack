import { CSSProperties } from "react";

import { Card } from "@/components/ui/card/card.tsx";

import { PageHeader, Section } from "../section.tsx";

import { SelectableCard } from "./selectable-card.tsx";

// ── Page ───────────────────────────────────────────────────────────────────

export default function CardPage() {
  return (
    <>
      <PageHeader
        title="Card"
        description="Surface container component for grouping related content with Fluent Design styling."
      />

      {/* Appearance */}
      <Section title="Appearance">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-gray-a11 text-xs font-medium tracking-wide uppercase">
              Filled (default)
            </p>
            <Card>
              <h3 className="text-sm font-semibold">Card Title</h3>
              <p className="text-gray-a11 text-sm">
                Default style. Use for most card designs.
              </p>
            </Card>
          </div>

          <div className="space-y-2">
            <p className="text-gray-a11 text-xs font-medium tracking-wide uppercase">
              Filled Alternative
            </p>
            <Card appearance="filled-alternative">
              <h3 className="text-sm font-semibold">Card Title</h3>
              <p className="text-gray-a11 text-sm">
                Darker background for use on white/light surfaces.
              </p>
            </Card>
          </div>

          <div className="space-y-2">
            <p className="text-gray-a11 text-xs font-medium tracking-wide uppercase">
              Outline
            </p>
            <Card appearance="outline">
              <h3 className="text-sm font-semibold">Card Title</h3>
              <p className="text-gray-a11 text-sm">
                Transparent background with a visible border.
              </p>
            </Card>
          </div>

          <div className="space-y-2">
            <p className="text-gray-a11 text-xs font-medium tracking-wide uppercase">
              Subtle
            </p>
            <Card appearance="subtle">
              <h3 className="text-sm font-semibold">Card Title</h3>
              <p className="text-gray-a11 text-sm">
                No background or border. Interaction states only.
              </p>
            </Card>
          </div>
        </div>
      </Section>

      {/* Size */}
      <Section title="Size">
        <div className="space-y-4">
          <div className="space-y-1">
            <p className="text-gray-a11 text-xs font-medium tracking-wide uppercase">
              Small
            </p>
            <Card size="small">
              <p className="text-sm">Small card — 8px padding and gap.</p>
            </Card>
          </div>
          <div className="space-y-1">
            <p className="text-gray-a11 text-xs font-medium tracking-wide uppercase">
              Medium (default)
            </p>
            <Card size="medium">
              <p className="text-sm">Medium card — 12px padding and gap.</p>
            </Card>
          </div>
          <div className="space-y-1">
            <p className="text-gray-a11 text-xs font-medium tracking-wide uppercase">
              Large
            </p>
            <Card size="large">
              <p className="text-sm">Large card — 16px padding and gap.</p>
            </Card>
          </div>
          <div className="space-y-1">
            <p className="text-gray-a11 text-xs font-medium tracking-wide uppercase">
              Custom
            </p>
            <Card style={{ "--card-size": "24px" } as CSSProperties}>
              <p className="text-sm">Custom card — generous padding and gap.</p>
            </Card>
          </div>
        </div>
      </Section>

      {/* Orientation */}
      <Section title="Orientation">
        <div className="space-y-4">
          <div className="space-y-1">
            <p className="text-gray-a11 text-xs font-medium tracking-wide uppercase">
              Vertical (default)
            </p>
            <Card orientation="vertical" className="max-w-xs">
              <div className="bg-gray-a4 h-24 rounded-lg" />
              <h3 className="text-sm font-semibold">Vertical Card</h3>
              <p className="text-gray-a11 text-sm">
                Content stacks top to bottom.
              </p>
            </Card>
          </div>
          <div className="space-y-1">
            <p className="text-gray-a11 text-xs font-medium tracking-wide uppercase">
              Horizontal
            </p>
            <Card orientation="horizontal" className="max-w-sm gap-4">
              <div className="bg-gray-a4 h-16 w-16 shrink-0 rounded-lg" />
              <div>
                <h3 className="text-sm font-semibold">Horizontal Card</h3>
                <p className="text-gray-a11 text-sm">
                  Content flows left to right.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </Section>

      {/* Selected */}
      <Section title="Selected">
        <div className="flex gap-4">
          <Card className="max-w-xs flex-1" selected>
            <h3 className="text-sm font-semibold">Selected</h3>
            <p className="text-gray-a11 text-sm">
              This card is in a selected state.
            </p>
          </Card>
          <Card className="max-w-xs flex-1">
            <h3 className="text-sm font-semibold">Unselected</h3>
            <p className="text-gray-a11 text-sm">This card is not selected.</p>
          </Card>
          <SelectableCard />
        </div>
      </Section>

      {/* Disabled */}
      <Section title="Disabled">
        <div className="flex gap-4">
          <Card className="max-w-xs flex-1">
            <h3 className="text-sm font-semibold">Enabled</h3>
            <p className="text-gray-a11 text-sm">Normal interactive card.</p>
          </Card>
          <Card className="max-w-xs flex-1" disabled>
            <h3 className="text-sm font-semibold">Disabled</h3>
            <p className="text-gray-a11 text-sm">
              Disabled card — reduced opacity, no pointer events.
            </p>
          </Card>
        </div>
      </Section>
    </>
  );
}
