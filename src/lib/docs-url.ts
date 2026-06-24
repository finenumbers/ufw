import type { AppLocale } from "@/i18n/config";

const DOCS_REPO_BASE =
  "https://github.com/finenumbers/ufw/tree/main/docs";

export function getDocsUrl(locale: AppLocale): string {
  return `${DOCS_REPO_BASE}/${locale}/README.md`;
}

export const SUPPORT_EMAIL = "apps@finenumbers.com";

export function getSupportMailtoUrl(): string {
  return `mailto:${SUPPORT_EMAIL}`;
}
