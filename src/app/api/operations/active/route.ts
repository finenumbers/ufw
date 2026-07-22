import { NextResponse } from "next/server";

import { requireApiSession } from "@/lib/api-auth";
import { getBannerOperationLog } from "@/server/services/operation-log.service";
import { parseOperationMetadata } from "@/types/operation";

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

  const log = await getBannerOperationLog(serverId, authResult.session.user.id);
  if (!log) {
    return NextResponse.json(null);
  }

  return NextResponse.json({
    id: log.id,
    type: log.type,
    status: log.status,
    message: log.message,
    metadata: parseOperationMetadata(log.metadata),
    createdAt: log.createdAt.toISOString(),
  });
}
