import { getTranslations } from "next-intl/server";

import { IdentityForm } from "@/components/identities/identity-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function NewIdentityPage() {
  const t = await getTranslations("identities.new");

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
          <IdentityForm mode="create" />
        </CardContent>
      </Card>
    </div>
  );
}
