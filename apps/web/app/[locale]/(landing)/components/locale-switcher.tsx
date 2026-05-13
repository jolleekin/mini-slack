"use client";

import { useRouter } from "next/navigation";

import type { Locale } from "@/lib/i18n/landing/index.ts";

interface LocaleSwitcherProps {
  currentLocale: Locale;
  supportedLocales: Locale[];
  label: string;
}

export function LocaleSwitcher({
  currentLocale,
  supportedLocales,
  label,
}: LocaleSwitcherProps) {
  const router = useRouter();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const { pathname, search, hash } = location;
    const newHref =
      pathname.replace(/\/[^/]+/, "/" + e.target.value) + search + hash;
    router.push(newHref);
  }

  return (
    <label className="text-gray-11 flex items-center gap-2 text-sm">
      {label}
      <select
        value={currentLocale}
        onChange={handleChange}
        className="border-gray-6 text-gray-12 rounded border bg-transparent px-2 py-0.5 text-sm"
        aria-label={label}
      >
        {supportedLocales.map((locale) => (
          <option key={locale} value={locale}>
            {locale.toUpperCase()}
          </option>
        ))}
      </select>
    </label>
  );
}
