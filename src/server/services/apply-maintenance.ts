import { db } from "@/lib/db";

export async function sweepStaleApplySessions(maxAgeMinutes = 30): Promise<number> {
  const staleBefore = new Date(Date.now() - maxAgeMinutes * 60_000);
  const result = await db.applySession.updateMany({
    where: {
      status: "RUNNING",
      confirmedAt: { lt: staleBefore },
    },
    data: {
      status: "FAILED",
      errorMessage: "Apply session timed out",
      completedAt: new Date(),
    },
  });

  return result.count;
}
