"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import type { IdentityListItem } from "@/lib/validations/identity";

type IdentitiesListProps = {
  identities: IdentityListItem[];
};

export function IdentitiesList({ identities }: IdentitiesListProps) {
  const t = useTranslations("identities");
  const tf = useTranslations("identityForm");

  if (identities.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
        <Button asChild className="mt-4">
          <Link href="/identities/new">{t("addIdentity")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left">
          <tr>
            <th className="px-4 py-3 font-medium">{t("columns.name")}</th>
            <th className="px-4 py-3 font-medium">{t("columns.username")}</th>
            <th className="px-4 py-3 font-medium">{t("columns.authMethod")}</th>
            <th className="px-4 py-3 font-medium">{t("columns.servers")}</th>
            <th className="px-4 py-3 font-medium" />
          </tr>
        </thead>
        <tbody>
          {identities.map((identity) => (
            <tr key={identity.id} className="border-t">
              <td className="px-4 py-3 font-medium">{identity.name}</td>
              <td className="px-4 py-3">{identity.username}</td>
              <td className="px-4 py-3">
                {identity.authMethod === "PASSWORD"
                  ? tf("passwordAuth")
                  : identity.authMethod === "PRIVATE_KEY"
                    ? tf("privateKeyAuth")
                    : tf("privateKeyPassphraseAuth")}
              </td>
              <td className="px-4 py-3">{identity.serverCount}</td>
              <td className="px-4 py-3 text-right">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/identities/${identity.id}/edit`}>{t("editAction")}</Link>
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
