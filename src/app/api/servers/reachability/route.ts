import { NextResponse } from "next/server";

import { requireApiSession } from "@/lib/api-auth";
import {
  ensureReachabilityRefresh,
  getReachabilitySnapshot,
} from "@/server/services/reachability.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const authResult = await requireApiSession();
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  ensureReachabilityRefresh();

  return NextResponse.json(getReachabilitySnapshot(), {
    headers: { "Cache-Control": "private, no-store" },
  });
}
