import { createHash } from "crypto";

const DEV_ENCRYPTION_SEED = "ufw-remote-manager-local-dev";
const DEV_AUTH_SEED = "ufw-remote-manager-local-dev";

function isProductionRuntime(): boolean {
  return (
    process.env.NODE_ENV === "production" &&
    process.env.NEXT_PHASE !== "phase-production-build"
  );
}

function decodeBase64Key(name: string, value: string): Buffer {
  const key = Buffer.from(value, "base64");
  if (key.length !== 32) {
    throw new Error(`${name} must be a 32-byte base64-encoded key`);
  }
  return key;
}

export function getAuthSecret(): string {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (secret) {
    return secret;
  }

  if (isProductionRuntime()) {
    throw new Error(
      "BETTER_AUTH_SECRET is required in production. Generate with: openssl rand -base64 32",
    );
  }

  const seed = process.env.DATABASE_URL ?? DEV_AUTH_SEED;
  return createHash("sha256").update(`auth:${seed}`).digest("base64");
}

export function getEncryptionKey(): Buffer {
  const keyBase64 = process.env.APP_ENCRYPTION_KEY;
  if (keyBase64) {
    return decodeBase64Key("APP_ENCRYPTION_KEY", keyBase64);
  }

  if (isProductionRuntime()) {
    throw new Error(
      "APP_ENCRYPTION_KEY is required in production. Generate with: openssl rand -base64 32",
    );
  }

  const seed = process.env.DATABASE_URL ?? DEV_ENCRYPTION_SEED;
  return createHash("sha256").update(seed).digest();
}

export function validateProductionEnv(): void {
  if (!isProductionRuntime()) {
    return;
  }

  getAuthSecret();
  getEncryptionKey();
}
