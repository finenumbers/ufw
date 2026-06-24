import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { IdentityDeleteDialog } from "@/components/identities/identity-delete-dialog";
import { IdentityForm } from "@/components/identities/identity-form";
import { IdentityLinkedServers } from "@/components/identities/identity-linked-servers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getIdentityByIdAction } from "@/server/actions/identities";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditIdentityPage({ params }: PageProps) {
  const t = await getTranslations("identities.edit");
  const tDelete = await getTranslations("identities.delete");
  const { id } = await params;
  const identity = await getIdentityByIdAction(id);

  if (!identity) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">{t("title")}</h2>
        <p className="text-sm text-muted-foreground">{identity.name}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t("detailsTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <IdentityForm
            mode="edit"
            identityId={identity.id}
            serverCount={identity.serverCount}
            defaultValues={{
              name: identity.name,
              username: identity.username,
              authMethod: identity.authMethod,
            }}
          />
          <IdentityLinkedServers linkedServers={identity.linkedServers} />
        </CardContent>
      </Card>
      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle>{tDelete("dangerTitle")}</CardTitle>
          <CardDescription>{tDelete("dangerDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <IdentityDeleteDialog
            identityId={identity.id}
            identityName={identity.name}
            serverCount={identity.serverCount}
            linkedServers={identity.linkedServers}
          />
        </CardContent>
      </Card>
    </div>
  );
}
