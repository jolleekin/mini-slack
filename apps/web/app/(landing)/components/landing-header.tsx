import Link from "next/link";
import { JSX } from "react";

export function LandingHeader(): JSX.Element {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-a4 bg-gray-1/80 backdrop-blur-md">
      <a
        href="#main-content"
        className="sr-only focus-visible:not-sr-only focus-visible:absolute focus-visible:top-4 focus-visible:left-4 focus-visible:z-50 focus-visible:rounded focus-visible:bg-gray-2 focus-visible:px-4 focus-visible:py-2 focus-visible:text-sm focus-visible:font-semibold focus-visible:text-gray-12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-8 focus-visible:ring-offset-2"
      >
        Skip to main content
      </a>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav
          aria-label="Main navigation"
          className="flex items-center justify-between h-16"
        >
          {/* Logo */}
          <span className="text-xl font-bold text-violet-11 tracking-tight">
            Mini
            <span className="text-gray-12">Slack</span>
          </span>

          {/* Sign in — styled as a small outlined button */}
          <Link
            href="/signin"
            className="inline-flex items-center justify-center rounded-lg border border-gray-6 hover:border-gray-7 bg-gray-a2 hover:bg-gray-a3 px-4 py-1.5 text-sm font-semibold text-gray-12 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-8 focus-visible:ring-offset-2"
          >
            Sign in
          </Link>
        </nav>
      </div>
    </header>
  );
}
