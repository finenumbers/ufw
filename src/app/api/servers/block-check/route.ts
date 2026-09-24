import { NextResponse } from "next/server";

import { requireApiSession } from "@/lib/api-auth";
import { ensureBlockCheckRefresh, getBlockCheckSnapshot } from "@/server/services/block-check.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const authResult = await requireApiSession();
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  ensureBlockCheckRefresh();

  return NextResponse.json(getBlockCheckSnapshot(), {
    headers: { "Cache-Control": "private, no-store" },
  });
}
