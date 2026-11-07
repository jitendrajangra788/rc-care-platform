"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { Booking } from "@/lib/types";
import { resolveShiftTimes } from "@/lib/schedule";
import { cn } from "@/lib/utils";
import {
  bookingDragId,
  dutyHasConflict,
  shiftBlockClass,
  shortPatientName,
  statusDotClass,
} from "./utils";
import type { LeaveRequest, NurseAvailability } from "@/lib/types";

export function DutyBlock({
  booking,
  bookings,
  leaves,
  availability,
  asOf,
  onClick,
  compact = false,
  draggable = true,
}: {
  booking: Booking;
  bookings: Booking[];
  leaves: LeaveRequest[];
  availability: NurseAvailability[];
  asOf: string;
  onClick?: () => void;
  compact?: boolean;
  draggable?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: bookingDragId(booking.id),
    data: { booking },
    disabled: !draggable,
  });
  const times = resolveShiftTimes(booking);
  const conflict = dutyHasConflict(booking, bookings, leaves, availability, asOf);
  const style = transform
    ? { transform: CSS.Translate.toString(transform), zIndex: 40 as number }
    : undefined;

  return (
    <button
      ref={setNodeRef}
      type="button"
      style={style}
      {...(draggable ? { ...listeners, ...attributes } : {})}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      title={`${booking.id} · ${booking.patientName} · ${booking.address}`}
      className={cn(
        "w-full rounded-[var(--radius-md)] border px-1.5 py-1 text-left text-[10px] leading-tight transition focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]",
        shiftBlockClass(booking),
        conflict && "border-[var(--danger)] ring-1 ring-[var(--danger)]",
        isDragging && "opacity-60 shadow-md",
        compact ? "min-h-[2rem]" : "min-h-[2.5rem]",
      )}
    >
      <span className="flex items-center gap-1 font-semibold">
        <span
          className={cn("h-1.5 w-1.5 shrink-0 rounded-full", statusDotClass(booking.status))}
          aria-hidden
        />
        <span className="truncate">
          {times.start}–{times.end}
        </span>
      </span>
      <span className="mt-0.5 block truncate font-medium">
        {shortPatientName(booking.patientName, compact ? 10 : 16)}
      </span>
    </button>
  );
}
