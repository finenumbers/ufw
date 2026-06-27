import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { getAppVersion, getBuildRevision } from "@/lib/app-version";
import { createChildLogger } from "@/lib/logger";

const log = createChildLogger("health");

export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: "ok",
      db: "ok",
      version: getAppVersion(),
      revision: getBuildRevision(),
    });
  } catch (error) {
    log.error({ err: error }, "Health check failed");
    return NextResponse.json({ status: "error", db: "error" }, { status: 503 });
  }
}
