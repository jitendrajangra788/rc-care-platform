"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  CheckCircle2,
  CloudOff,
  Flag,
  KeyRound,
  MapPin,
  Moon,
  Navigation,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Sun,
  Wallet,
  Clock3,
  CircleDot,
} from "lucide-react";
import type { Attendance, AttendanceSlot, Booking } from "@/lib/types";
import { dutyProgress, todayDutyDate } from "@/lib/duty";
import {
  DEFAULT_GEOFENCE_M,
  WEAK_GPS_M,
  distanceMeters,
  effectiveGeofenceM,
  gpsQuality,
} from "@/lib/geo";
import { cn, formatINR } from "@/lib/utils";
import { formatDateTime } from "@/lib/format";
import { usePagedList } from "@/hooks/usePagedList";
import {
  PhotoCapture,
  type PhotoCaptureHandle,
} from "@/components/dashboard/PhotoCapture";
import { Badge } from "@/components/ui/Badge";
import { Pagination } from "@/components/ui/Pagination";
import { toast } from "@/components/ui/toast";

type Duty = Booking & { patientName: string; staffPayPerShift?: number };

const QUEUE_KEY = "rc-attendance-offline-queue";

type QueuedPresent = {
  bookingId: string;
  lat: number;
  lng: number;
  accuracy?: number;
  photoDataUrl: string;
  type: AttendanceSlot;
  demoForceOnSite?: boolean;
  pinCareSite?: boolean;
  sitePin?: string;
  queuedAt: string;
};

type HistoryFilter = "all" | "morning" | "evening" | "week" | "month";

function formatDistance(meters: number) {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
  return `${meters} m`;
}

function formatAccuracy(accuracy?: number) {
  if (accuracy == null) return "—";
  if (accuracy >= 5000) return "Weak GPS";
  if (accuracy >= 1000) return `±${Math.round(accuracy / 1000)} km`;
  return `±${Math.round(accuracy)} m`;
}

function readQueue(): QueuedPresent[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as QueuedPresent[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeQueue(items: QueuedPresent[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(items));
}

function qualityPct(accuracy?: number) {
  if (accuracy == null || Number.isNaN(accuracy)) return 20;
  if (accuracy <= 25) return 100;
  if (accuracy <= 50) return 80;
  if (accuracy <= WEAK_GPS_M) return 55;
  return 25;
}

function slotLabel(type: Attendance["type"]) {
  if (type === "present") return "morning";
  if (type === "checkout") return "evening";
  return type;
}

export function AttendancePanel({
  duties,
  history,
  salaryPerShift = 700,
}: {
  duties: Duty[];
  history: Attendance[];
  salaryPerShift?: number;
}) {
  const router = useRouter();
  const dutyDate = todayDutyDate();
  const [bookingId, setBookingId] = useState(duties[0]?.id || "");
  const [gps, setGps] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState("");
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [sitePin, setSitePin] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [demoForce, setDemoForce] = useState(false);
  const [queueCount, setQueueCount] = useState(0);
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>("all");
  const [siteOverride, setSiteOverride] = useState<{
    bookingId: string;
    lat: number;
    lng: number;
  } | null>(null);
  const photoCaptureRef = useRef<PhotoCaptureHandle>(null);

  const selected = duties.find((d) => d.id === bookingId);
  const progress = useMemo(
    () => dutyProgress(history, bookingId, dutyDate),
    [history, bookingId, dutyDate],
  );
  const nextSlot: AttendanceSlot | null = progress.nextSlot;
  const shiftPay = selected?.staffPayPerShift ?? salaryPerShift;
  const needsPin = Boolean(selected?.sitePin);

  const siteLat =
    siteOverride?.bookingId === bookingId ? siteOverride.lat : selected?.lat;
  const siteLng =
    siteOverride?.bookingId === bookingId ? siteOverride.lng : selected?.lng;
  const baseRadius = selected?.geofenceRadiusM || DEFAULT_GEOFENCE_M;
  const radius = effectiveGeofenceM(baseRadius, gps?.accuracy);
  const quality = gpsQuality(gps?.accuracy);
  const distance =
    gps && siteLat != null && siteLng != null
      ? Math.round(distanceMeters(gps.lat, gps.lng, siteLat, siteLng))
      : null;
  const within = distance != null ? distance <= radius : null;
  const farAway = distance != null && distance > radius;
  const weakGps = quality === "weak";

  const step = progress.complete
    ? 4
    : !gps
      ? 1
      : needsPin && sitePin.replace(/\D/g, "").length < 4
        ? 2
        : !photoDataUrl
          ? 3
          : 4;

  const pinOk = !needsPin || sitePin.replace(/\D/g, "").length >= 4;

  const requirementsReason = !gps
    ? "Refresh GPS to verify your location."
    : !pinOk
      ? "Enter the 4–6 digit care site PIN."
      : !photoDataUrl
        ? `Capture the ${nextSlot === "evening" ? "evening" : "morning"} attendance photo.`
        : weakGps && !demoForce
          ? "GPS is weak — refresh outdoors or enable remote/demo check-in."
          : null;

  function reasonForAction(action: "morning" | "evening" | "complete"): string | null {
    if (progress.complete) return "Duty already complete for today.";
    if (action === "morning") {
      if (progress.morningDone) return "Morning attendance already marked.";
      if (nextSlot !== "morning") return "Morning is not the next required slot.";
    }
    if (action === "evening" || action === "complete") {
      if (!progress.morningDone) return "Mark morning present first.";
      if (progress.eveningDone) return "Evening attendance already marked.";
      if (nextSlot !== "evening") return "Evening check-out is not available yet.";
    }
    return requirementsReason;
  }

  const morningReason = reasonForAction("morning");
  const eveningReason = reasonForAction("evening");
  const completeReason = reasonForAction("complete");
  const canMarkMorning = !morningReason && !saving;
  const canMarkEvening = !eveningReason && !saving;
  const canCompleteDuty = !completeReason && !saving;

  const statusLabel = progress.complete
    ? "Duty Completed"
    : progress.eveningDone
      ? "Evening Completed"
      : progress.morningDone
        ? "Morning Completed"
        : gps || photoDataUrl
          ? "In Progress"
          : "Not Started";

  const actionHint = progress.complete
    ? null
    : nextSlot === "morning"
      ? morningReason
      : nextSlot === "evening"
        ? eveningReason
        : requirementsReason;

  const filteredHistory = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthKey = dutyDate.slice(0, 7);
    return history.filter((a) => {
      const slot = slotLabel(a.type);
      if (historyFilter === "morning") return slot === "morning";
      if (historyFilter === "evening") return slot === "evening";
      if (historyFilter === "week") return new Date(a.createdAt) >= weekAgo;
      if (historyFilter === "month") {
        return (a.dutyDate || a.createdAt.slice(0, 10)).startsWith(monthKey);
      }
      return true;
    });
  }, [history, historyFilter, dutyDate]);

  const {
    page: histPage,
    pageCount: histPageCount,
    pageSize: histPageSize,
    rows: histRows,
    setPage: setHistPage,
    setPageSize: setHistPageSize,
    resetPage: resetHistPage,
  } = usePagedList(filteredHistory, 5);

  function refreshGps() {
    setGpsError("");
    setGpsLoading(true);
    if (!navigator.geolocation) {
      setGpsLoading(false);
      setGpsError("GPS not supported on this device/browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGps({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setGpsLoading(false);
      },
      (err) => {
        setGpsLoading(false);
        setGpsError(err.message || "Unable to get GPS location");
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
    );
  }

  async function flushQueue() {
    const items = readQueue();
    if (!items.length) {
      setQueueCount(0);
      return;
    }
    const remaining: QueuedPresent[] = [];
    for (const item of items) {
      try {
        const res = await fetch("/api/attendance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
        });
        if (!res.ok) remaining.push(item);
      } catch {
        remaining.push(item);
      }
    }
    writeQueue(remaining);
    setQueueCount(remaining.length);
    if (remaining.length < items.length) {
      toast.success("Offline present synced", `${items.length - remaining.length} saved`);
      router.refresh();
    }
  }

  useEffect(() => {
    const id = window.setTimeout(() => {
      void refreshGps();
      setQueueCount(readQueue().length);
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => setSitePin(""), 0);
    return () => window.clearTimeout(id);
  }, [bookingId]);

  useEffect(() => {
    if (!(farAway && !demoForce && !siteOverride)) return;
    const id = window.setTimeout(() => setDemoForce(true), 0);
    return () => window.clearTimeout(id);
  }, [farAway, demoForce, siteOverride]);

  useEffect(() => {
    function onOnline() {
      void flushQueue();
    }
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submitSlot(
    slot: AttendanceSlot,
    opts?: { pinCareSite?: boolean; forceDemo?: boolean },
  ) {
    setError("");
    setMessage("");
    if (!bookingId) {
      toast.info("Select a duty first");
      return;
    }
    if (!gps) {
      toast.info("Turn on GPS first", "Tap Refresh GPS");
      return;
    }
    if (!photoDataUrl) {
      toast.info(
        "Site photo required",
        `${slot === "morning" ? "Morning" : "Evening"} photo upload karo`,
      );
      return;
    }
    if (needsPin && sitePin.replace(/\D/g, "").length < 4) {
      toast.info("Site PIN required", "Care site ka 4–6 digit PIN dalo");
      return;
    }
    if (slot === "evening" && !progress.morningDone) {
      toast.error("Morning pehle", "Pehle morning present + photo complete karo");
      return;
    }
    if (progress.complete) {
      toast.info("Duty already complete", "Aaj morning + evening dono ho chuke hain");
      return;
    }
    if (weakGps && !demoForce && !opts?.forceDemo) {
      toast.error(
        "Weak GPS",
        `Accuracy ±${Math.round(gps.accuracy || 0)}m — Refresh GPS ya demo on karo`,
      );
      return;
    }

    const pinCareSite = opts?.pinCareSite === true;
    const useDemo =
      !pinCareSite && (opts?.forceDemo === true || demoForce || within === false);

    const payload: QueuedPresent = {
      bookingId,
      lat: gps.lat,
      lng: gps.lng,
      accuracy: gps.accuracy,
      photoDataUrl,
      type: slot,
      demoForceOnSite: useDemo,
      pinCareSite,
      sitePin: needsPin ? sitePin.replace(/\D/g, "") : undefined,
      queuedAt: new Date().toISOString(),
    };

    setSaving(true);
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setSaving(false);
      if (!res.ok) {
        setError(data.error || "Could not mark present");
        toast.error(`${slot} present failed`, data.error || "Try again");
        return;
      }
      if (pinCareSite) {
        setSiteOverride({ bookingId, lat: gps.lat, lng: gps.lng });
        setDemoForce(false);
      }
      setPhotoDataUrl(null);
      setSitePin("");

      const punctuality =
        data.punctualityStatus === "late"
          ? "Late"
          : data.punctualityStatus === "half-day"
            ? "Half day"
            : "Present";
      const timingNote = data.message || punctuality;

      if (data.dutyComplete) {
        const pay = data.payout?.amount ?? shiftPay;
        setMessage(
          `Duty COMPLETE · ${punctuality} · morning + evening done · ${formatINR(pay)} earned`,
        );
        toast.success("Duty completed successfully", `${timingNote} · ${formatINR(pay)}`);
      } else {
        setMessage(
          `${timingNote} Evening pe photo + present lagao tab duty complete hogi.`,
        );
        toast.success(`${slot} · ${punctuality}`, timingNote);
      }
      router.refresh();
    } catch {
      setSaving(false);
      const q = readQueue();
      q.push(payload);
      writeQueue(q);
      setQueueCount(q.length);
      setPhotoDataUrl(null);
      setMessage("Offline — present queue me save ho gaya. Net aate hi sync hoga.");
      toast.info("Saved offline", "Internet aate hi automatically sync");
    }
  }

  if (duties.length === 0) {
    return (
      <div className="soft-panel rounded-[var(--radius-xl)] p-8 text-center md:p-10">
        <ShieldAlert className="mx-auto h-12 w-12 text-primary/60" />
        <h2 className="font-display mt-3 text-2xl text-heading md:text-3xl">No active duty</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted md:text-base">
          Attendance unlocks after admin assigns you a booking.
        </p>
      </div>
    );
  }

  const gpsTone =
    !gps
      ? "neutral"
      : weakGps
        ? "danger"
        : within === false && !demoForce
          ? "danger"
          : quality === "ok"
            ? "warning"
            : "success";

  return (
    <div className="space-y-3">
      {/* Current duty highlight */}
      <section className="nurse-hero overflow-hidden p-3 md:p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
              Current duty · {dutyDate}
            </p>
            <h2 className="font-display mt-1 text-2xl tracking-[-0.03em] text-heading md:text-3xl">
              {selected?.patientName || "Select a care site"}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {selected?.careType} · {selected?.shift} · {selected?.id}
            </p>
            {selected?.address ? (
              <p className="mt-1 line-clamp-2 text-sm text-muted">{selected.address}</p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Badge tone={progress.complete ? "success" : progress.morningDone ? "primary" : "warning"}>
              {statusLabel}
            </Badge>
            <Badge tone={progress.complete ? "success" : "neutral"}>
              {progress.complete ? `Salary · ${formatINR(shiftPay)}` : "Salary after evening"}
            </Badge>
          </div>
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <SlotMetric
            icon={<Sun className="h-4 w-4" />}
            title="Morning"
            status={progress.morningDone ? "Completed" : "Pending"}
            done={progress.morningDone}
            active={!progress.morningDone}
          />
          <SlotMetric
            icon={<Moon className="h-4 w-4" />}
            title="Evening"
            status={
              progress.eveningDone
                ? "Completed"
                : progress.morningDone
                  ? "Ready"
                  : "Locked"
            }
            done={progress.eveningDone}
            active={progress.morningDone && !progress.eveningDone}
          />
          <SlotMetric
            icon={<Wallet className="h-4 w-4" />}
            title="Salary"
            status={progress.complete ? formatINR(shiftPay) : "After evening"}
            done={progress.complete}
            active={false}
          />
        </div>

        <div className="mt-3">
          <div className="mb-1.5 flex justify-between text-xs text-muted">
            <span>Attendance progress</span>
            <span>{statusLabel}</span>
          </div>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4].map((n) => (
              <span
                key={n}
                className={cn(
                  "h-2 flex-1 rounded-full transition",
                  progress.complete || step >= n ? "bg-primary" : "bg-paper-2",
                )}
              />
            ))}
          </div>
          <p className="mt-1.5 text-[11px] text-muted">
            Opens 15 min early · 10 min grace · late ≤30 min · then half-day (0.5×). GPS ≤{radius}m
            + photo{needsPin ? " + site PIN" : ""}.
          </p>
        </div>
      </section>

      {queueCount > 0 ? (
        <button
          type="button"
          onClick={() => void flushQueue()}
          className="flex w-full items-center gap-3 rounded-[var(--radius-xl)] border border-[var(--danger)]/25 bg-[var(--danger-soft)] px-4 py-3 text-left text-sm text-danger transition hover:brightness-[0.98]"
        >
          <CloudOff className="h-5 w-5 shrink-0" />
          <span>
            <span className="font-semibold">{queueCount} offline present</span> waiting — tap to
            sync
          </span>
        </button>
      ) : null}

      <div className="grid gap-3 xl:grid-cols-[1.25fr_0.85fr]">
        {/* Left: workflow */}
        <div className="space-y-3">
          {/* Care site selection */}
          <section className="soft-panel rounded-[var(--radius-xl)] p-3 md:p-4">
            <div className="mb-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                Care sites
              </p>
              <h3 className="font-display mt-1 text-xl text-heading md:text-2xl">
                Select care site
              </h3>
              <p className="mt-0.5 text-sm text-muted">
                Choose the assigned duty you are checking in for.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {duties.map((d) => {
                const active = d.id === bookingId;
                const p = dutyProgress(history, d.id, dutyDate);
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setBookingId(d.id)}
                    className={cn(
                      "rounded-[var(--radius-lg)] border px-3 py-3 text-left transition",
                      active
                        ? "border-primary bg-[var(--primary-soft)] shadow-[var(--shadow-xs)] ring-2 ring-primary/20"
                        : "border-[var(--line)] bg-surface hover:border-primary/25 hover:bg-[var(--secondary)]",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-name text-base text-heading md:text-lg">{d.patientName}</p>
                        <p className="mt-1 line-clamp-2 text-sm text-muted">{d.address}</p>
                        <p className="mt-1 text-xs font-medium text-muted">{d.id}</p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <MiniBadge ok={p.morningDone} label="Morning" />
                          <MiniBadge ok={p.eveningDone} label="Evening" />
                          {d.sitePin ? (
                            <span className="rounded-full bg-paper-2 px-2 py-0.5 text-[10px] font-semibold text-muted">
                              PIN
                            </span>
                          ) : null}
                        </div>
                      </div>
                      {active ? (
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                      ) : (
                        <CircleDot className="h-5 w-5 shrink-0 text-muted/40" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {progress.complete ? (
            <section className="rounded-[var(--radius-xl)] border border-success/25 bg-[var(--success-soft)] px-4 py-6 text-center">
              <CheckCircle2 className="mx-auto h-10 w-10 text-success" />
              <p className="font-display mt-3 text-2xl text-success">Duty completed</p>
              <p className="mt-1 text-sm text-success/80">
                Morning + evening done · {formatINR(shiftPay)} earned
              </p>
            </section>
          ) : (
            <>
              {/* GPS */}
              <section className="soft-panel rounded-[var(--radius-xl)] p-3 md:p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                      Step 1 · Location
                    </p>
                    <h3 className="font-display mt-1 text-xl text-heading">GPS verification</h3>
                    <p className="mt-0.5 text-sm text-muted">
                      Confirm you are within the care-site geofence.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={refreshGps}
                    className="btn btn-primary btn-sm"
                    disabled={gpsLoading}
                  >
                    <RefreshCw className={cn("h-3.5 w-3.5", gpsLoading && "animate-spin")} />
                    {gpsLoading ? "Locating…" : "Refresh GPS"}
                  </button>
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <InfoChip
                    label="Coordinates"
                    value={gps ? `${gps.lat.toFixed(5)}, ${gps.lng.toFixed(5)}` : "Waiting…"}
                    icon={<Navigation className="h-3.5 w-3.5" />}
                  />
                  <InfoChip
                    label="Accuracy"
                    value={gps ? formatAccuracy(gps.accuracy) : "—"}
                    icon={<MapPin className="h-3.5 w-3.5" />}
                  />
                  <InfoChip
                    label="Distance from site"
                    value={distance != null ? formatDistance(distance) : "—"}
                  />
                  <InfoChip label="Geofence radius" value={`${radius} m`} />
                </div>

                {gps ? (
                  <div className="mt-3">
                    <div className="mb-1 flex justify-between text-[10px] font-semibold uppercase tracking-wide text-muted">
                      <span>Signal strength</span>
                      <span>{qualityPct(gps.accuracy)}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-paper-2">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          quality === "good"
                            ? "bg-success"
                            : quality === "ok"
                              ? "bg-primary"
                              : "bg-danger",
                        )}
                        style={{ width: `${qualityPct(gps.accuracy)}%` }}
                      />
                    </div>
                  </div>
                ) : null}

                {gpsError ? <p className="mt-3 text-sm text-danger">{gpsError}</p> : null}
                {weakGps && !demoForce ? (
                  <p className="mt-3 rounded-[var(--radius-lg)] bg-[var(--warning-soft)] px-3 py-2.5 text-sm text-[var(--warning)]">
                    Weak GPS (±{Math.round(gps?.accuracy || 0)}m). Move outdoors and refresh, or
                    enable remote/demo check-in.
                  </p>
                ) : null}

                <div
                  className={cn(
                    "mt-3 rounded-[var(--radius-lg)] px-3 py-2.5 text-sm font-semibold",
                    gpsTone === "success" && "bg-[var(--success-soft)] text-success",
                    gpsTone === "warning" && "bg-[var(--warning-soft)] text-[var(--warning)]",
                    gpsTone === "danger" && "bg-[var(--danger-soft)] text-danger",
                    gpsTone === "neutral" && "bg-paper-2 text-muted",
                  )}
                >
                  {!gps
                    ? "Waiting for GPS"
                    : demoForce
                      ? `Remote check-in ready · ${distance != null ? formatDistance(distance) : "—"} away`
                      : within
                        ? `Verified · inside geofence · ${formatDistance(distance!)} (≤${radius}m)`
                        : `Outside allowed radius · ${formatDistance(distance!)} away`}
                </div>
              </section>

              {needsPin ? (
                <section className="soft-panel rounded-[var(--radius-xl)] p-3 md:p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                    Step · Site PIN
                  </p>
                  <h3 className="font-display mt-1 text-xl text-heading">Enter care site PIN</h3>
                  <div className="mt-3 flex items-center gap-2">
                    <KeyRound className="h-5 w-5 text-primary" />
                    <input
                      className="field max-w-[14rem] tracking-[0.35em]"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      placeholder="••••"
                      value={sitePin}
                      onChange={(e) =>
                        setSitePin(e.target.value.replace(/\D/g, "").slice(0, 6))
                      }
                    />
                  </div>
                </section>
              ) : null}

              {/* Photo */}
              <section className="soft-panel rounded-[var(--radius-xl)] p-3 md:p-4">
                <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                      Step 2 · Photo
                    </p>
                    <h3 className="font-display mt-1 text-xl text-heading">
                      {nextSlot === "evening"
                        ? "Evening check-out photo"
                        : "Morning check-in photo"}
                    </h3>
                    <p className="mt-0.5 text-sm text-muted">
                      {nextSlot === "evening"
                        ? "Required for evening present and duty completion."
                        : "Required for morning present at the care site."}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--primary-soft)] px-3 py-1 text-xs font-semibold text-primary">
                    <Camera className="h-3.5 w-3.5" />
                    {photoDataUrl ? "Photo ready" : "Photo required"}
                  </span>
                </div>
                <PhotoCapture
                  ref={photoCaptureRef}
                  value={photoDataUrl}
                  onChange={setPhotoDataUrl}
                  title={
                    nextSlot === "evening"
                      ? "Capture evening check-out photo"
                      : "Capture morning check-in photo"
                  }
                  hint="Tap to open camera or choose from gallery"
                  captureMode="environment"
                />
              </section>

              {/* Actions */}
              <section className="soft-panel space-y-2 rounded-[var(--radius-xl)] p-3 md:p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                  Actions
                </p>
                <h3 className="font-display text-xl text-heading">Mark attendance</h3>
                <p className="text-sm text-muted">
                  Complete GPS, photo{needsPin ? ", and site PIN" : ""} before marking present.
                </p>

                <button
                  type="button"
                  onClick={() => setDemoForce((v) => !v)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-[var(--radius-lg)] border px-3 py-3 text-left transition",
                    demoForce
                      ? "border-primary/30 bg-[var(--primary-soft)]"
                      : "border-[var(--line)] bg-surface hover:bg-paper-2",
                  )}
                >
                  <Sparkles
                    className={cn("mt-0.5 h-5 w-5", demoForce ? "text-primary" : "text-muted")}
                  />
                  <span>
                    <span className="block text-sm font-semibold text-heading">
                      Remote / demo check-in {demoForce ? "(on)" : "(off)"}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted">
                      Use for weak GPS or remote testing. Does not change salary rules.
                    </span>
                  </span>
                </button>

                {farAway ? (
                  <button
                    type="button"
                    disabled={!gps || saving || !photoDataUrl || !nextSlot}
                    onClick={() => nextSlot && submitSlot(nextSlot, { pinCareSite: true })}
                    className="btn btn-outline w-full justify-center disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <MapPin className="h-4 w-4" />
                    Pin care site to my GPS & mark {nextSlot}
                  </button>
                ) : null}

                <div className="grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={refreshGps}
                    className="btn btn-outline w-full justify-center"
                    disabled={gpsLoading}
                  >
                    <RefreshCw className={cn("h-4 w-4", gpsLoading && "animate-spin")} />
                    Refresh GPS
                  </button>
                  <button
                    type="button"
                    onClick={() => photoCaptureRef.current?.open()}
                    className="btn btn-outline w-full justify-center"
                  >
                    <Camera className="h-4 w-4" />
                    {photoDataUrl ? "Retake attendance photo" : "Capture attendance photo"}
                  </button>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => submitSlot("morning")}
                    disabled={!canMarkMorning}
                    title={morningReason || undefined}
                    className={cn(
                      "btn w-full justify-center !py-3 disabled:cursor-not-allowed disabled:opacity-50",
                      nextSlot === "morning" ? "btn-primary" : "btn-outline",
                    )}
                  >
                    <Sun className="h-4 w-4" />
                    {saving && nextSlot === "morning" ? "Saving…" : "Mark morning present"}
                  </button>
                  <button
                    type="button"
                    onClick={() => submitSlot("evening")}
                    disabled={!canMarkEvening}
                    title={eveningReason || undefined}
                    className={cn(
                      "btn w-full justify-center !py-3 disabled:cursor-not-allowed disabled:opacity-50",
                      nextSlot === "evening" ? "btn-primary" : "btn-outline",
                    )}
                  >
                    <Moon className="h-4 w-4" />
                    {saving && nextSlot === "evening" ? "Saving…" : "Mark evening present"}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => submitSlot("evening")}
                  disabled={!canCompleteDuty}
                  title={completeReason || undefined}
                  className="btn btn-primary w-full justify-center !py-3 text-base disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Flag className="h-4 w-4" />
                  {saving && nextSlot === "evening" ? "Saving…" : "Complete duty"}
                </button>

                {actionHint ? (
                  <p className="rounded-[var(--radius-lg)] bg-paper-2 px-3 py-2 text-sm text-muted">
                    {actionHint}
                  </p>
                ) : null}

                {!canMarkMorning && morningReason && nextSlot !== "morning" ? (
                  <p className="text-xs text-muted">Morning: {morningReason}</p>
                ) : null}
                {!canMarkEvening && eveningReason && nextSlot !== "evening" ? (
                  <p className="text-xs text-muted">Evening / complete: {eveningReason}</p>
                ) : null}
              </section>
            </>
          )}

          {error ? (
            <p className="rounded-[var(--radius-xl)] bg-[var(--danger-soft)] px-4 py-3 text-sm text-danger">
              {error}
            </p>
          ) : null}
          {message ? (
            <p className="rounded-[var(--radius-xl)] bg-[var(--success-soft)] px-4 py-3 text-sm text-success">
              {message}
            </p>
          ) : null}
        </div>

        {/* Right: history */}
        <aside className="soft-panel h-fit rounded-[var(--radius-xl)] p-3 md:p-4 xl:sticky xl:top-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                Timeline
              </p>
              <h3 className="font-display mt-1 text-xl text-heading md:text-2xl">
                Attendance history
              </h3>
              <p className="mt-0.5 text-sm text-muted">Morning and evening check-ins</p>
            </div>
            <Badge tone="neutral">{filteredHistory.length}</Badge>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {(
              [
                ["all", "All"],
                ["morning", "Morning"],
                ["evening", "Evening"],
                ["week", "This week"],
                ["month", "This month"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setHistoryFilter(key);
                  resetHistPage();
                }}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                  historyFilter === key
                    ? "bg-primary text-[var(--sidebar-fg)]"
                    : "bg-paper-2 text-heading hover:bg-[var(--secondary)]",
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-3 space-y-2">
            {filteredHistory.length === 0 ? (
              <div className="rounded-[var(--radius-lg)] bg-paper-2 px-4 py-8 text-center text-sm text-muted">
                No attendance records for this filter.
              </div>
            ) : (
              <>
              {histRows.map((a) => {
                const slot = slotLabel(a.type);
                return (
                  <article
                    key={a.id}
                    className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--line)] bg-surface shadow-[var(--shadow-xs)]"
                  >
                    <div className="flex gap-0">
                      {a.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={a.photoUrl}
                          alt=""
                          className="h-24 w-20 shrink-0 object-cover sm:h-28 sm:w-24"
                        />
                      ) : (
                        <div className="grid h-24 w-20 shrink-0 place-items-center bg-paper-2 sm:h-28 sm:w-24">
                          <Camera className="h-5 w-5 text-muted" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1 p-2.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                              slot === "morning"
                                ? "bg-[var(--primary-soft)] text-primary"
                                : "bg-[var(--success-soft)] text-success",
                            )}
                          >
                            {slot === "morning" ? (
                              <Sun className="h-3 w-3" />
                            ) : (
                              <Moon className="h-3 w-3" />
                            )}
                            {slot}
                          </span>
                          {a.punctualityStatus ? (
                            <Badge
                              tone={
                                a.punctualityStatus === "present"
                                  ? "success"
                                  : a.punctualityStatus === "late"
                                    ? "warning"
                                    : "danger"
                              }
                            >
                              {a.punctualityStatus}
                              {a.minutesLate ? ` · ${a.minutesLate}m` : ""}
                            </Badge>
                          ) : null}
                          <Badge tone={a.withinGeofence ? "success" : "warning"}>
                            {a.withinGeofence ? "On site" : "Outside"}
                          </Badge>
                          {a.gpsQuality === "weak" ? (
                            <Badge tone="danger">Weak GPS</Badge>
                          ) : null}
                        </div>
                        <p className="mt-1.5 text-sm font-semibold text-heading">{a.bookingId}</p>
                        <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted">
                          <Clock3 className="h-3 w-3" />
                          {formatDateTime(a.createdAt)}
                        </p>
                        <p className="mt-0.5 text-xs text-muted">
                          {formatDistance(a.distanceMeters)} · {a.lat.toFixed(4)}, {a.lng.toFixed(4)}
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })}
              <Pagination
                page={histPage}
                pageCount={histPageCount}
                pageSize={histPageSize}
                total={history.length}
                filteredCount={filteredHistory.length}
                onPageChange={setHistPage}
                onPageSizeChange={setHistPageSize}
                pageSizeOptions={[5, 10, 20]}
                noun="marks"
                className="!border-t-0 !pt-2"
              />
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function SlotMetric({
  icon,
  title,
  status,
  done,
  active,
}: {
  icon: React.ReactNode;
  title: string;
  status: string;
  done: boolean;
  active: boolean;
}) {
  return (
    <div
      className={cn(
        "nurse-hero-chip",
        done && "border-success/30 bg-[var(--success-soft)]",
        active && !done && "border-primary/35 bg-[var(--primary-soft)]",
      )}
    >
      <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
        {icon}
        {title}
      </p>
      <p className="mt-1 text-base font-semibold text-heading">{status}</p>
    </div>
  );
}

function MiniBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[10px] font-semibold",
        ok ? "bg-[var(--success-soft)] text-success" : "bg-paper-2 text-muted",
      )}
    >
      {label} {ok ? "✓" : "–"}
    </span>
  );
}

function InfoChip({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--line)] bg-paper-2/60 px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-heading">
        {icon}
        {value}
      </p>
    </div>
  );
}
