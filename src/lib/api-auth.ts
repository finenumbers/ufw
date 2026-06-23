import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth, type Session } from "@/lib/auth";

export async function requireApiSession(): Promise<
  { session: Session } | NextResponse
> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return { session };
}
