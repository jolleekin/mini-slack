import { Label } from "@/components/ui/label/label.tsx";

// ── Section wrapper ────────────────────────────────────────────────────────

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-gray-a11 text-xs font-semibold tracking-widest uppercase">
        {title}
      </h2>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </section>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function LabelPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <div>
        <h1 className="text-2xl font-semibold">Label</h1>
        <p className="text-gray-a11 mt-1 text-sm">
          Accessible label component for form inputs with Fluent Design
          styling.
        </p>
      </div>

      {/* ── Standalone Label ── */}
      <Section title="Standalone Label">
        <Label>Email Address</Label>
      </Section>

      {/* ── Label with htmlFor ── */}
      <Section title="Label with htmlFor">
        <div className="flex flex-col gap-1">
          <Label htmlFor="example-input">Username</Label>
          <input
            id="example-input"
            type="text"
            placeholder="Enter username"
            className="border-gray-a7 bg-gray-a2 text-gray-12 placeholder:text-gray-a11 h-10 w-full max-w-sm rounded-md border px-3 py-2 text-sm"
          />
        </div>
      </Section>

      {/* ── Required Indicator ── */}
      <Section title="Required Indicator">
        <Label required={true}>Default asterisk</Label>
        <Label required="(required)">Custom string</Label>
        <Label required={<span>✦</span>}>Custom JSX</Label>
      </Section>

      {/* ── Disabled State ── */}
      <Section title="Disabled State">
        <div className="flex flex-col gap-1">
          <Label htmlFor="disabled-input" disabled={true}>
            Disabled Label
          </Label>
          <input
            id="disabled-input"
            type="text"
            placeholder="Disabled input"
            disabled
            className="border-gray-a7 bg-gray-a2 text-gray-12 placeholder:text-gray-a11 h-10 w-full max-w-sm rounded-md border px-3 py-2 text-sm opacity-50 cursor-not-allowed"
          />
        </div>
      </Section>

      {/* ── Size Variants ── */}
      <Section title="Size Variants">
        <Label size="sm">Small</Label>
        <Label size="default">Default</Label>
        <Label size="lg">Large</Label>
      </Section>
    </div>
  );
}
