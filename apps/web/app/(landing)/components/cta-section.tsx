import Link from "next/link";
import { JSX } from "react";

export function CtaSection(): JSX.Element {
  return (
    <section
      aria-labelledby="cta-heading"
      className="relative py-20 sm:py-28 overflow-hidden bg-linear-135 from-accent-9 to-accent-11"
    >
      {/* Decorative blobs */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
        {/* Dot-grid overlay */}
        <div className="absolute inset-0 opacity-[0.06] bg-[radial-gradient(circle,white_1px,transparent_1px)] bg-size-[28px_28px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-6 text-center">
          <h2
            id="cta-heading"
            className="text-3xl sm:text-4xl font-bold text-white"
          >
            Ready to bring your team together?
          </h2>
          <p className="text-white/80 text-lg max-w-xl leading-relaxed">
            Get started in seconds — no credit card required. Just sign in and
            create your first workspace.
          </p>
          <Link
            href="/signin"
            className="inline-flex items-center justify-center rounded-lg px-8 py-3.5 bg-white text-accent-11 text-sm font-semibold shadow-lg hover:bg-gray-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-accent-9"
          >
            Get started
          </Link>
        </div>
      </div>
    </section>
  );
}
