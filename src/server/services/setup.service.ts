import { db } from "@/lib/db";

const SETUP_ADVISORY_LOCK_KEY = 89483294731;

export async function isSetupRequired(): Promise<boolean> {
  const count = await db.user.count();
  return count === 0;
}

export async function getUserCount(): Promise<number> {
  return db.user.count();
}

export async function acquireSetupLock(): Promise<boolean> {
  const result = await db.$queryRaw<Array<{ acquired: boolean }>>`
    SELECT pg_try_advisory_lock(${SETUP_ADVISORY_LOCK_KEY}) AS acquired
  `;
  return Boolean(result[0]?.acquired);
}

export async function releaseSetupLock(): Promise<void> {
  await db.$executeRaw`SELECT pg_advisory_unlock(${SETUP_ADVISORY_LOCK_KEY})`;
}

export async function assertSetupAvailable(): Promise<void> {
  const userCount = await db.user.count();
  if (userCount > 0) {
    throw new Error("Setup already completed");
  }
}
