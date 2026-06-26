"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { formatIdentityOptionLabel } from "@/components/identities/identity-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { serverSchema, type ServerInput } from "@/lib/validations/server";
import type { IdentityListItem } from "@/lib/validations/identity";
import { getServerPath } from "@/lib/server-path";
import { createServerAction, updateServerAction } from "@/server/actions/servers";

type ServerFormProps = {
  mode: "create" | "edit";
  serverId?: string;
  identities: IdentityListItem[];
  defaultValues?: Partial<ServerInput>;
};

export function ServerForm({ mode, serverId, identities, defaultValues }: ServerFormProps) {
  const router = useRouter();
  const t = useTranslations("serverForm");
  const tf = useTranslations("identityForm");
  const tc = useTranslations("common");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm<ServerInput>({
    resolver: zodResolver(serverSchema),
    defaultValues: {
      name: "",
      host: "",
      port: 22,
      identityId: identities[0]?.id ?? "",
      ...defaultValues,
    },
  });

  const identityId = form.watch("identityId");

  async function onSubmit(values: ServerInput) {
    setLoading(true);
    setError(null);

    try {
      const result =
        mode === "create"
          ? await createServerAction(values)
          : serverId
            ? await updateServerAction(serverId, values)
            : { success: false as const, error: t("missingServerId") };

      if (!result.success) {
        setError(result.error);
        return;
      }

      if ("serverAddress" in result) {
        router.push(getServerPath(result.serverAddress));
      } else {
        router.push("/servers");
      }
      router.refresh();
    } catch {
      setError(t("unexpectedError"));
    } finally {
      setLoading(false);
    }
  }

  if (identities.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-6">
        <p className="text-sm text-muted-foreground">{t("noIdentities")}</p>
        <Button asChild className="mt-4">
          <Link href="/identities/new">{t("createIdentityLink")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-4">
      <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="name">{t("name")}</Label>
          <Input id="name" className="w-full" {...form.register("name")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="host">{t("host")}</Label>
          <Input id="host" className="w-full" {...form.register("host")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="port">{t("port")}</Label>
          <Input id="port" type="number" className="w-full" {...form.register("port")} />
        </div>
      </div>

      <div className="w-full space-y-2">
        <Label>{t("identity")}</Label>
        <Select
          value={identityId}
          onValueChange={(value) => form.setValue("identityId", value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t("selectIdentity")} />
          </SelectTrigger>
          <SelectContent>
            {identities.map((identity) => (
              <SelectItem key={identity.id} value={identity.id}>
                {formatIdentityOptionLabel(identity, tf)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={loading || !identityId}>
          {loading
            ? mode === "create"
              ? t("creating")
              : t("updating")
            : mode === "create"
              ? t("createServer")
              : t("updateServer")}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          {tc("cancel")}
        </Button>
      </div>
    </form>
  );
}
