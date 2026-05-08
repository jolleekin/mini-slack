import { Button } from "@/components/ui/button.tsx";

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

export default function ButtonPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <div>
        <h1 className="text-2xl font-semibold">Button</h1>
        <p className="text-gray-a11 mt-1 text-sm">
          Interactive button component with Fluent Design variants, built on
          Radix UI Slot.
        </p>
      </div>

      {/* ── Button: appearance ── */}
      <Section title="Appearance">
        <Button>default</Button>
        <Button appearance="primary">primary</Button>
        <Button appearance="success">success</Button>
        <Button appearance="warning">warning</Button>
        <Button appearance="danger">danger</Button>
        <Button appearance="outline">outline</Button>
        <Button appearance="subtle">subtle</Button>
        <Button appearance="transparent">transparent</Button>
        <Button appearance="link">link</Button>
      </Section>

      {/* ── Button: size ── */}
      <Section title="Size">
        <Button size="sm">Small</Button>
        <Button size="default">Default</Button>
        <Button size="lg">Large</Button>
      </Section>

      {/* ── Button: shape ── */}
      <Section title="Shape (square &amp; circle)">
        <Button shape="square" size="sm">
          S
        </Button>
        <Button shape="square" size="default">
          S
        </Button>
        <Button shape="square" size="lg">
          S
        </Button>
        <Button shape="circle" size="sm">
          C
        </Button>
        <Button shape="circle" size="default">
          C
        </Button>
        <Button shape="circle" size="lg">
          C
        </Button>
      </Section>

      {/* ── Button: states ── */}
      <Section title="Loading State &amp; Size">
        <Button size="sm" isLoading>
          Small
        </Button>
        <Button isLoading>Default</Button>
        <Button size="lg" isLoading>
          Large
        </Button>
      </Section>
      <Section title="Loading State &amp; Appearance">
        <Button appearance="primary" isLoading>
          primary
        </Button>
        <Button appearance="success" isLoading>
          success
        </Button>
        <Button appearance="warning" isLoading>
          warning
        </Button>
        <Button appearance="danger" isLoading>
          danger
        </Button>
        <Button appearance="outline" isLoading>
          outline
        </Button>
        <Button appearance="subtle" isLoading>
          subtle
        </Button>
        <Button appearance="transparent" isLoading>
          transparent
        </Button>
      </Section>

      <Section title="Disabled State">
        <Button disabled>default</Button>
        <Button disabled appearance="primary">
          primary
        </Button>
        <Button disabled appearance="success">
          success
        </Button>
        <Button disabled appearance="warning">
          warning
        </Button>
        <Button disabled appearance="danger">
          danger
        </Button>
        <Button disabled appearance="outline">
          outline
        </Button>
        <Button disabled appearance="subtle">
          subtle
        </Button>
        <Button disabled appearance="transparent">
          transparent
        </Button>
        <Button disabled appearance="link">
          link
        </Button>
      </Section>

      {/* ── Button: asChild ── */}
      <Section title="asChild (renders as &lt;a&gt;)">
        <Button asChild appearance="link">
          <a href="#">Link via asChild</a>
        </Button>
      </Section>
    </div>
  );
}
