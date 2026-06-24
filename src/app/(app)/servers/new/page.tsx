import { getTranslations } from "next-intl/server";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ServerForm } from "@/components/servers/server-form";
import { listIdentitiesAction } from "@/server/actions/identities";

export default async function NewServerPage() {
  const t = await getTranslations("servers.new");
  const identities = await listIdentitiesAction();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">{t("title")}</h2>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t("detailsTitle")}</CardTitle>
          <CardDescription>{t("detailsDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <ServerForm mode="create" identities={identities} />
        </CardContent>
      </Card>
    </div>
  );
}
