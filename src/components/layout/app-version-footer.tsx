"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { getAppVersion, getAppVersionLabel, isNewerSemver } from "@/lib/app-version";

const RELEASES_LATEST_URL = "https://api.github.com/repos/finenumbers/ufw/releases/latest";
const RELEASES_PAGE_URL = "https://github.com/finenumbers/ufw/releases/latest";

type AppVersionFooterProps = {
  docsHref: string;
  docsLabel: string;
};

export function AppVersionFooter({ docsHref, docsLabel }: AppVersionFooterProps) {
  const t = useTranslations("footer");
  const [latestRelease, setLatestRelease] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void fetch(RELEASES_LATEST_URL, {
      headers: { Accept: "application/vnd.github+json" },
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { tag_name?: string } | null) => {
        if (cancelled || !payload?.tag_name) {
          return;
        }

        const latest = payload.tag_name.replace(/^v/, "");
        if (isNewerSemver(latest, getAppVersion())) {
          setLatestRelease(latest);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex items-start justify-between gap-2 pt-2 text-xs text-muted-foreground">
      <a
        href={docsHref}
        target="_blank"
        rel="noopener noreferrer"
        className="underline-offset-4 hover:underline"
      >
        {docsLabel}
      </a>
      <div className="flex shrink-0 flex-col items-end gap-0.5">
        <span className="font-mono tabular-nums" title={t("versionTitle")}>
          {getAppVersionLabel()}
        </span>
        {latestRelease ? (
          <a
            href={RELEASES_PAGE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-amber-600 underline-offset-4 hover:underline dark:text-amber-400"
            title={t("updateAvailableTitle")}
          >
            {t("updateAvailable", { version: `v${latestRelease}` })}
          </a>
        ) : null}
      </div>
    </div>
  );
}
