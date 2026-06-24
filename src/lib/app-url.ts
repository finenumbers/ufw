const DEFAULT_APP_URL = "http://localhost:3000";

export function getPublicAppUrl(): string {
  const raw =
    process.env.APP_URL?.trim() ||
    process.env.BETTER_AUTH_URL?.trim() ||
    DEFAULT_APP_URL;

  try {
    const url = new URL(raw);
    return url.origin;
  } catch {
    return DEFAULT_APP_URL;
  }
}
