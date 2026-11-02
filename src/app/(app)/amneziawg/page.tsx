import { getTranslations } from "next-intl/server";

import { AwgRoutedServers } from "@/components/amneziawg/awg-routed-servers";
import { AwgSettings } from "@/components/amneziawg/awg-settings";
import { Card, CardContent } from "@/components/ui/card";
import { listAwgRoutes } from "@/server/services/awg-routes.service";
import { getAwgPublicStatus } from "@/server/services/awg.service";

export const dynamic = "force-dynamic";

export default async function AmneziaWgPage() {
  const t = await getTranslations("awg");
  const [status, routes] = await Promise.all([getAwgPublicStatus(), listAwgRoutes()]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">{t("title")}</h2>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </div>
      <Card>
        <CardContent className="pt-6">
          <AwgRoutedServers initial={routes} />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <AwgSettings initial={status} />
        </CardContent>
      </Card>
    </div>
  );
}
