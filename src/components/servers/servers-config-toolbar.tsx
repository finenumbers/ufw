"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ServersConfigImportDiff } from "@/lib/servers/config-format";
import {
  confirmConfigExportAction,
  importServersConfigAction,
  previewImportServersConfigAction,
} from "@/server/actions/servers";

export function ServersConfigToolbar() {
  const router = useRouter();
  const t = useTranslations("servers");
  const tc = useTranslations("common");
  const fileRef = useRef<HTMLInputElement>(null);
  const pendingFileRef = useRef<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewDiff, setPreviewDiff] = useState<ServersConfigImportDiff | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportPassword, setExportPassword] = useState("");

  async function handleExportConfirm() {
    setLoading(true);
    setError(null);
    setNotice(null);

    try {
      const confirmResult = await confirmConfigExportAction(exportPassword);
      if (!confirmResult.success) {
        setError(confirmResult.error);
        return;
      }

      const response = await fetch(
        `/api/servers/config/export?token=${encodeURIComponent(confirmResult.token)}`,
      );

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(body?.error ?? t("configExportFailed"));
        return;
      }

      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition") ?? "";
      const filenameMatch = disposition.match(/filename="([^"]+)"/);
      const filename = filenameMatch?.[1] ?? "ufw-servers.json";

      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(url);
      setNotice(t("configExportWarning"));
      setExportOpen(false);
      setExportPassword("");
    } catch {
      setError(t("configExportFailed"));
    } finally {
      setLoading(false);
    }
  }

  async function handleFileSelected(file: File) {
    setLoading(true);
    setError(null);
    setNotice(null);

    const formData = new FormData();
    formData.append("file", file);
    const result = await previewImportServersConfigAction(formData);
    setLoading(false);

    if (!result.success) {
      setError(result.error);
      pendingFileRef.current = null;
      return;
    }

    pendingFileRef.current = file;
    setPreviewDiff(result.diff);
    setPreviewOpen(true);
  }

  async function handleImportConfirm() {
    const file = pendingFileRef.current;
    if (!file || loading) {
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    const result = await importServersConfigAction(formData);
    setLoading(false);

    if (!result.success) {
      setError(result.error ?? t("configImportFailed"));
      return;
    }

    pendingFileRef.current = null;
    setPreviewDiff(null);
    setPreviewOpen(false);
    setNotice(t("configImportSuccess"));
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              void handleFileSelected(file);
            }
            event.target.value = "";
          }}
        />

        <Button variant="secondary" onClick={() => setExportOpen(true)} disabled={loading}>
          {t("saveConfig")}
        </Button>
        <Button variant="secondary" onClick={() => fileRef.current?.click()} disabled={loading}>
          {t("loadConfig")}
        </Button>
        <Button asChild>
          <Link href="/servers/new">{t("addServer")}</Link>
        </Button>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {notice ? <p className="text-sm text-muted-foreground">{notice}</p> : null}

      <AlertDialog
        open={exportOpen}
        onOpenChange={(open) => {
          if (!loading) {
            setExportOpen(open);
            if (!open) {
              setExportPassword("");
            }
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("configExportTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("configExportDescription")}</AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-2">
            <Label htmlFor="export-password">{t("configExportPassword")}</Label>
            <Input
              id="export-password"
              type="password"
              value={exportPassword}
              onChange={(event) => setExportPassword(event.target.value)}
              autoComplete="current-password"
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>{tc("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void handleExportConfirm();
              }}
              disabled={loading || exportPassword.length === 0}
            >
              {t("configExportConfirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={previewOpen}
        onOpenChange={(open) => {
          if (!loading) {
            setPreviewOpen(open);
            if (!open) {
              pendingFileRef.current = null;
              setPreviewDiff(null);
            }
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("configImportTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("configImportDescription")}</AlertDialogDescription>
          </AlertDialogHeader>

          {previewDiff ? (
            <div className="space-y-3 text-sm">
              <p>{t("configImportCreate", { count: previewDiff.toCreate.length })}</p>
              <p>{t("configImportUpdate", { count: previewDiff.toUpdate.length })}</p>
              {previewDiff.toDelete.length > 0 ? (
                <div className="space-y-2">
                  <p className="font-medium">{t("configImportDeleteList")}</p>
                  <ul className="list-disc space-y-1 pl-5">
                    {previewDiff.toDelete.map((entry) => (
                      <li key={`${entry.host}:${entry.port}:${entry.identityName}`}>
                        {entry.name} ({entry.identityName} @ {entry.host}:{entry.port})
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>{tc("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleImportConfirm()} disabled={loading}>
              {t("configImportConfirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
