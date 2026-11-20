import assert from "node:assert/strict";
import { seedDb } from "../src/lib/seed";
import { nurseView, redactNurseBooking } from "../src/lib/scope";
import type { Booking, SessionUser } from "../src/lib/types";

const sample = {
  id: "BK-9",
  patientName: "Suresh Chandra",
  phone: "9876543210",
  careType: "Elderly care",
  shift: "12hr",
  address: "12 Civil Lines, Bhilwara",
  area: "Civil Lines",
  startDate: "2026-11-20",
  notes: "Call Suresh Chandra on 9876543210. Morning insulin after breakfast.",
  status: "active",
  amount: 1800,
  createdAt: "2026-11-20T00:00:00.000Z",
  guardianName: "Rita Jain",
  familyUserId: "u-family",
  upiId: "care@upi",
  staffPayPerShift: 700,
} satisfies Booking;

const safe = redactNurseBooking(sample);
assert.equal(safe.patientName, "Duty BK-9");
assert.equal(safe.phone, "");
assert.equal(safe.amount, 0);
assert.equal(safe.guardianName, undefined);
assert.equal(safe.familyUserId, undefined);
assert.equal(safe.upiId, undefined);
assert.equal(safe.address, sample.address);
assert.match(safe.notes || "", /insulin/);
assert.doesNotMatch(safe.notes || "", /Suresh|9876543210/);

const nurse: SessionUser = {
  id: "u-nurse",
  name: "Priya Sharma",
  email: "nurse@roshancare.in",
  role: "nurse",
  phone: "+91 9876500011",
};
const view = nurseView(structuredClone(seedDb), nurse);
assert.ok(view.bookings.length > 0);
assert.ok(view.bookings.every((b) => b.patientName.startsWith("Duty ") && b.phone === "" && b.amount === 0));
assert.ok(view.patients.every((p) => p.phone === "" && p.familyUserIds.length === 0));
assert.equal(JSON.stringify(view.bookings).includes("Suresh"), false);
assert.equal(JSON.stringify(view.patients).includes("Suresh"), false);
assert.equal(view.invoices.length, 0);
assert.equal(view.doctorNotes.length, 0);
assert.ok(view.staff.length <= 1);
assert.equal(view.users.every((u) => u.password === ""), true);

const admin: SessionUser = {
  id: "u-admin",
  name: "Admin",
  email: "admin@roshancare.in",
  role: "admin",
  phone: "",
};
assert.equal(nurseView(seedDb, admin), seedDb);

console.log("privacy-ok");
