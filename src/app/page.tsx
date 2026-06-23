import { redirect } from "next/navigation";

import { getSession } from "@/lib/session";
import { isSetupRequired } from "@/server/services/setup.service";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const setupRequired = await isSetupRequired();
  if (setupRequired) {
    redirect("/setup");
  }

  const session = await getSession();
  if (!session?.user) {
    redirect("/login");
  }

  redirect("/servers");
}
