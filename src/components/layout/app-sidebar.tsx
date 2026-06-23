"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth-client";
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
  const t = useTranslations();

  async function handleLogout() {
    await signOut();
    window.location.href = "/login";
  }

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r bg-card">
      <div className="border-b p-4">
        <h1 className="text-lg font-semibold">{t("app.title")}</h1>
        <p className="text-xs text-muted-foreground">{t("app.subtitle")}</p>
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
                "mb-1 block rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent",
                isServerPathActive(pathname, server.host) && "bg-accent font-medium",
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
        <Button variant="outline" className="w-full" onClick={handleLogout}>
          {t("sidebar.logout")}
        </Button>
      </div>
    </aside>
  );
}
