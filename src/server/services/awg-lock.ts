import { Client } from "pg";

const LOCK_KEY = "ufw-amneziawg";

let client: Client | null = null;
let holdsLock = false;
let pending: Promise<boolean> | null = null;

export function awgLeaderHeld(): boolean {
  return holdsLock && client !== null;
}

/** One app process owns the tunnel. The lock lives on a dedicated Postgres session. */
export async function ensureAwgLeaderLock(): Promise<boolean> {
  if (holdsLock) {
    return true;
  }
  if (!process.env.DATABASE_URL) {
    return false;
  }
  if (!pending) {
    pending = acquire().finally(() => {
      pending = null;
    });
  }
  return pending;
}

async function acquire(): Promise<boolean> {
  const next = new Client({ connectionString: process.env.DATABASE_URL });
  await next.connect();
  const result = await next.query<{ locked: boolean }>(
    "SELECT pg_try_advisory_lock(hashtext($1)) AS locked",
    [LOCK_KEY],
  );
  const locked = Boolean(result.rows[0]?.locked);
  if (!locked) {
    await next.end().catch(() => undefined);
    return false;
  }

  holdsLock = true;
  client = next;
  next.on("error", () => {
    holdsLock = false;
    client = null;
  });
  return true;
}
