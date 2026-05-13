import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { landingProxy } from "@/proxy/landing.ts";
import { appProxy } from "@/proxy/app.ts";

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/_next") || pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/app")) {
    return appProxy(request);
  }

  return landingProxy(request);
}

export const config = {
  matcher: ["/((?!_next|api|.well-known|favicon.ico).*)"],
};
