import { NextResponse } from "next/server";

import { requireApiSession } from "@/lib/api-auth";
import { getAwgPublicStatus } from "@/server/services/awg.service";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiSession();
  if (auth instanceof NextResponse) {
    return auth;
  }
  return NextResponse.json(await getAwgPublicStatus());
}
