"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  deleteAwgConfigAction,
  getAwgStatusAction,
  saveAwgConfigAction,
  setAwgEnabledAction,
} from "@/server/actions/awg";
import type { AwgPublicStatus } from "@/server/services/awg.service";

const EMPTY: AwgPublicStatus = {
  configured: false,
  enabled: false,
  leader: false,
  up: false,
  handshakeAgeSec: null,
  address: null,
  endpoint: null,
  allowedIps: null,
  updatedAt: null,
  error: null,
};

function statusKey(status: AwgPublicStatus): "missing" | "other" | "error" | "disabled" | "handshake" | "connected" {
  if (!status.configured) return "missing";
  if (status.enabled && !status.leader) return "other";
  if (status.error && !status.up) return "error";
  if (!status.enabled || !status.up) return "disabled";
  if (status.handshakeAgeSec === null || status.handshakeAgeSec > 180) return "handshake";
  return "connected";
}

export function awgStatusTone(status: AwgPublicStatus): "ok" | "warn" | "bad" | "idle" {
  const key = statusKey(status);
  if (key === "connected") return "ok";
  if (key === "handshake") return "warn";
  if (key === "error" || key === "other") return "bad";
  return "idle";
}

export function AwgSettings({ initial }: { initial: AwgPublicStatus }) {
  const t = useTranslations("awg");
  const [status, setStatus] = useState(initial);
  const [conf, setConf] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const key = statusKey(status);

  useEffect(() => {
    const timer = setInterval(() => {
      void getAwgStatusAction().then(setStatus).catch(() => undefined);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  async function refresh() {
    setStatus(await getAwgStatusAction());
  }

  async function onSave() {
    setLoading(true);
    setError(null);
    const result = await saveAwgConfigAction(conf, password);
    setLoading(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setConf("");
    setPassword("");
    await refresh();
  }

  async function onEnabled(enabled: boolean) {
    setLoading(true);
    setError(null);
    const result = await setAwgEnabledAction(enabled);
    setLoading(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    await refresh();
  }

  async function onDelete() {
    setLoading(true);
    setError(null);
    const result = await deleteAwgConfigAction(password);
    setLoading(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setPassword("");
    await refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span
          className={
            awgStatusTone(status) === "ok"
              ? "h-2.5 w-2.5 rounded-full bg-emerald-500"
              : awgStatusTone(status) === "warn"
                ? "h-2.5 w-2.5 rounded-full bg-amber-500"
                : awgStatusTone(status) === "bad"
                  ? "h-2.5 w-2.5 rounded-full bg-red-500"
                  : "h-2.5 w-2.5 rounded-full bg-zinc-400"
          }
        />
        <p className="font-medium">{t(`status.${key}`)}</p>
      </div>

      {status.error ? <p className="text-sm text-destructive">{status.error}</p> : null}

      {status.configured ? (
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">{t("address")}</dt>
            <dd className="font-mono">{status.address}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t("endpoint")}</dt>
            <dd className="font-mono">{status.endpoint}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t("allowedIps")}</dt>
            <dd className="break-all font-mono">{status.allowedIps}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t("updated")}</dt>
            <dd>{status.updatedAt ? new Date(status.updatedAt).toLocaleString() : ""}</dd>
          </div>
        </dl>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="awg-conf">{t("confLabel")}</Label>
        <textarea
          id="awg-conf"
          value={conf}
          onChange={(event) => setConf(event.target.value)}
          placeholder={t("confPlaceholder")}
          rows={10}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs"
        />
        <Label htmlFor="awg-file">{t("fileLabel")}</Label>
        <Input
          id="awg-file"
          type="file"
          accept=".conf,text/plain"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            setConf(await file.text());
          }}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="awg-password">{t("password")}</Label>
        <Input
          id="awg-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex flex-wrap gap-2">
        <Button type="button" disabled={loading || !conf || !password} onClick={() => void onSave()}>
          {loading ? t("working") : t("save")}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={loading || !status.configured || status.enabled}
          onClick={() => void onEnabled(true)}
        >
          {t("connect")}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={loading || !status.enabled}
          onClick={() => void onEnabled(false)}
        >
          {t("disconnect")}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={loading || !status.configured || !password}
          onClick={() => void onDelete()}
        >
          {t("delete")}
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">{t("helperNote")}</p>
    </div>
  );
}

export const emptyAwgStatus = EMPTY;
