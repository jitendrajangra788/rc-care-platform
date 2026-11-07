"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useLocale } from "@/lib/i18n";

/** Client-only idle warning. Does not change server session rules. */
const IDLE_MS = 25 * 60 * 1000;
const WARN_MS = 60 * 1000;
/** Don't re-arm timers on every pixel of mouse movement */
const ARM_THROTTLE_MS = 5000;

export function SessionTimeoutDialog() {
  const router = useRouter();
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const openRef = useRef(false);
  const idleTimer = useRef(0);
  const warnTimer = useRef(0);
  const lastArm = useRef(0);

  const reset = useCallback(() => {
    openRef.current = false;
    setOpen(false);
  }, []);

  useEffect(() => {
    function clearTimers() {
      window.clearTimeout(idleTimer.current);
      window.clearTimeout(warnTimer.current);
    }

    function arm(force = false) {
      const now = Date.now();
      if (!force && now - lastArm.current < ARM_THROTTLE_MS) return;
      lastArm.current = now;
      clearTimers();
      if (openRef.current) {
        openRef.current = false;
        setOpen(false);
      }
      idleTimer.current = window.setTimeout(() => {
        openRef.current = true;
        setOpen(true);
        warnTimer.current = window.setTimeout(async () => {
          await fetch("/api/auth/logout", { method: "POST" });
          router.push("/login");
        }, WARN_MS);
      }, IDLE_MS);
    }

    const onActivity = () => arm(false);
    const events = ["keydown", "click", "touchstart"] as const;
    events.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));
    // Scroll/mousemove: throttled separately (cheap) — avoid hanging the UI
    const onMove = () => arm(false);
    window.addEventListener("scroll", onMove, { passive: true, capture: true });
    window.addEventListener("mousemove", onMove, { passive: true });
    arm(true);

    return () => {
      clearTimers();
      events.forEach((e) => window.removeEventListener(e, onActivity));
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("mousemove", onMove);
    };
  }, [router]);

  return (
    <ConfirmDialog
      open={open}
      onCancel={reset}
      onConfirm={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/login");
      }}
      title={t.sessionSoon}
      description="Your session will end in about a minute due to inactivity."
      confirmLabel={t.signOut}
      cancelLabel={t.staySignedIn}
      tone="primary"
    />
  );
}
