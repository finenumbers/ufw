import { NextResponse } from "next/server";

import { requireApiSession } from "@/lib/api-auth";
import { getLatestOperationLog } from "@/server/services/operation-log.service";

export async function GET(request: Request) {
  const authResult = await requireApiSession();
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { searchParams } = new URL(request.url);
  const serverId = searchParams.get("serverId");

  if (!serverId) {
    return NextResponse.json(null);
  }

  const log = await getLatestOperationLog(serverId);
  if (!log) {
    return NextResponse.json(null);
  }

  return NextResponse.json({
    type: log.type,
    status: log.status,
    message: log.message,
  });
}
