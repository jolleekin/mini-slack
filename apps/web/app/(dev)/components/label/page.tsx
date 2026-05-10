import { Label } from "@/components/ui/label/label.tsx";

import { PageHeader, Section } from "../section.tsx";

export default function LabelPage() {
  return (
    <>
      <PageHeader
        title="Label"
        description="Accessible label component for form inputs with Fluent Design styling."
      />

      <Section title="Standalone Label">
        <Label>Email Address</Label>
      </Section>

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

      <Section title="Required Indicator">
        <Label required={true}>Default asterisk</Label>
        <Label required="(required)">Custom string</Label>
        <Label required={<span>✦</span>}>Custom JSX</Label>
      </Section>

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
            className="border-gray-a7 bg-gray-a2 text-gray-12 placeholder:text-gray-a11 h-10 w-full max-w-sm cursor-not-allowed rounded-md border px-3 py-2 text-sm opacity-50"
          />
        </div>
      </Section>

      <Section title="Size Variants">
        <Label size="sm">Small</Label>
        <Label size="default">Default</Label>
        <Label size="lg">Large</Label>
      </Section>
    </>
  );
}
