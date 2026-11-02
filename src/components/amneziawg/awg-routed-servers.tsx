"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { AwgRouteSnapshot, AwgRoutedServerRow } from "@/lib/awg/route-plan";
import { getServerPath } from "@/lib/server-path";
import {
  getAwgRoutesAction,
  removeAwgOrphanAction,
  removeAwgServerAction,
} from "@/server/actions/awg";

const POLL_MS = 20_000;

export function AwgRoutedServers({ initial }: { initial: AwgRouteSnapshot }) {
  const t = useTranslations("awg");
  const tc = useTranslations("common");
  const [snapshot, setSnapshot] = useState(initial);
  const [pending, setPending] = useState<AwgRoutedServerRow | null>(null);
  const [orphan, setOrphan] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      void getAwgRoutesAction().then(setSnapshot).catch(() => undefined);
    }, POLL_MS);
    return () => clearInterval(timer);
  }, []);

  async function refresh() {
    setSnapshot(await getAwgRoutesAction());
  }

  async function onRemove(server: AwgRoutedServerRow) {
    setBusy(true);
    setError(null);
    setNotice(null);
    const result = await removeAwgServerAction(server.id);
    setBusy(false);
    setPending(null);
    if (!result.success) {
      setError(result.error);
      return;
    }
    if (result.routeKept) setNotice(t("routes.routeKept"));
    await refresh();
  }

  async function onRemoveOrphan(ip: string) {
    setBusy(true);
    setError(null);
    setNotice(null);
    const result = await removeAwgOrphanAction(ip);
    setBusy(false);
    setOrphan(null);
    if (!result.success) {
      setError(result.error);
      return;
    }
    await refresh();
  }

  const siblings =
    pending?.sameHost.filter((server) => server.id !== pending.id).map((server) => server.name) ??
    [];
  const empty = snapshot.servers.length === 0 && snapshot.orphans.length === 0;
  const showState =
    snapshot.availability === "ready" || snapshot.availability === "tunnel-down";

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-medium">{t("routes.title")}</h3>
        <p className="text-sm text-muted-foreground">{t("routes.description")}</p>
      </div>

      {snapshot.availability === "tunnel-down" ? (
        <p className="text-sm text-muted-foreground">{t("routes.tunnelDown")}</p>
      ) : null}
      {snapshot.availability === "other-instance" ? (
        <p className="text-sm text-destructive">{t("routes.otherInstance")}</p>
      ) : null}
      {snapshot.availability === "helper-error" ? (
        <p className="text-sm text-destructive">{t("routes.helperError")}</p>
      ) : null}
      {notice ? <p className="text-sm text-muted-foreground">{notice}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {empty ? <p className="text-sm text-muted-foreground">{t("routes.empty")}</p> : null}

      {empty ? null : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-2 pr-3 font-medium">{t("routes.name")}</th>
                <th className="py-2 pr-3 font-medium">{t("routes.host")}</th>
                <th className="py-2 pr-3 font-medium">{t("routes.port")}</th>
                <th className="py-2 pr-3 font-medium">{t("routes.ip")}</th>
                <th className="py-2 pr-3 font-medium">{t("routes.installed")}</th>
                <th className="py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {snapshot.servers.map((server) => (
                <tr key={server.id} className="border-b last:border-0">
                  <td className="py-2 pr-3">
                    <Link href={getServerPath(server.host)} className="font-medium hover:underline">
                      {server.name}
                    </Link>
                  </td>
                  <td className="py-2 pr-3 font-mono">{server.host}</td>
                  <td className="py-2 pr-3 font-mono">{server.port}</td>
                  <td className="py-2 pr-3 font-mono">{server.ip ?? tc("dash")}</td>
                  <td className="py-2 pr-3">
                    {showState
                      ? server.installed
                        ? t("routes.installed")
                        : t("routes.notInstalled")
                      : tc("dash")}
                  </td>
                  <td className="py-2 text-right">
                    {snapshot.canRemove ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={busy}
                        onClick={() => setPending(server)}
                      >
                        {busy ? t("routes.working") : t("routes.remove")}
                      </Button>
                    ) : null}
                  </td>
                </tr>
              ))}
              {snapshot.orphans.map((route) => (
                <tr key={route.ip} className="border-b last:border-0">
                  <td className="py-2 pr-3">{t("routes.orphanTitle")}</td>
                  <td className="py-2 pr-3">{tc("dash")}</td>
                  <td className="py-2 pr-3">{tc("dash")}</td>
                  <td className="py-2 pr-3 font-mono">{route.ip}</td>
                  <td className="py-2 pr-3">{t("routes.installed")}</td>
                  <td className="py-2 text-right">
                    {snapshot.canRemove ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={busy}
                        onClick={() => setOrphan(route.ip)}
                      >
                        {t("routes.orphanRemove")}
                      </Button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AlertDialog open={pending !== null} onOpenChange={(open) => !open && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("routes.confirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">
                {t("routes.confirmBody", { name: pending?.name ?? "", host: pending?.host ?? "" })}
              </span>
              {siblings.length > 0 ? (
                <span className="block">{t("routes.confirmSiblings", { names: siblings.join(", ") })}</span>
              ) : null}
              {pending && pending.sharesIpWith.length > 0 ? (
                <span className="block">
                  {t("routes.confirmShared", {
                    names: pending.sharesIpWith.map((server) => server.name).join(", "),
                  })}
                </span>
              ) : null}
              <span className="block">{t("routes.confirmDirect")}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>{tc("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy || !pending}
              onClick={(event) => {
                event.preventDefault();
                if (pending) void onRemove(pending);
              }}
            >
              {busy ? t("routes.working") : t("routes.remove")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={orphan !== null} onOpenChange={(open) => !open && setOrphan(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("routes.orphanConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("routes.orphanConfirmBody", { ip: orphan ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>{tc("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy || !orphan}
              onClick={(event) => {
                event.preventDefault();
                if (orphan) void onRemoveOrphan(orphan);
              }}
            >
              {busy ? t("routes.working") : t("routes.orphanRemove")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
