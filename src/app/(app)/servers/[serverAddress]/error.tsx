"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function ServerDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 rounded-lg border border-destructive/30 bg-destructive/5 p-6">
      <h2 className="text-lg font-semibold">Unable to load this server</h2>
      <p className="text-sm text-muted-foreground">
        {error.message || "The server detail view failed to render."}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={reset}>
          Try again
        </Button>
        <Button asChild variant="outline">
          <Link href="/servers">Back to servers</Link>
        </Button>
      </div>
    </div>
  );
}
