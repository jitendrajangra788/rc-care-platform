"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  addDays,
  addMonths,
  addWeeks,
  format,
  parseISO,
  startOfWeek,
  subDays,
  subMonths,
  subWeeks,
} from "date-fns";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { RefreshCw } from "lucide-react";
import type { Booking, LeaveRequest, NurseAvailability, Staff } from "@/lib/types";
import {
  bookingsForDay,
  calendarRange,
  dailyWorkload,
  nurseStatusOnDay,
  resolveShiftTimes,
  todayISO,
} from "@/lib/schedule";
import { formatDate } from "@/lib/format";
import { toast } from "@/components/ui/toast";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Drawer } from "@/components/ui/Drawer";
import { ScheduleKpis } from "@/components/dashboard/schedule/ScheduleKpis";
import {
  ScheduleFiltersForm,
  ScheduleToolbar,
} from "@/components/dashboard/schedule/ScheduleToolbar";
import { RosterView } from "@/components/dashboard/schedule/RosterView";
import { UnassignedTray } from "@/components/dashboard/schedule/UnassignedTray";
import { DayTimelineView } from "@/components/dashboard/schedule/DayTimelineView";
import { MonthHeatmap } from "@/components/dashboard/schedule/MonthHeatmap";
import { WeekColumnsView } from "@/components/dashboard/schedule/WeekColumnsView";
import { DutyDrawer } from "@/components/dashboard/schedule/DutyDrawer";
import { ScheduleSidePanel } from "@/components/dashboard/schedule/ScheduleSidePanel";
import { MobileDayList } from "@/components/dashboard/schedule/MobileDayList";
import { DutyBlock } from "@/components/dashboard/schedule/DutyBlock";
import type { ScheduleMode, SidePanelTab, StatusFilter } from "@/components/dashboard/schedule/types";
import {
  countDayConflicts,
  filterBookings,
  parseBookingDragId,
  parseCellDropId,
  shortPatientName,
} from "@/components/dashboard/schedule/utils";

export function ScheduleWorkspace({
  bookings,
  staff,
  leaves,
  availability,
  initialDate,
}: {
  bookings: Booking[];
  staff: Staff[];
  leaves: LeaveRequest[];
  availability: NurseAvailability[];
  initialDate?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [mode, setMode] = useState<ScheduleMode>("roster");
  const [anchor, setAnchor] = useState(() =>
    parseISO((initialDate || todayISO()) + "T12:00:00"),
  );
  const [nurseFilter, setNurseFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");
  const [unassignedOnly, setUnassignedOnly] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedDay, setSelectedDay] = useState(initialDate || todayISO());
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sideTab, setSideTab] = useState<SidePanelTab>("duties");
  const [assignStaffId, setAssignStaffId] = useState("");
  const [shiftKind, setShiftKind] = useState<Booking["shift"]>("12hr");
  const [shiftStart, setShiftStart] = useState("08:00");
  const [shiftEnd, setShiftEnd] = useState("20:00");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmUnassign, setConfirmUnassign] = useState(false);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const asOf = todayISO();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const selectedBooking = useMemo(
    () => bookings.find((b) => b.id === selectedBookingId) || null,
    [bookings, selectedBookingId],
  );

  const filteredBookings = useMemo(
    () =>
      filterBookings(bookings, staff, {
        query,
        nurseFilter,
        statusFilter,
        unassignedOnly,
      }),
    [bookings, staff, query, nurseFilter, statusFilter, unassignedOnly],
  );

  const weekDays = useMemo(() => {
    if (mode === "roster") {
      const start = startOfWeek(anchor, { weekStartsOn: 1 });
      return Array.from({ length: 7 }, (_, i) => addDays(start, i));
    }
    if (mode === "day") return [anchor];
    if (mode === "week") {
      const start = startOfWeek(anchor, { weekStartsOn: 1 });
      return Array.from({ length: 7 }, (_, i) => addDays(start, i));
    }
    return calendarRange("month", anchor).days;
  }, [anchor, mode]);

  const dayBookings = useMemo(
    () => bookingsForDay(filteredBookings, selectedDay, asOf).filter((b) => b.status !== "cancelled"),
    [filteredBookings, selectedDay, asOf],
  );

  const workload = dailyWorkload(filteredBookings, selectedDay, asOf);

  const { onDutyNurses, availableNurses } = useMemo(() => {
    let onDuty = 0;
    let available = 0;
    for (const s of staff) {
      const st = nurseStatusOnDay({
        staff: s,
        day: selectedDay,
        bookings,
        leaves,
        availability,
        asOf,
      }).status;
      if (st === "on-duty") onDuty += 1;
      else if (st === "available") available += 1;
    }
    return { onDutyNurses: onDuty, availableNurses: available };
  }, [staff, selectedDay, bookings, leaves, availability, asOf]);

  const conflictCount = useMemo(
    () => countDayConflicts(dayBookings, bookings, leaves, availability, asOf),
    [dayBookings, bookings, leaves, availability, asOf],
  );

  const activeDragBooking = useMemo(() => {
    if (!activeDragId) return null;
    const id = parseBookingDragId(activeDragId);
    return id ? bookings.find((b) => b.id === id) || null : null;
  }, [activeDragId, bookings]);

  function shiftLabel() {
    if (mode === "month") return format(anchor, "MMMM yyyy");
    if (mode === "roster" || mode === "week") {
      const start = startOfWeek(anchor, { weekStartsOn: 1 });
      const end = addDays(start, 6);
      return `${format(start, "d MMM")} – ${format(end, "d MMM yyyy")}`;
    }
    return format(anchor, "d MMM yyyy");
  }

  function goPrev() {
    const next =
      mode === "day"
        ? subDays(anchor, 1)
        : mode === "month"
          ? subMonths(anchor, 1)
          : subWeeks(anchor, 1);
    setAnchor(next);
    if (mode === "day") setSelectedDay(format(next, "yyyy-MM-dd"));
  }
  function goNext() {
    const next =
      mode === "day"
        ? addDays(anchor, 1)
        : mode === "month"
          ? addMonths(anchor, 1)
          : addWeeks(anchor, 1);
    setAnchor(next);
    if (mode === "day") setSelectedDay(format(next, "yyyy-MM-dd"));
  }
  function goToday() {
    const t = parseISO(todayISO() + "T12:00:00");
    setAnchor(t);
    setSelectedDay(todayISO());
  }

  function openBooking(b: Booking) {
    setSelectedBookingId(b.id);
    setAssignStaffId(b.assignedStaffId || "");
    setShiftKind(b.shift);
    const times = resolveShiftTimes(b);
    setShiftStart(times.start);
    setShiftEnd(times.end);
    setError("");
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
  }

  async function postSchedule(body: Record<string, unknown>) {
    const res = await fetch("/api/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, data };
  }

  async function saveAssign(action: "assign" | "reassign" | "updateShift") {
    if (!selectedBooking) return;
    setSaving(true);
    setError("");
    const { ok, data } = await postSchedule({
      action,
      bookingId: selectedBooking.id,
      staffId: assignStaffId || undefined,
      clearStaff: !assignStaffId,
      shift: shiftKind,
      shiftStartTime: shiftStart,
      shiftEndTime: shiftEnd,
      status:
        assignStaffId && selectedBooking.status === "pending" ? "assigned" : undefined,
    });
    setSaving(false);
    if (!ok) {
      setError(data.error || "Save failed");
      toast.error("Schedule conflict", data.error || "Could not assign");
      startTransition(() => router.refresh());
      return;
    }
    toast.success(
      action === "reassign" ? "Duty reassigned" : "Schedule saved",
      selectedBooking.id,
    );
    startTransition(() => router.refresh());
  }

  async function confirmUnassignAction() {
    if (!selectedBooking) return;
    setSaving(true);
    setError("");
    const { ok, data } = await postSchedule({
      action: "reassign",
      bookingId: selectedBooking.id,
      clearStaff: true,
      staffId: undefined,
    });
    setSaving(false);
    setConfirmUnassign(false);
    if (!ok) {
      setError(data.error || "Unassign failed");
      toast.error("Unassign failed", data.error || "Could not unassign");
      startTransition(() => router.refresh());
      return;
    }
    setAssignStaffId("");
    toast.success("Duty unassigned", selectedBooking.id);
    startTransition(() => router.refresh());
  }

  async function smartReplace(staffId: string) {
    if (!selectedBooking) return;
    setAssignStaffId(staffId);
    setSaving(true);
    setError("");
    const { ok, data } = await postSchedule({
      action: selectedBooking.assignedStaffId ? "reassign" : "assign",
      bookingId: selectedBooking.id,
      staffId,
      shift: shiftKind,
      shiftStartTime: shiftStart,
      shiftEndTime: shiftEnd,
      status: selectedBooking.status === "pending" ? "assigned" : undefined,
    });
    setSaving(false);
    if (!ok) {
      setError(data.error || "Replace failed");
      toast.error("Schedule conflict", data.error || "Could not reassign");
      startTransition(() => router.refresh());
      return;
    }
    toast.success("Duty reassigned", shortPatientName(selectedBooking.patientName));
    startTransition(() => router.refresh());
  }

  async function markAvailability(
    staffId: string,
    date: string,
    status: NurseAvailability["status"],
  ) {
    const { ok, data } = await postSchedule({
      action: "setAvailability",
      availability: { staffId, date, status },
    });
    if (!ok) {
      toast.error("Availability failed", data.error);
      return;
    }
    toast.success("Availability updated", `${status} · ${formatDate(date + "T12:00:00")}`);
    startTransition(() => router.refresh());
  }

  async function assignViaDrop(bookingId: string, staffId: string, _dayIso: string) {
    void _dayIso;
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) return;
    const action = booking.assignedStaffId ? "reassign" : "assign";
    const { ok, data } = await postSchedule({
      action,
      bookingId,
      staffId,
      status: booking.status === "pending" ? "assigned" : undefined,
    });
    if (!ok) {
      toast.error("Schedule conflict", data.error || "Could not assign");
      startTransition(() => router.refresh());
      return;
    }
    toast.success(action === "reassign" ? "Duty reassigned" : "Duty assigned", bookingId);
    startTransition(() => router.refresh());
  }

  function onDragStart(event: DragStartEvent) {
    setActiveDragId(String(event.active.id));
  }

  function onDragEnd(event: DragEndEvent) {
    setActiveDragId(null);
    const bookingId = parseBookingDragId(String(event.active.id));
    if (!bookingId || !event.over) return;
    const cell = parseCellDropId(String(event.over.id));
    if (!cell) return;
    void assignViaDrop(bookingId, cell.staffId, cell.day);
  }

  return (
    <div className="dash-stack !gap-1.5 md:!gap-2">
      <PageHeader
        eyebrow="Scheduling"
        title="Duty calendar"
        subtitle="Assign, replace, and spot conflicts."
        action={
          <div className="flex flex-wrap gap-1.5">
            <Button type="button" variant="secondary" size="sm" onClick={goToday}>
              Today
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              loading={pending}
              onClick={() => startTransition(() => router.refresh())}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Link
              href="/dashboard/admin/bookings"
              className="btn btn-primary btn-sm inline-flex items-center focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]"
            >
              + Duty
            </Link>
          </div>
        }
      />

      <ScheduleKpis
        total={workload.total}
        assigned={workload.assigned}
        unassigned={workload.unassigned}
        onDutyNurses={onDutyNurses}
        availableNurses={availableNurses}
        conflicts={conflictCount}
        byShift={workload.byShift}
        onUnassignedClick={() => {
          setStatusFilter("unassigned");
          setUnassignedOnly(true);
        }}
      />

      <div className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_18.5rem] lg:items-start">
        <section className="soft-panel space-y-1.5 p-1.5 sm:p-2 md:p-2.5">
          <ScheduleToolbar
            mode={mode}
            onModeChange={(m) => {
              setMode(m);
              if (m === "day") setAnchor(parseISO(selectedDay + "T12:00:00"));
            }}
            anchorLabel={shiftLabel()}
            selectedDay={selectedDay}
            onPrev={goPrev}
            onNext={goNext}
            query={query}
            onQueryChange={setQuery}
            nurseFilter={nurseFilter}
            onNurseFilterChange={setNurseFilter}
            statusFilter={statusFilter}
            onStatusFilterChange={(v) => {
              setStatusFilter(v);
              if (v === "unassigned") setUnassignedOnly(true);
              else if (unassignedOnly && v !== "") setUnassignedOnly(false);
            }}
            unassignedOnly={unassignedOnly}
            onUnassignedOnlyChange={(v) => {
              setUnassignedOnly(v);
              if (v) setStatusFilter("unassigned");
              else if (statusFilter === "unassigned") setStatusFilter("");
            }}
            staff={staff}
            onOpenMobileFilters={() => setFiltersOpen(true)}
          />

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDragCancel={() => setActiveDragId(null)}
          >
            {mode === "roster" ? (
              <div className="mb-1 hidden md:block">
                <UnassignedTray
                  bookings={filteredBookings}
                  allBookings={bookings}
                  leaves={leaves}
                  availability={availability}
                  asOf={asOf}
                  onOpen={openBooking}
                />
              </div>
            ) : null}

            <div className="hidden md:block">
              {mode === "roster" ? (
                <RosterView
                  staff={staff}
                  weekDays={weekDays}
                  bookings={bookings}
                  filteredBookings={filteredBookings}
                  leaves={leaves}
                  availability={availability}
                  asOf={asOf}
                  nurseFilter={nurseFilter}
                  onOpen={openBooking}
                />
              ) : mode === "day" ? (
                <DayTimelineView
                  staff={staff}
                  day={selectedDay}
                  bookings={bookings}
                  filteredBookings={filteredBookings}
                  leaves={leaves}
                  availability={availability}
                  asOf={asOf}
                  nurseFilter={nurseFilter}
                  onOpen={openBooking}
                />
              ) : mode === "month" ? (
                <MonthHeatmap
                  days={weekDays}
                  anchor={anchor}
                  selectedDay={selectedDay}
                  filteredBookings={filteredBookings}
                  asOf={asOf}
                  onSelectDay={(iso, date) => {
                    setSelectedDay(iso);
                    setAnchor(date);
                    setMode("day");
                  }}
                />
              ) : (
                <WeekColumnsView
                  weekDays={weekDays}
                  selectedDay={selectedDay}
                  filteredBookings={filteredBookings}
                  bookings={bookings}
                  leaves={leaves}
                  availability={availability}
                  staff={staff}
                  asOf={asOf}
                  onSelectDay={setSelectedDay}
                  onOpen={openBooking}
                />
              )}
            </div>

            <DragOverlay>
              {activeDragBooking ? (
                <div className="w-40 opacity-95 shadow-lg">
                  <DutyBlock
                    booking={activeDragBooking}
                    bookings={bookings}
                    leaves={leaves}
                    availability={availability}
                    asOf={asOf}
                    draggable={false}
                  />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>

          <MobileDayList
            selectedDay={selectedDay}
            dayBookings={dayBookings}
            staff={staff}
            onOpen={openBooking}
            onPrev={goPrev}
            onNext={goNext}
            onToday={goToday}
          />
        </section>

        <div className="hidden lg:block">
          <ScheduleSidePanel
            tab={sideTab}
            onTabChange={setSideTab}
            selectedDay={selectedDay}
            dayBookings={dayBookings}
            staff={staff}
            bookings={bookings}
            leaves={leaves}
            availability={availability}
            asOf={asOf}
            pending={pending}
            nurseFilter={nurseFilter}
            onOpen={openBooking}
            onMarkAvailability={markAvailability}
          />
        </div>
      </div>

      {/* Phone: availability only (duties already in MobileDayList) */}
      <div className="lg:hidden">
        <ScheduleSidePanel
          tab="availability"
          onTabChange={setSideTab}
          selectedDay={selectedDay}
          dayBookings={dayBookings}
          staff={staff}
          bookings={bookings}
          leaves={leaves}
          availability={availability}
          asOf={asOf}
          pending={pending}
          nurseFilter={nurseFilter}
          onOpen={openBooking}
          onMarkAvailability={markAvailability}
          compact
          mobileAvailabilityOnly
        />
      </div>

      <DutyDrawer
        open={drawerOpen}
        booking={selectedBooking}
        staff={staff}
        bookings={bookings}
        leaves={leaves}
        availability={availability}
        asOf={asOf}
        assignStaffId={assignStaffId}
        setAssignStaffId={setAssignStaffId}
        shiftKind={shiftKind}
        setShiftKind={setShiftKind}
        shiftStart={shiftStart}
        setShiftStart={setShiftStart}
        shiftEnd={shiftEnd}
        setShiftEnd={setShiftEnd}
        saving={saving}
        error={error}
        onClose={closeDrawer}
        onSave={saveAssign}
        onUnassignRequest={() => setConfirmUnassign(true)}
        onSmartReplace={smartReplace}
      />

      <Drawer
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Filters"
        description="Narrow duties by nurse, status, or search."
      >
        <ScheduleFiltersForm
          query={query}
          onQueryChange={setQuery}
          nurseFilter={nurseFilter}
          onNurseFilterChange={setNurseFilter}
          statusFilter={statusFilter}
          onStatusFilterChange={(v) => {
            setStatusFilter(v);
            if (v === "unassigned") setUnassignedOnly(true);
          }}
          unassignedOnly={unassignedOnly}
          onUnassignedOnlyChange={(v) => {
            setUnassignedOnly(v);
            if (v) setStatusFilter("unassigned");
            else if (statusFilter === "unassigned") setStatusFilter("");
          }}
          staff={staff}
        />
        <div className="mt-6">
          <Button type="button" className="w-full" onClick={() => setFiltersOpen(false)}>
            Apply filters
          </Button>
        </div>
      </Drawer>

      <ConfirmDialog
        open={confirmUnassign}
        title="Unassign nurse?"
        description={
          selectedBooking
            ? `${selectedBooking.patientName} will move back to the unassigned tray.`
            : undefined
        }
        confirmLabel="Unassign"
        tone="danger"
        busy={saving}
        onConfirm={() => void confirmUnassignAction()}
        onCancel={() => setConfirmUnassign(false)}
      />
    </div>
  );
}
