"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type RulesColumnHeaderFilterProps = {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  allLabel: string;
  noMatchesLabel: string;
  filterAria: string;
  clearFilterAria: string;
  showOptionsAria: string;
  optionsAria: string;
  className?: string;
};

export function RulesColumnHeaderFilter({
  label,
  value,
  options,
  onChange,
  allLabel,
  noMatchesLabel,
  filterAria,
  clearFilterAria,
  showOptionsAria,
  optionsAria,
  className,
}: RulesColumnHeaderFilterProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const visibleOptions = useMemo(() => {
    const query = value.trim().toLowerCase();
    if (!query) return options;
    return options.filter((option) => option.toLowerCase().includes(query));
  }, [options, value]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  return (
    <div ref={rootRef} className={cn("relative w-full", className)}>
      <div className="flex items-center gap-0.5">
        <Input
          value={value}
          placeholder={label}
          aria-label={filterAria}
          className="h-6 min-h-6 px-1.5 py-0 text-[10px] font-medium leading-tight text-foreground placeholder:font-medium placeholder:text-foreground"
          onChange={(event) => onChange(event.target.value)}
          onFocus={() => setOpen(true)}
        />
        {value ? (
          <button
            type="button"
            className="flex h-6 w-5 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted"
            aria-label={clearFilterAria}
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
          >
            <X className="h-3 w-3" />
          </button>
        ) : (
          <button
            type="button"
            className="flex h-6 w-5 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted"
            aria-label={showOptionsAria}
            aria-expanded={open}
            onClick={() => setOpen((current) => !current)}
          >
            <ChevronDown className={cn("h-3 w-3 transition-transform", open && "rotate-180")} />
          </button>
        )}
      </div>
      {open ? (
        <ul
          className="absolute left-0 top-full z-30 mt-0.5 max-h-40 min-w-full overflow-auto rounded-md border bg-popover py-0.5 text-[10px] leading-tight shadow-md"
          role="listbox"
          aria-label={optionsAria}
        >
          <li>
            <button
              type="button"
              className="block w-full px-2 py-1 text-left text-muted-foreground hover:bg-accent"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
            >
              {allLabel}
            </button>
          </li>
          {visibleOptions.length === 0 ? (
            <li className="px-2 py-1 text-muted-foreground">{noMatchesLabel}</li>
          ) : (
            visibleOptions.map((option) => (
              <li key={option}>
                <button
                  type="button"
                  className={cn(
                    "block w-full px-2 py-1 text-left hover:bg-accent",
                    value === option && "bg-accent font-medium",
                  )}
                  onClick={() => {
                    onChange(option);
                    setOpen(false);
                  }}
                >
                  {option}
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
