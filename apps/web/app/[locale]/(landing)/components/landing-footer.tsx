import { JSX } from "react";

import type { Locale } from "@/lib/i18n/landing/index.ts";

import { LocaleSwitcher } from "./locale-switcher.tsx";

interface LandingFooterProps {
  copyright: string;
  currentLocale: Locale;
  localeSwitcherLabel: string;
  supportedLocales: Locale[];
}

export function LandingFooter({
  copyright,
  currentLocale,
  localeSwitcherLabel,
  supportedLocales,
}: LandingFooterProps): JSX.Element {
  return (
    <footer className="border-gray-6 border-t py-8">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex-1">
          <LocaleSwitcher
            currentLocale={currentLocale}
            supportedLocales={supportedLocales}
            label={localeSwitcherLabel}
          />
        </div>
        <p className="text-gray-11 text-center text-sm">{copyright}</p>
        <div className="flex-1"></div>
      </div>
    </footer>
  );
}
