"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth-client";
import { getDocsUrl } from "@/lib/docs-url";
import { getAppVersionLabel } from "@/lib/app-version";
import type { AppLocale } from "@/i18n/config";
import { getServerPath, isServerPathActive } from "@/lib/server-path";
import { cn } from "@/lib/utils";

type ServerItem = {
  id: string;
  name: string;
  host: string;
};

type AppSidebarProps = {
  servers: ServerItem[];
};

export function AppSidebar({ servers }: AppSidebarProps) {
  const pathname = usePathname();
  const locale = useLocale() as AppLocale;
  const t = useTranslations();

  async function handleLogout() {
    await signOut();
    window.location.href = "/login";
  }

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-60 flex-col border-r bg-card">
      <div className="border-b p-4">
        <Link href="/servers" className="inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/full_black.png"
            alt="fine numbers"
            className="h-10 w-auto"
          />
        </Link>
        <LanguageSwitcher className="mt-3" />
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pt-3">
        {servers.length === 0 ? (
          <p className="px-2 text-sm text-muted-foreground">{t("sidebar.noServers")}</p>
        ) : (
          servers.map((server) => (
            <Link
              key={server.id}
              href={getServerPath(server.host)}
              className={cn(
                "mb-1 block rounded-md px-3 py-2 text-sm transition-colors hover:bg-zinc-100",
                isServerPathActive(pathname, server.host) &&
                  "bg-zinc-200 font-medium text-foreground hover:bg-zinc-200",
              )}
            >
              <div>{server.name}</div>
              <div className="text-xs text-muted-foreground">{server.host}</div>
            </Link>
          ))
        )}
      </nav>

      <div className="space-y-2 border-t p-4">
        <Button asChild variant="ghost" className="w-full justify-start">
          <Link href="/operations">{t("sidebar.operationsHistory")}</Link>
        </Button>
        <Button asChild variant="ghost" className="w-full justify-start">
          <Link href="/identities">{t("sidebar.identities")}</Link>
        </Button>
        <Button variant="outline" className="w-full" onClick={handleLogout}>
          {t("sidebar.logout")}
        </Button>
        <div className="flex items-center justify-between gap-2 pt-2 text-xs text-muted-foreground">
          <a
            href={getDocsUrl(locale)}
            target="_blank"
            rel="noopener noreferrer"
            className="underline-offset-4 hover:underline"
          >
            {t("footer.documentation")}
          </a>
          <span className="shrink-0 font-mono tabular-nums" title={t("footer.versionTitle")}>
            {getAppVersionLabel()}
          </span>
        </div>
      </div>
    </aside>
  );
}
