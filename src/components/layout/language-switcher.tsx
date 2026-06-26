"use client";

import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useTransition } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { sortedLocaleOptions, type AppLocale } from "@/i18n/config";
import { setLocaleAction } from "@/server/actions/locale";

type LanguageSwitcherProps = {
  className?: string;
};

export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleChange(nextLocale: string) {
    startTransition(async () => {
      await setLocaleAction(nextLocale);
      router.refresh();
    });
  }

  return (
    <div className={className}>
      <Select value={locale} onValueChange={handleChange} disabled={pending}>
        <SelectTrigger className="h-8 w-full text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-64">
          {sortedLocaleOptions.map((option) => (
            <SelectItem key={option.locale} value={option.locale} className="text-xs">
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
