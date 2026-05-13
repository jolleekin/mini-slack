import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { DEFAULT_LOCALE, isValidLocale } from "@/lib/i18n/landing/index.ts";

import {
  LOCALE_COOKIE_NAME,
  LOCALE_COOKIE_OPTIONS,
  detectLocale,
} from "./shared.ts";

export function landingProxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
console.log(pathname);
  if (pathname === "/") {
    const locale = detectLocale(request);
    request.nextUrl.pathname = `/${locale}`;
    const response = NextResponse.redirect(request.nextUrl);
    response.cookies.set(LOCALE_COOKIE_NAME, locale, LOCALE_COOKIE_OPTIONS);
    return response;
  }

  // pathname always starts with "/", so split("/") gives ["", firstSegment, ...]
  // segments[1] is the first real path segment (e.g. "en", "fr", "signin").
  const firstSegment = pathname.split("/")[1] ?? "";
console.log(firstSegment, isValidLocale(firstSegment));
  if (!isValidLocale(firstSegment)) {
    // Unsupported or missing locale segment — prepend DEFAULT_LOCALE to the
    // full pathname so /signin → /en/signin and /de/page → /en/de/page.
    request.nextUrl.pathname = `/${DEFAULT_LOCALE}${pathname}`;
    const response = NextResponse.redirect(request.nextUrl);
    response.cookies.set(
      LOCALE_COOKIE_NAME,
      DEFAULT_LOCALE,
      LOCALE_COOKIE_OPTIONS,
    );
    return response;
  }

  const response = NextResponse.next();
  response.cookies.set(LOCALE_COOKIE_NAME, firstSegment, LOCALE_COOKIE_OPTIONS);
  return response;
}
