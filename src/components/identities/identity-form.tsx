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
import {
  identityCreateSchema,
  identityUpdateSchema,
  type IdentityCreateInput,
  type IdentityUpdateInput,
} from "@/lib/validations/identity";
import {
  createIdentityAction,
  updateIdentityAction,
} from "@/server/actions/identities";

type IdentityFormProps =
  | {
      mode: "create";
      identityId?: never;
      defaultValues?: Partial<IdentityCreateInput>;
      serverCount?: number;
    }
  | {
      mode: "edit";
      identityId: string;
      defaultValues: IdentityUpdateInput;
      serverCount: number;
    };

function authMethodLabel(
  authMethod: IdentityCreateInput["authMethod"],
  t: ReturnType<typeof useTranslations<"identityForm">>,
): string {
  switch (authMethod) {
    case "PASSWORD":
      return t("passwordAuth");
    case "PRIVATE_KEY":
      return t("privateKeyAuth");
    case "PRIVATE_KEY_WITH_PASSPHRASE":
      return t("privateKeyPassphraseAuth");
  }
}

export function IdentityForm(props: IdentityFormProps) {
  const router = useRouter();
  const t = useTranslations("identityForm");
  const tc = useTranslations("common");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showUpdateWarning, setShowUpdateWarning] = useState(false);
  const [pendingValues, setPendingValues] = useState<IdentityUpdateInput | null>(null);

  const isEdit = props.mode === "edit";

  const form = useForm<IdentityCreateInput>({
    resolver: zodResolver(isEdit ? identityUpdateSchema : identityCreateSchema),
    defaultValues: {
      name: "",
      username: "root",
      authMethod: "PASSWORD",
      password: "",
      privateKey: "",
      passphrase: "",
      ...props.defaultValues,
    },
  });

  const authMethod = form.watch("authMethod");

  async function submitValues(values: IdentityCreateInput | IdentityUpdateInput) {
    setLoading(true);
    setError(null);

    const result =
      props.mode === "create"
        ? await createIdentityAction(values as IdentityCreateInput)
        : await updateIdentityAction(props.identityId, values as IdentityUpdateInput);

    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    if (props.mode === "create" && "id" in result) {
      router.push(`/identities/${result.id}/edit`);
    } else {
      router.push("/identities");
    }
    router.refresh();
  }

  async function onSubmit(values: IdentityCreateInput) {
    if (isEdit && props.serverCount > 0 && !showUpdateWarning) {
      setPendingValues(values);
      setShowUpdateWarning(true);
      return;
    }

    await submitValues(values);
  }

  return (
    <>
      <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-2xl space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">{t("name")}</Label>
            <Input id="name" {...form.register("name")} />
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
              form.setValue("authMethod", value as IdentityCreateInput["authMethod"])
            }
          >
            <SelectTrigger>
              <SelectValue placeholder={t("selectMethod")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PASSWORD">{t("passwordAuth")}</SelectItem>
              <SelectItem value="PRIVATE_KEY">{t("privateKeyAuth")}</SelectItem>
              <SelectItem value="PRIVATE_KEY_WITH_PASSPHRASE">
                {t("privateKeyPassphraseAuth")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isEdit ? (
          <div
            className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-950 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-100"
            role="note"
          >
            <p className="font-medium">{t("credentialsSavedTitle")}</p>
            <p className="mt-1 text-blue-900/90 dark:text-blue-100/90">
              {t("credentialsSavedDescription")}
            </p>
          </div>
        ) : null}

        {authMethod === "PASSWORD" && (
          <div className="space-y-2">
            <Label htmlFor="password">{t("password")}</Label>
            <Input
              id="password"
              type="password"
              placeholder={isEdit ? t("passwordPlaceholderEdit") : undefined}
              {...form.register("password")}
            />
            {isEdit ? (
              <p className="text-xs text-muted-foreground">{t("secretFieldEditHint")}</p>
            ) : null}
          </div>
        )}

        {(authMethod === "PRIVATE_KEY" || authMethod === "PRIVATE_KEY_WITH_PASSPHRASE") && (
          <>
            <div className="space-y-2">
              <Label htmlFor="privateKey">{t("privateKey")}</Label>
              <textarea
                id="privateKey"
                className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder={isEdit ? t("privateKeyPlaceholderEdit") : undefined}
                {...form.register("privateKey")}
              />
              {isEdit ? (
                <p className="text-xs text-muted-foreground">{t("secretFieldEditHint")}</p>
              ) : null}
            </div>
            {authMethod === "PRIVATE_KEY_WITH_PASSPHRASE" && (
              <div className="space-y-2">
                <Label htmlFor="passphrase">{t("passphrase")}</Label>
                <Input
                  id="passphrase"
                  type="password"
                  placeholder={isEdit ? t("passphrasePlaceholderEdit") : undefined}
                  {...form.register("passphrase")}
                />
                {isEdit ? (
                  <p className="text-xs text-muted-foreground">{t("secretFieldEditHint")}</p>
                ) : null}
              </div>
            )}
          </>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-2">
          <Button type="submit" disabled={loading}>
            {loading
              ? isEdit
                ? t("updating")
                : t("creating")
              : isEdit
                ? t("updateIdentity")
                : t("createIdentity")}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            {tc("cancel")}
          </Button>
        </div>
      </form>

      {showUpdateWarning && pendingValues ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-lg">
            <h3 className="text-lg font-semibold">{t("updateWarningTitle")}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("updateWarningDescription", { count: props.serverCount ?? 0 })}
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowUpdateWarning(false);
                  setPendingValues(null);
                }}
              >
                {tc("cancel")}
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setShowUpdateWarning(false);
                  void submitValues(pendingValues);
                  setPendingValues(null);
                }}
              >
                {t("confirmUpdate")}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export function formatIdentityOptionLabel(
  identity: { name: string; username: string; authMethod: IdentityCreateInput["authMethod"] },
  t: ReturnType<typeof useTranslations<"identityForm">>,
): string {
  return `${identity.name} — ${identity.username} (${authMethodLabel(identity.authMethod, t)})`;
}
