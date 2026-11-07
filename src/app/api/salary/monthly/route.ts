import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { pushActivity } from "@/lib/activity";
import { readDb, writeDb } from "@/lib/db";
import { buildMonthlySalary } from "@/lib/salary-month";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const month = Number(searchParams.get("month") || new Date().getMonth() + 1);
  const year = Number(searchParams.get("year") || new Date().getFullYear());

  const db = await readDb();
  let rows = (db.monthlySalaries || []).filter((s) => s.month === month && s.year === year);

  if (session.role === "nurse") {
    const staff = db.staff.find((s) => s.userId === session.id || s.name === session.name);
    rows = rows.filter((r) => r.staffId === staff?.id);
  } else if (session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    month,
    year,
    salaries: rows,
    staff: db.staff.map((s) => ({
      id: s.id,
      name: s.name,
      role: s.role,
      salaryMonthly: s.salaryMonthly || 0,
    })),
  });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    month?: number;
    year?: number;
    staffId?: string;
    deductions?: number;
    bonus?: number;
  };
  const month = body.month || new Date().getMonth() + 1;
  const year = body.year || new Date().getFullYear();

  const db = await readDb();
  if (!db.monthlySalaries) db.monthlySalaries = [];

  const targets = body.staffId
    ? db.staff.filter((s) => s.id === body.staffId)
    : db.staff.filter((s) => s.status !== "leave");

  const created = [];
  for (const staff of targets) {
    const existing = db.monthlySalaries.findIndex(
      (s) => s.staffId === staff.id && s.month === month && s.year === year,
    );
    const built = buildMonthlySalary(staff, db.attendance, year, month, {
      deductions: body.deductions,
      bonus: body.bonus,
    });
    if (existing >= 0 && db.monthlySalaries[existing].status === "paid") {
      continue;
    }
    const row = {
      ...built,
      id: existing >= 0 ? db.monthlySalaries[existing].id : `sal-${staff.id}-${year}-${month}`,
      createdAt:
        existing >= 0 ? db.monthlySalaries[existing].createdAt : new Date().toISOString(),
      status: (existing >= 0 ? db.monthlySalaries[existing].status : "pending") as
        | "pending"
        | "paid",
    };
    if (existing >= 0) db.monthlySalaries[existing] = row;
    else db.monthlySalaries.unshift(row);
    created.push(row);
  }

  pushActivity(db, {
    kind: "billing",
    title: `Monthly salary processed · ${month}/${year}`,
    detail: `${created.length} staff records`,
    href: "/dashboard/admin/payroll",
    actorId: session.id,
    actorName: session.name,
  });
  await writeDb(db);
  return NextResponse.json({ salaries: created, month, year });
}

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    id?: string;
    status?: "pending" | "paid";
    deductions?: number;
    bonus?: number;
  };
  if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const db = await readDb();
  const idx = (db.monthlySalaries || []).findIndex((s) => s.id === body.id);
  if (idx < 0) return NextResponse.json({ error: "Salary record not found" }, { status: 404 });

  const cur = db.monthlySalaries[idx];
  const deductions = body.deductions != null ? Number(body.deductions) : cur.deductions;
  const bonus = body.bonus != null ? Number(body.bonus) : cur.bonus;
  const net = Math.max(0, Math.round((cur.basicSalary - deductions + bonus) * 100) / 100);

  db.monthlySalaries[idx] = {
    ...cur,
    deductions,
    bonus,
    netSalary: net,
    status: body.status || cur.status,
    paidAt: body.status === "paid" ? new Date().toISOString() : cur.paidAt,
  };
  await writeDb(db);
  return NextResponse.json({ salary: db.monthlySalaries[idx] });
}
