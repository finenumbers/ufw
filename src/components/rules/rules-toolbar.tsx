"use client";

import { useTranslations } from "next-intl";

export function RulesToolbar() {
  const t = useTranslations("rules.toolbar");

  return (
    <p className="text-sm text-muted-foreground">
      {t.rich("hint", {
        highlight: (chunks) => <span className="font-medium">{chunks}</span>,
      })}
    </p>
  );
}
