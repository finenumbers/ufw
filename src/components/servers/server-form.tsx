"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";

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
import { getServerPath } from "@/lib/server-path";
import { createServerAction, updateServerAction } from "@/server/actions/servers";

type ServerFormProps = {
  mode: "create" | "edit";
  serverId?: string;
  defaultValues?: Partial<ServerInput>;
};

export function ServerForm({ mode, serverId, defaultValues }: ServerFormProps) {
  const router = useRouter();
  const t = useTranslations("serverForm");
  const tc = useTranslations("common");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm<ServerInput>({
    resolver: zodResolver(serverSchema),
    defaultValues: {
      name: "",
      host: "",
      port: 22,
      username: "root",
      authMethod: "PASSWORD",
      password: "",
      privateKey: "",
      passphrase: "",
      ...defaultValues,
    },
  });

  const authMethod = form.watch("authMethod");

  async function onSubmit(values: ServerInput) {
    setLoading(true);
    setError(null);

    const result =
      mode === "create"
        ? await createServerAction(values)
        : serverId
          ? await updateServerAction(serverId, values)
          : { success: false as const, error: t("missingServerId") };

    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    if (mode === "create" && "serverAddress" in result) {
      router.push(getServerPath(result.serverAddress));
    } else if ("serverAddress" in result) {
      router.push(getServerPath(result.serverAddress));
    } else {
      router.push("/servers");
    }
    router.refresh();
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-2xl space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">{t("name")}</Label>
          <Input id="name" {...form.register("name")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="host">{t("host")}</Label>
          <Input id="host" {...form.register("host")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="port">{t("port")}</Label>
          <Input id="port" type="number" {...form.register("port")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="username">{t("username")}</Label>
          <Input id="username" {...form.register("username")} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>{t("authMethod")}</Label>
        <Select
          value={authMethod}
          onValueChange={(value) =>
            form.setValue("authMethod", value as ServerInput["authMethod"])
          }
        >
          <SelectTrigger>
            <SelectValue placeholder={t("selectMethod")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PASSWORD">{t("passwordAuth")}</SelectItem>
            <SelectItem value="PRIVATE_KEY">{t("privateKeyAuth")}</SelectItem>
            <SelectItem value="PRIVATE_KEY_WITH_PASSPHRASE">{t("privateKeyPassphraseAuth")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {authMethod === "PASSWORD" && (
        <div className="space-y-2">
          <Label htmlFor="password">{t("password")}</Label>
          <Input id="password" type="password" {...form.register("password")} />
        </div>
      )}

      {(authMethod === "PRIVATE_KEY" || authMethod === "PRIVATE_KEY_WITH_PASSPHRASE") && (
        <>
          <div className="space-y-2">
            <Label htmlFor="privateKey">{t("privateKey")}</Label>
            <textarea
              id="privateKey"
              className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              {...form.register("privateKey")}
            />
          </div>
          {authMethod === "PRIVATE_KEY_WITH_PASSPHRASE" && (
            <div className="space-y-2">
              <Label htmlFor="passphrase">{t("passphrase")}</Label>
              <Input id="passphrase" type="password" {...form.register("passphrase")} />
            </div>
          )}
        </>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
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
