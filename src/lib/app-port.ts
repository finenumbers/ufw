/** Default HTTP port for the Next.js app (local dev and Docker). */
export const DEFAULT_APP_PORT = 8088;

export const DEFAULT_APP_HOST = "localhost";

export function getDefaultAppUrl(): string {
  return `http://${DEFAULT_APP_HOST}:${DEFAULT_APP_PORT}`;
}
