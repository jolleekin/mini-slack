import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { auth } from "@/lib/identity/auth.ts";

import { LOCALE_COOKIE_NAME, LOCALE_COOKIE_OPTIONS, detectLocale } from "./shared.ts";

export async function appProxy(request: NextRequest): Promise<NextResponse> {
  const locale = detectLocale(request);
  const hasLocaleCookie = !!request.cookies.get(LOCALE_COOKIE_NAME)?.value;
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    const { pathname, search, hash } = request.nextUrl;
    const fullPath = pathname + search + hash;
    const signinUrl = new URL(`/${locale}/signin`, request.url);
    signinUrl.searchParams.set("redirect", fullPath);
    const response = NextResponse.redirect(signinUrl);
    if (!hasLocaleCookie) {
      response.cookies.set(LOCALE_COOKIE_NAME, locale, LOCALE_COOKIE_OPTIONS);
    }
    return response;
  }

  const response = NextResponse.next();
  if (!hasLocaleCookie) {
    response.cookies.set(LOCALE_COOKIE_NAME, locale, LOCALE_COOKIE_OPTIONS);
  }
  return response;
}
