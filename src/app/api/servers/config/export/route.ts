import { NextResponse } from "next/server";

import { requireApiSession } from "@/lib/api-auth";
import { verifyExportToken } from "@/lib/export-token";
import { sanitizeExportError } from "@/lib/errors/sanitize";
import { serializeServersConfigFile } from "@/lib/servers/config-format";
import { buildServersConfigExport } from "@/server/services/server-config.service";

export async function GET(request: Request) {
  const authResult = await requireApiSession();
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const token = new URL(request.url).searchParams.get("token");
  if (!token || !verifyExportToken(token, authResult.session.user.id)) {
    return NextResponse.json({ error: "Export confirmation required" }, { status: 403 });
  }

  try {
    const { data, filename } = await buildServersConfigExport(authResult.session.user.id);
    const body = serializeServersConfigFile(data);

    return new NextResponse(body, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json({ error: sanitizeExportError(error) }, { status: 500 });
  }
}
