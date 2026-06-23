"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { isAppLocale, LOCALE_COOKIE, type AppLocale } from "@/i18n/config";

export async function setLocaleAction(locale: string): Promise<{ success: boolean; error?: string }> {
  if (!isAppLocale(locale)) {
    return { success: false, error: "Invalid locale" };
  }

  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, locale as AppLocale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  revalidatePath("/", "layout");
  return { success: true };
}
