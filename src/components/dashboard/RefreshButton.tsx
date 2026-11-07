"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export function RefreshButton({
  label = "Refresh",
  className,
}: {
  label?: string;
  className?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      className={cn("btn btn-outline shrink-0", className)}
      disabled={busy}
      onClick={() => {
        setBusy(true);
        router.refresh();
        window.setTimeout(() => setBusy(false), 700);
      }}
    >
      <RefreshCw className={cn("h-4 w-4", busy && "animate-spin")} />
      {busy ? "Refreshing…" : label}
    </button>
  );
}
