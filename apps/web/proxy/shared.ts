import type { NextRequest } from "next/server";

import { LOCALE_COOKIE_NAME } from "@/lib/constants.ts";
import { DEFAULT_LOCALE, isValidLocale } from "@/lib/i18n/landing/index.ts";
import type { Locale } from "@/lib/i18n/landing/index.ts";

export { LOCALE_COOKIE_NAME };

/**
 * Detects the locale from cookies or the `Accept-Language` header.
 * 
 * Returns the detected locale or {@linkcode DEFAULT_LOCALE} as the fallback.
 */
export function detectLocale(request: NextRequest): Locale {
  const cookieLocale = request.cookies.get(LOCALE_COOKIE_NAME)?.value;
  if (cookieLocale && isValidLocale(cookieLocale)) return cookieLocale;

  const acceptLang =
    request.headers.get("Accept-Language")?.split(",")[0]?.split("-")[0] ?? "";
  if (isValidLocale(acceptLang)) return acceptLang;

  return DEFAULT_LOCALE;
}

export function isSafeRedirectPath(path: string): boolean {
  return path.startsWith("/") && !path.startsWith("//") && !path.includes(":");
}

export const LOCALE_COOKIE_OPTIONS = {
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
  sameSite: "lax",
  httpOnly: false,
} as const;
