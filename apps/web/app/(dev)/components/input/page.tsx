import { Input } from "@/components/ui/input/input.tsx";
import { Label } from "@/components/ui/label/label.tsx";

import { PageHeader, Section } from "../section.tsx";

import { FormValidationExample } from "./form-validation-example.tsx";

export default function InputPage() {
  return (
    <>
      <PageHeader
        title="Input"
        description="Text input component with Fluent Design styling and error state support."
      />

      <Section title="Normal State" layout="stack">
        <div className="max-w-sm space-y-1">
          <Label htmlFor="normal">Email</Label>
          <Input id="normal" type="email" placeholder="you@example.com" />
        </div>
      </Section>

      <Section title="Error State" layout="stack">
        <div className="max-w-sm space-y-1">
          <Label htmlFor="error">Email</Label>
          <Input
            id="error"
            type="email"
            placeholder="you@example.com"
            hasError
          />
          <p className="text-danger-11 text-xs">Invalid email address</p>
        </div>
      </Section>

      <Section title="Disabled State" layout="stack">
        <div className="max-w-sm space-y-1">
          <Label htmlFor="disabled">Email</Label>
          <Input
            id="disabled"
            type="email"
            placeholder="you@example.com"
            disabled
          />
        </div>
      </Section>

      <Section title="Form Validation (data-invalid)" layout="stack">
        <p className="text-gray-a11 text-xs">
          Demonstrates the <code>data-invalid</code> attribute applied to the
          Input, which triggers danger border styling automatically. Submit the
          form with an empty or invalid email to see the error state.
        </p>
        <FormValidationExample />
      </Section>

      <Section title="Before / After Adornments" layout="stack">
        <div className="max-w-sm space-y-1">
          <Label htmlFor="url">Website</Label>
          <Input
            id="url"
            type="text"
            placeholder="example.com"
            before="https://"
          />
        </div>
        <div className="max-w-sm space-y-1">
          <Label htmlFor="price">Price</Label>
          <Input
            id="price"
            type="number"
            placeholder="0.00"
            before="$"
            after="USD"
          />
        </div>
        <div className="max-w-sm space-y-1">
          <Label htmlFor="search">Search</Label>
          <Input
            id="search"
            type="search"
            placeholder="Search…"
            after={
              <kbd className="text-gray-a9 border-gray-a6 rounded border px-1 py-0.5 text-xs">
                ⌘K
              </kbd>
            }
          />
        </div>
      </Section>
    </>
  );
}
