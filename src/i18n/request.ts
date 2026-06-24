import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";

import {
  defaultLocale,
  detectLocaleFromAcceptLanguage,
  isAppLocale,
  LOCALE_COOKIE,
  type AppLocale,
} from "@/i18n/config";

async function loadMessages(locale: AppLocale) {
  switch (locale) {
    case "en":
      return (await import("@/i18n/messages/en.json")).default;
    case "de":
      return (await import("@/i18n/messages/de.json")).default;
    case "fr":
      return (await import("@/i18n/messages/fr.json")).default;
    case "es":
      return (await import("@/i18n/messages/es.json")).default;
    case "it":
      return (await import("@/i18n/messages/it.json")).default;
    case "pt-BR":
      return (await import("@/i18n/messages/pt-BR.json")).default;
    case "ru":
      return (await import("@/i18n/messages/ru.json")).default;
    default:
      return (await import("@/i18n/messages/en.json")).default;
  }
}

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;

  let locale: AppLocale = defaultLocale;
  if (isAppLocale(cookieLocale)) {
    locale = cookieLocale;
  } else {
    const headerStore = await headers();
    locale = detectLocaleFromAcceptLanguage(headerStore.get("accept-language"));
  }

  return {
    locale,
    messages: await loadMessages(locale),
  };
});
