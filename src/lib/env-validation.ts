import { isProductionRuntime } from "@/lib/env-runtime";

const MIN_AUTH_SECRET_LENGTH = 32;

export function validateProductionEnv(): void {
  if (!isProductionRuntime()) {
    return;
  }

  if (!process.env.BETTER_AUTH_SECRET) {
    throw new Error(
      "BETTER_AUTH_SECRET is required in production. Generate with: openssl rand -base64 32",
    );
  }

  if (process.env.BETTER_AUTH_SECRET.length < MIN_AUTH_SECRET_LENGTH) {
    throw new Error(
      `BETTER_AUTH_SECRET must be at least ${MIN_AUTH_SECRET_LENGTH} characters in production.`,
    );
  }

  if (!process.env.APP_ENCRYPTION_KEY) {
    throw new Error(
      "APP_ENCRYPTION_KEY is required in production. Generate with: openssl rand -base64 32",
    );
  }

  const key = Buffer.from(process.env.APP_ENCRYPTION_KEY, "base64");
  if (key.length !== 32) {
    throw new Error("APP_ENCRYPTION_KEY must be a 32-byte base64-encoded key");
  }

  const appUrl = process.env.APP_URL?.trim() || process.env.BETTER_AUTH_URL?.trim();
  if (!appUrl) {
    throw new Error(
      "APP_URL is required in production. Set it to the public HTTPS URL exposed by your reverse proxy.",
    );
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(appUrl);
  } catch {
    throw new Error("APP_URL must be a valid absolute URL (e.g. https://ufw.example.com)");
  }

  if (parsedUrl.protocol !== "https:") {
    const host = parsedUrl.hostname.toLowerCase();
    const localDevHost = host === "localhost" || host === "127.0.0.1";
    if (!localDevHost) {
      throw new Error("APP_URL must use HTTPS in production");
    }
  }
}
