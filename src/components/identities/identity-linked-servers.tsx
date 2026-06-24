"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { getServerPath } from "@/lib/server-path";

type IdentityLinkedServersProps = {
  linkedServers: Array<{ id: string; name: string; host: string; port: number }>;
};

function formatServerAddress(host: string, port: number): string {
  return port === 22 ? host : `${host}:${port}`;
}

export function IdentityLinkedServers({ linkedServers }: IdentityLinkedServersProps) {
  const t = useTranslations("identities.edit");
  const tc = useTranslations("common");

  return (
    <div className="space-y-3 border-t pt-6">
      <div>
        <h3 className="text-sm font-medium">{t("linkedServersTitle")}</h3>
        <p className="text-sm text-muted-foreground">{t("linkedServersDescription")}</p>
      </div>
      {linkedServers.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("linkedServersEmpty")}</p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {linkedServers.map((server) => (
            <li key={server.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <div>
                <p className="font-medium">{server.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatServerAddress(server.host, server.port)}
                </p>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href={getServerPath(server.host)}>{tc("open")}</Link>
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
