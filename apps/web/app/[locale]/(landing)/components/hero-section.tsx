import Link from "next/link";
import { JSX } from "react";

export interface HeroSectionProps {
  eyebrowLabel: string;
  headline: string;
  subheadline: string;
  ctaLabel: string;
  signinHref: string;
}

export function HeroSection({ eyebrowLabel, headline, subheadline, ctaLabel, signinHref }: HeroSectionProps): JSX.Element {
  return (
    <section
      aria-labelledby="hero-heading"
      className="relative min-h-[calc(100vh-64px)] flex items-center py-16 sm:py-24 overflow-hidden"
    >
      {/* Background: radial accent glow + subtle dot grid */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute -top-32 -left-32 w-[700px] h-[700px] rounded-full bg-radial from-accent-a4 to-transparent blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-radial from-accent-a3 to-transparent blur-[100px]" />
        {/* Dot-grid overlay */}
        <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(circle,var(--gray-11)_1px,transparent_1px)] bg-size-[28px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col items-center text-center lg:grid lg:grid-cols-2 lg:gap-16 lg:items-center lg:text-left">
          {/* Text content */}
          <div className="flex flex-col items-center lg:items-start gap-7">
            {/* Eyebrow badge */}
            <span className="inline-flex items-center gap-2 rounded-full border border-accent-a6 bg-accent-a3 px-4 py-1.5 text-xs font-semibold text-accent-11 tracking-wide uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-9 animate-pulse" />
              {eyebrowLabel}
            </span>

            <h1
              id="hero-heading"
              className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-12"
            >
              {headline}
            </h1>

            <p className="text-lg sm:text-xl text-gray-11 max-w-xl leading-relaxed">
              {subheadline}
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <Link
                href={signinHref}
                className="inline-flex items-center justify-center rounded-lg px-7 py-3 bg-accent-9 hover:bg-accent-10 text-white text-sm font-semibold shadow-lg shadow-accent-a6 transition-all hover:shadow-accent-a8 hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-8 focus-visible:ring-offset-2"
              >
                {ctaLabel}
              </Link>
            </div>
          </div>

          {/* Screenshot placeholder */}
          <div className="mt-14 lg:mt-0 w-full">
            <div className="relative">
              <div
                aria-hidden="true"
                className="absolute -inset-4 rounded-2xl bg-radial from-accent-a4 to-transparent blur-2xl"
              />
              <div
                aria-hidden="true"
                className="relative w-full aspect-4/3 rounded-2xl border border-accent-a6 bg-gray-2 overflow-hidden shadow-2xl flex flex-col"
              >
                {/* Sticky top bar: workspace switcher + search + notifications */}
                <div className="flex items-center h-9 bg-gray-3 border-b border-gray-6 shrink-0">
                  {/* Workspace switcher — same width as sidebar (w-1/4) */}
                  <div className="w-1/4 flex items-center gap-1.5 px-2 shrink-0 border-r border-gray-6 h-full">
                    <div className="w-4 h-4 rounded bg-accent-a6 shrink-0" />
                    <div className="h-2 bg-gray-5 rounded flex-1" />
                    <div className="w-2 h-2 rounded-sm bg-gray-5 shrink-0" />
                  </div>
                  {/* Search + notifications — fills remaining space */}
                  <div className="flex items-center gap-2 flex-1 px-3">
                    <div className="flex-1 h-5 bg-gray-4 rounded-full" />
                    <div className="w-4 h-4 rounded bg-gray-5 shrink-0" />
                  </div>
                </div>

                {/* Body: sidebar + channel pane */}
                <div className="flex flex-1 min-h-0">
                  {/* Sidebar — channel list + user avatar pinned at bottom */}
                  <div className="w-1/4 bg-gray-3 border-r border-gray-6 flex flex-col p-2 shrink-0">
                    {/* Channel list */}
                    <div className="flex flex-col gap-2 flex-1">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-sm bg-gray-4 shrink-0" />
                          <div
                            className="h-2 bg-gray-4 rounded"
                            style={{ width: `${50 + i * 10}%` }}
                          />
                        </div>
                      ))}
                    </div>
                    {/* User avatar pinned to bottom */}
                    <div className="flex items-center gap-1.5 pt-2 border-t border-gray-6 mt-2">
                      <div className="w-5 h-5 rounded-full bg-accent-a5 shrink-0" />
                      <div className="h-2 bg-gray-4 rounded w-2/3" />
                    </div>
                  </div>

                  {/* Channel details pane */}
                  <div className="flex flex-col flex-1 min-w-0">
                    {/* Channel header — name, type badge, member count */}
                    <div className="flex items-center gap-2 px-3 h-9 border-b border-gray-6 shrink-0">
                      <div className="w-2 h-2 rounded-sm bg-gray-5" />
                      <div className="h-2 bg-gray-5 rounded w-1/4" />
                      <div className="h-2 bg-accent-a4 rounded w-8" />
                      <div className="ml-auto flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-gray-4" />
                        <div className="h-2 bg-gray-4 rounded w-4" />
                      </div>
                    </div>

                    {/* Message list */}
                    <div className="flex-1 p-3 space-y-3 overflow-hidden">
                      {[
                        { w: "w-1/3", mw: "w-2/3", accent: true },
                        { w: "w-1/4", mw: "w-1/2", accent: false },
                        { w: "w-2/5", mw: "w-3/4", accent: false },
                        { w: "w-1/3", mw: "w-3/5", accent: false },
                      ].map((row, i) => (
                        <div key={i} className="flex gap-2 items-start">
                          <div
                            className={`w-5 h-5 rounded-full shrink-0 ${row.accent ? "bg-accent-a6" : "bg-gray-4"}`}
                          />
                          <div className="flex-1 space-y-1">
                            <div
                              className={`h-2 rounded ${row.w} ${row.accent ? "bg-accent-a5" : "bg-gray-5"}`}
                            />
                            <div className={`h-2 rounded ${row.mw} bg-gray-3`} />
                            {i % 2 === 0 && (
                              <div className="h-2 bg-gray-3 rounded w-1/2" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Message input footer */}
                    <div className="flex items-center gap-2 px-3 py-2 border-t border-gray-6 shrink-0">
                      <div className="flex-1 h-6 bg-gray-3 rounded-md border border-gray-6" />
                      <div className="w-5 h-5 rounded bg-accent-a4" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
