import { Spinner } from "@/components/ui/spinner/spinner.tsx";

import { Section } from "../section.tsx";

// ── Page ───────────────────────────────────────────────────────────────────

export default function SpinnerPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <div>
        <h1 className="text-2xl font-semibold">Spinner</h1>
        <p className="text-gray-a11 mt-1 text-sm">
          Animated loading indicator using CSS masking and conic gradients,
          ported from Fluent UI.
        </p>
      </div>

      {/* ── Spinner: primary ── */}
      <Section title="Primary (all sizes)">
        <Spinner size="3xs" />
        <Spinner size="2xs" />
        <Spinner size="xs" />
        <Spinner size="sm" />
        <Spinner size="md" />
        <Spinner size="lg" />
        <Spinner size="xl" />
        <Spinner size="2xl" />
      </Section>

      {/* ── Spinner: inverted ── */}
      <Section title="Inverted (on accent surface)">
        <span className="bg-accent-9 flex items-center gap-3 rounded-md px-4 py-2">
          <Spinner size="3xs" appearance="inverted" />
          <Spinner size="2xs" appearance="inverted" />
          <Spinner size="xs" appearance="inverted" />
          <Spinner size="sm" appearance="inverted" />
          <Spinner size="md" appearance="inverted" />
          <Spinner size="lg" appearance="inverted" />
          <Spinner size="xl" appearance="inverted" />
          <Spinner size="2xl" appearance="inverted" />
        </span>
      </Section>

      {/* ── Size reference ── */}
      <div className="bg-gray-a2 border-gray-a6 rounded-lg border p-6">
        <h2 className="mb-3 text-sm font-medium">Size Reference</h2>
        <ul className="text-gray-a11 space-y-1 text-xs">
          <li>
            <code className="text-gray-12">3xs</code> — 16px (w-4)
          </li>
          <li>
            <code className="text-gray-12">2xs</code> — 20px (w-5)
          </li>
          <li>
            <code className="text-gray-12">xs</code> — 24px (w-6)
          </li>
          <li>
            <code className="text-gray-12">sm</code> — 28px (w-7)
          </li>
          <li>
            <code className="text-gray-12">md</code> — 32px (w-8)
          </li>
          <li>
            <code className="text-gray-12">lg</code> — 36px (w-9)
          </li>
          <li>
            <code className="text-gray-12">xl</code> — 40px (w-10)
          </li>
          <li>
            <code className="text-gray-12">2xl</code> — 44px (w-11)
          </li>
        </ul>
      </div>
    </div>
  );
}
