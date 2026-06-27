export const LOCALE_COOKIE = "ufw_locale";

export const localeDisplayOrder = ["en", "de", "es", "fr", "it", "pt-BR", "ru"] as const;

export const locales = localeDisplayOrder;

export type AppLocale = (typeof locales)[number];

export const defaultLocale: AppLocale = "en";

export const localeLabels: Record<AppLocale, string> = {
  en: "English",
  de: "Deutsch",
  es: "Español",
  fr: "Français",
  it: "Italiano",
  "pt-BR": "Português (Brasil)",
  ru: "Русский",
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

    const base = tag.split("-")[0];
    const match = locales.find((locale) => locale.toLowerCase().startsWith(base));
    if (match) return match;
  }

  return defaultLocale;
}

export const sortedLocaleOptions = localeDisplayOrder.map((locale) => ({
  locale,
  label: localeLabels[locale],
}));
