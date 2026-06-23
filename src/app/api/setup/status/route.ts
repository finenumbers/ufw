import { NextResponse } from "next/server";

import { isSetupRequired } from "@/server/services/setup.service";

export async function GET() {
  try {
    const required = await isSetupRequired();
    return NextResponse.json({ setupRequired: required });
  } catch {
    return NextResponse.json({ setupRequired: true });
  }
}
