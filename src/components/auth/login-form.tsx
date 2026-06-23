"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "@/lib/auth-client";
import { safeCallbackUrl } from "@/lib/safe-callback-url";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("auth.login");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginInput) {
    setLoading(true);
    setError(null);

    const result = await signIn.email({
      email: values.email,
      password: values.password,
    });

    setLoading(false);

    if (result.error) {
      setError(result.error.message ?? t("failed"));
      return;
    }

    const callbackUrl = safeCallbackUrl(searchParams.get("callbackUrl"));
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t("email")}</Label>
            <Input id="email" type="email" {...form.register("email")} />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t("password")}</Label>
            <Input id="password" type="password" {...form.register("password")} />
            {form.formState.errors.password && (
              <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
            )}
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t("submitting") : t("submit")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
