"use client";

import { Download, FileSpreadsheet, Printer } from "lucide-react";
import type { Attendance, Booking, Staff } from "@/lib/types";
import { Button } from "@/components/ui/Button";

export function AttendanceExportBar({
  attendance,
  staff,
  bookings,
}: {
  attendance: Attendance[];
  staff: Staff[];
  bookings: Booking[];
}) {
  function rows() {
    return attendance.map((a) => {
      const member = staff.find((s) => s.id === a.staffId);
      const booking = bookings.find((b) => b.id === a.bookingId);
      return {
        id: a.id,
        date: a.dutyDate || a.createdAt.slice(0, 10),
        type: a.type,
        staff: member?.name || a.staffId,
        patient: booking?.patientName || a.bookingId,
        bookingId: a.bookingId,
        lat: a.lat,
        lng: a.lng,
        distance: a.distanceMeters,
        geofence: a.withinGeofence ? "yes" : "no",
        gps: a.gpsQuality || "",
        desk: a.markedByAdmin ? "yes" : "no",
        time: new Date(a.createdAt).toLocaleString("en-IN"),
      };
    });
  }

  function exportCsv() {
    const data = rows();
    const headers = [
      "id",
      "date",
      "type",
      "staff",
      "patient",
      "bookingId",
      "lat",
      "lng",
      "distance",
      "geofence",
      "gps",
      "desk",
      "time",
    ];
    const lines = [
      headers.join(","),
      ...data.map((r) =>
        headers
          .map((h) => {
            const v = String((r as Record<string, unknown>)[h] ?? "");
            return `"${v.replace(/"/g, '""')}"`;
          })
          .join(","),
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportPdfPrint() {
    const data = rows();
    const html = `<!doctype html><html><head><title>Attendance Report</title>
      <style>
        body{font-family:system-ui,sans-serif;padding:24px;color:#102538}
        h1{font-size:22px;margin:0 0 8px}
        p{color:#667;margin:0 0 16px;font-size:13px}
        table{width:100%;border-collapse:collapse;font-size:12px}
        th,td{border:1px solid #dde3ea;padding:8px;text-align:left}
        th{background:#f3f6f8}
      </style></head><body>
      <h1>Roshan Care — Attendance Report</h1>
      <p>Generated ${new Date().toLocaleString("en-IN")} · ${data.length} records</p>
      <table><thead><tr>
        <th>Date</th><th>Slot</th><th>Staff</th><th>Patient</th><th>Distance</th><th>Geofence</th><th>Time</th>
      </tr></thead><tbody>
      ${data
        .map(
          (r) => `<tr>
          <td>${r.date}</td><td>${r.type}</td><td>${r.staff}</td><td>${r.patient}</td>
          <td>${r.distance}m</td><td>${r.geofence}</td><td>${r.time}</td>
        </tr>`,
        )
        .join("")}
      </tbody></table>
      <script>window.onload=()=>window.print()</script>
      </body></html>`;
    const w = window.open("", "_blank", "noopener,noreferrer");
    if (!w) return;
    w.document.write(html);
    w.document.close();
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant="outline" onClick={exportCsv}>
        <FileSpreadsheet className="h-3.5 w-3.5" /> Export Excel (CSV)
      </Button>
      <Button size="sm" variant="outline" onClick={exportPdfPrint}>
        <Printer className="h-3.5 w-3.5" /> Export PDF
      </Button>
      <a href="/dashboard/admin/attendance/report" className="btn btn-outline btn-sm">
        <Download className="h-3.5 w-3.5" /> Full report
      </a>
    </div>
  );
}
