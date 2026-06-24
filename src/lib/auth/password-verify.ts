import { verifyPassword } from "better-auth/crypto";

import { db } from "@/lib/db";

export async function verifyUserPassword(
  userId: string,
  password: string,
): Promise<boolean> {
  const account = await db.account.findFirst({
    where: {
      userId,
      providerId: "credential",
    },
    select: { password: true },
  });

  if (!account?.password) {
    return false;
  }

  return verifyPassword({
    password,
    hash: account.password,
  });
}
