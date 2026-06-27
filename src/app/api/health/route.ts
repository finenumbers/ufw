import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { getAppVersion, getBuildRevision } from "@/lib/app-version";
import { isProductionRuntime } from "@/lib/env-runtime";
import { createChildLogger } from "@/lib/logger";

const log = createChildLogger("health");

export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;

    const body: Record<string, string> = {
      status: "ok",
      db: "ok",
      version: getAppVersion(),
    };

    if (!isProductionRuntime()) {
      const revision = getBuildRevision();
      if (revision) {
        body.revision = revision;
      }
    }

    return NextResponse.json(body);
  } catch (error) {
    log.error({ err: error }, "Health check failed");
    return NextResponse.json({ status: "error", db: "error" }, { status: 503 });
  }
}
