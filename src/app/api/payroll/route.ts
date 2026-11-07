import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { pushActivity } from "@/lib/activity";
import { readDb, writeDb } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = await readDb();
  if (session.role === "admin") {
    return NextResponse.json({
      payouts: db.salaryPayouts || [],
      staff: db.staff.map((s) => ({
        id: s.id,
        name: s.name,
        role: s.role,
        salaryMonthly: s.salaryMonthly || 0,
        salaryPerShift: s.salaryPerShift || 0,
        shiftsCompleted: s.shiftsCompleted,
      })),
    });
  }

  if (session.role === "nurse") {
    const staff = db.staff.find((s) => s.userId === session.id || s.name === session.name);
    return NextResponse.json({
      payouts: (db.salaryPayouts || []).filter((p) => p.staffId === staff?.id),
      staff: staff
        ? [
            {
              id: staff.id,
              name: staff.name,
              role: staff.role,
              salaryMonthly: staff.salaryMonthly || 0,
              salaryPerShift: staff.salaryPerShift || 0,
              shiftsCompleted: staff.shiftsCompleted,
            },
          ]
        : [],
    });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as { id?: string; status?: "earned" | "paid" };
  if (!body.id || !body.status) {
    return NextResponse.json({ error: "id and status required" }, { status: 400 });
  }

  const db = await readDb();
  if (!db.salaryPayouts) db.salaryPayouts = [];
  const idx = db.salaryPayouts.findIndex((p) => p.id === body.id);
  if (idx < 0) return NextResponse.json({ error: "Payout not found" }, { status: 404 });

  db.salaryPayouts[idx] = { ...db.salaryPayouts[idx], status: body.status };
  pushActivity(db, {
    kind: "billing",
    title: `Salary ${body.status} · ${db.salaryPayouts[idx].patientName}`,
    detail: `₹${db.salaryPayouts[idx].amount} · ${db.salaryPayouts[idx].dutyDate}`,
    href: "/dashboard/admin/payroll",
    actorId: session.id,
    actorName: session.name,
  });
  await writeDb(db);
  return NextResponse.json({ payout: db.salaryPayouts[idx] });
}
