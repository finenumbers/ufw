import { createHmac, timingSafeEqual } from "crypto";

import { getAuthSecret } from "@/lib/env";

const EXPORT_TOKEN_TTL_MS = 60_000;

function signPayload(payload: string): string {
  return createHmac("sha256", getAuthSecret()).update(payload).digest("hex");
}

export function createExportToken(userId: string): string {
  const expiresAt = Date.now() + EXPORT_TOKEN_TTL_MS;
  const payload = `${userId}:${expiresAt}`;
  const signature = signPayload(payload);
  return Buffer.from(`${payload}:${signature}`).toString("base64url");
}

export function verifyExportToken(token: string, userId: string): boolean {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const lastColon = decoded.lastIndexOf(":");
    if (lastColon <= 0) {
      return false;
    }

    const payload = decoded.slice(0, lastColon);
    const signature = decoded.slice(lastColon + 1);
    const expected = signPayload(payload);

    const signatureBuffer = Buffer.from(signature, "utf8");
    const expectedBuffer = Buffer.from(expected, "utf8");
    if (
      signatureBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(signatureBuffer, expectedBuffer)
    ) {
      return false;
    }

    const [tokenUserId, expiresAtRaw] = payload.split(":");
    if (tokenUserId !== userId) {
      return false;
    }

    const expiresAt = Number(expiresAtRaw);
    if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}
