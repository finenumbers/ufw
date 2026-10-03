import { Client } from "pg";

const LOCK_KEY = "ufw-amneziawg";

type AwgLockState = {
  client: Client | null;
  holdsLock: boolean;
  pending: Promise<boolean> | null;
};

const processState = globalThis as typeof globalThis & {
  __ufwAwgLock?: AwgLockState;
};

function state(): AwgLockState {
  if (!processState.__ufwAwgLock) {
    processState.__ufwAwgLock = { client: null, holdsLock: false, pending: null };
  }
  return processState.__ufwAwgLock;
}

export function awgLeaderHeld(): boolean {
  const current = state();
  return current.holdsLock && current.client !== null;
}

/** One app process owns the tunnel. The lock lives on a dedicated Postgres session. */
export async function ensureAwgLeaderLock(): Promise<boolean> {
  const current = state();
  if (current.holdsLock && current.client) {
    return true;
  }
  if (!process.env.DATABASE_URL) {
    return false;
  }
  if (!current.pending) {
    current.pending = acquire().finally(() => {
      state().pending = null;
    });
  }
  return current.pending;
}

async function acquire(): Promise<boolean> {
  const current = state();
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

  current.holdsLock = true;
  current.client = next;
  next.on("error", () => {
    const latest = state();
    if (latest.client === next) {
      latest.holdsLock = false;
      latest.client = null;
    }
  });
  return true;
}
