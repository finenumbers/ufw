export const LOCALE_COOKIE = "ufw_locale";

export const locales = [
  "en",
  "ru",
  "de",
  "es",
  "fr",
  "pt-BR",
  "zh-Hans",
  "uk",
  "pl",
  "tr",
  "ja",
  "it",
  "nl",
] as const;

export type AppLocale = (typeof locales)[number];

export const defaultLocale: AppLocale = "en";

export const localeLabels: Record<AppLocale, string> = {
  en: "English",
  ru: "Русский",
  de: "Deutsch",
  es: "Español",
  fr: "Français",
  "pt-BR": "Português (Brasil)",
  "zh-Hans": "简体中文",
  uk: "Українська",
  pl: "Polski",
  tr: "Türkçe",
  ja: "日本語",
  it: "Italiano",
  nl: "Nederlands",
};

export function isAppLocale(value: string | undefined | null): value is AppLocale {
  return Boolean(value && locales.includes(value as AppLocale));
}

export function detectLocaleFromAcceptLanguage(header: string | null): AppLocale {
  if (!header) return defaultLocale;

  const preferred = header
    .split(",")
    .map((part) => part.trim().split(";")[0]?.toLowerCase())
    .filter(Boolean) as string[];

  for (const tag of preferred) {
    if (isAppLocale(tag)) return tag;

    if (tag.startsWith("pt") && locales.includes("pt-BR")) return "pt-BR";
    if (tag.startsWith("zh") && locales.includes("zh-Hans")) return "zh-Hans";

    const base = tag.split("-")[0];
    const match = locales.find((locale) => locale.toLowerCase().startsWith(base));
    if (match) return match;
  }

  return defaultLocale;
}

export const sortedLocaleOptions = locales
  .map((locale) => ({ locale, label: localeLabels[locale] }))
  .sort((a, b) => a.label.localeCompare(b.label, "en", { sensitivity: "base" }));
