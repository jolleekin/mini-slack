import { createTranslator } from "@mini-slack/i18n";
import { RPCHandler } from "@orpc/server/fetch";
import { NextRequest } from "next/server";

import { WORKSPACE_ID_HEADER } from "@/lib/constants.ts";
import { ServiceContext } from "@/lib/context.ts";
import { Db, db } from "@/lib/db.ts";
import { extractLocale, translationsLoaders } from "@/lib/errors/i18n.ts";
import { auth } from "@/lib/identity/auth.ts";
import { router } from "@/lib/rpc/routers";

const rpcHandler = new RPCHandler(router);

async function handle(req: NextRequest): Promise<Response> {
  const locale = extractLocale(req.headers);
  const translations = await translationsLoaders[locale]();
  const t = createTranslator(translations);

  const session = await auth.api.getSession({ headers: req.headers });

  if (!session) {
    return new Response(JSON.stringify({ message: t("unauthenticated") }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const context: ServiceContext<Db> = {
    db,
    actor: { ...session.user, type: "user" },
    workspaceId: req.headers.get(WORKSPACE_ID_HEADER),
    locale,
    t,
  };

  const result = await rpcHandler.handle(req, { context, prefix: "/api/rpc" });

  if (!result.matched) {
    return new Response(JSON.stringify({ message: t("not_found") }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  return result.response;
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
