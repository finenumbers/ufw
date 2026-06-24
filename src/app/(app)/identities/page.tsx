import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { IdentitiesList } from "@/components/identities/identities-list";
import { Button } from "@/components/ui/button";
import { listIdentitiesAction } from "@/server/actions/identities";

export const dynamic = "force-dynamic";

export default async function IdentitiesPage() {
  const t = await getTranslations("identities");
  const identities = await listIdentitiesAction();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">{t("title")}</h2>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
        <Button asChild>
          <Link href="/identities/new">{t("addIdentity")}</Link>
        </Button>
      </div>

      <IdentitiesList identities={identities} />
    </div>
  );
}
