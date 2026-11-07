import { promises as fs } from "fs";
import path from "path";
import { defaultSettings } from "./defaults";
import { seedDb } from "./seed";
import type { DbShape } from "./types";

/** Keep DB outside the hot-reload watch surface when possible (.data is gitignored). */
const legacyDbPath = path.join(process.cwd(), "data", "db.json");
const dbPath = path.join(process.cwd(), ".data", "db.json");

function ensureArrays(db: DbShape): DbShape {
  db.attendance = db.attendance || [];
  db.medications = db.medications || [];
  db.activities = db.activities || [];
  db.salaryPayouts = db.salaryPayouts || [];
  db.monthlySalaries = db.monthlySalaries || [];
  db.careLocations = db.careLocations || [];
  db.siteAllotments = db.siteAllotments || [];
  db.leaves = db.leaves || [];
  db.nurseAvailability = db.nurseAvailability || [];
  db.documents = db.documents || [];
  db.sosAlerts = db.sosAlerts || [];
  db.medSchedules = db.medSchedules || [];
  db.advances = db.advances || [];
  db.doctorNotes = db.doctorNotes || [];
  db.callLogs = db.callLogs || [];
  db.auditLogs = db.auditLogs || [];
  db.patients = db.patients || [];
  db.carePlans = db.carePlans || [];
  db.vitals = db.vitals || [];
  db.careReports = db.careReports || [];
  db.complaints = db.complaints || [];
  db.expenses = db.expenses || [];
  db.payments = db.payments || [];
  db.notifications = db.notifications || [];
  db.settings = { ...defaultSettings, ...(db.settings || {}) };
  db.staff = (db.staff || []).map((s) => ({
    ...s,
    salaryPerShift: typeof s.salaryPerShift === "number" ? s.salaryPerShift : 700,
    performanceScore: s.performanceScore ?? 80,
  }));
  return db;
}

function needsMigrate(db: Partial<DbShape>) {
  if (!Array.isArray(db.attendance)) return true;
  if (!Array.isArray(db.medications)) return true;
  if (!Array.isArray(db.activities)) return true;
  if (!Array.isArray(db.salaryPayouts)) return true;
  if (!Array.isArray(db.monthlySalaries)) return true;
  if (!Array.isArray(db.careLocations)) return true;
  if (!Array.isArray(db.siteAllotments)) return true;
  if (!Array.isArray(db.leaves)) return true;
  if (!Array.isArray(db.nurseAvailability)) return true;
  if (!Array.isArray(db.documents)) return true;
  if (!Array.isArray(db.sosAlerts)) return true;
  if (!Array.isArray(db.medSchedules)) return true;
  if (!Array.isArray(db.advances)) return true;
  if (!Array.isArray(db.doctorNotes)) return true;
  if (!Array.isArray(db.callLogs)) return true;
  if (!Array.isArray(db.auditLogs)) return true;
  if (!Array.isArray(db.patients)) return true;
  if (!Array.isArray(db.carePlans)) return true;
  if (!Array.isArray(db.vitals)) return true;
  if (!Array.isArray(db.careReports)) return true;
  if (!Array.isArray(db.complaints)) return true;
  if (!Array.isArray(db.expenses)) return true;
  if (!Array.isArray(db.payments)) return true;
  if (!Array.isArray(db.notifications)) return true;
  if (!db.settings) return true;
  const hasCoords = db.bookings?.some((b) => typeof b.lat === "number");
  if (!hasCoords) return true;
  const missingSalary = db.staff?.some((s) => typeof s.salaryPerShift !== "number");
  if (missingSalary) return true;
  return false;
}

async function ensureDb() {
  await fs.mkdir(path.dirname(dbPath), { recursive: true });
  try {
    try {
      await fs.access(dbPath);
    } catch {
      // One-time migrate from legacy data/db.json so existing demos keep working
      try {
        await fs.access(legacyDbPath);
        await fs.copyFile(legacyDbPath, dbPath);
      } catch {
        /* fresh install */
      }
    }
    await fs.access(dbPath);
    const raw = await fs.readFile(dbPath, "utf8");
    const parsed = JSON.parse(raw) as DbShape;
    if (needsMigrate(parsed)) {
      const merged = ensureArrays({
        ...seedDb,
        users: (() => {
          const existing = parsed.users?.length ? [...parsed.users] : [];
          for (const seeded of seedDb.users) {
            if (!existing.some((u) => u.email.toLowerCase() === seeded.email.toLowerCase())) {
              existing.push(seeded);
            }
          }
          return existing.length ? existing : seedDb.users;
        })(),
        staff: parsed.staff?.length
          ? parsed.staff.map((s) => {
              const seeded = seedDb.staff.find((x) => x.id === s.id);
              return {
                ...s,
                email: s.email || parsed.users?.find((u) => u.id === s.userId)?.email,
                salaryMonthly: s.salaryMonthly ?? seeded?.salaryMonthly ?? 20000,
                salaryPerShift: s.salaryPerShift ?? seeded?.salaryPerShift ?? 700,
                performanceScore: s.performanceScore ?? 80,
              };
            })
          : seedDb.staff,
        bookings: (parsed.bookings?.length ? parsed.bookings : seedDb.bookings).map((b) => {
          const seeded = seedDb.bookings.find((x) => x.id === b.id);
          return {
            ...b,
            lat: b.lat ?? seeded?.lat,
            lng: b.lng ?? seeded?.lng,
            geofenceRadiusM: b.geofenceRadiusM ?? seeded?.geofenceRadiusM ?? 250,
            upiId: b.upiId || "roshancare@upi",
          };
        }),
        attendance: (parsed.attendance || []).map((a) => ({
          ...a,
          dutyDate: a.dutyDate || a.createdAt?.slice(0, 10) || new Date().toISOString().slice(0, 10),
          type: a.type === "present" ? "morning" : a.type === "checkout" ? "evening" : a.type,
        })),
        salaryPayouts: parsed.salaryPayouts || [],
        monthlySalaries: parsed.monthlySalaries || seedDb.monthlySalaries || [],
        careLocations: parsed.careLocations?.length
          ? parsed.careLocations
          : seedDb.careLocations,
        siteAllotments: parsed.siteAllotments?.length
          ? parsed.siteAllotments
          : seedDb.siteAllotments,
        medications: parsed.medications || seedDb.medications,
        activities: parsed.activities || seedDb.activities || [],
        careNotes: parsed.careNotes?.length ? parsed.careNotes : seedDb.careNotes,
        invoices: parsed.invoices?.length ? parsed.invoices : seedDb.invoices,
        leads: parsed.leads?.length ? parsed.leads : seedDb.leads,
        leaves: parsed.leaves?.length ? parsed.leaves : seedDb.leaves || [],
        nurseAvailability: parsed.nurseAvailability?.length
          ? parsed.nurseAvailability
          : seedDb.nurseAvailability || [],
        documents: parsed.documents || [],
        sosAlerts: parsed.sosAlerts || [],
        medSchedules: parsed.medSchedules || seedDb.medSchedules || [],
        advances: parsed.advances || [],
        doctorNotes: parsed.doctorNotes || [],
        callLogs: parsed.callLogs || [],
        auditLogs: parsed.auditLogs || [],
        patients: parsed.patients?.length ? parsed.patients : seedDb.patients || [],
        carePlans: parsed.carePlans || seedDb.carePlans || [],
        vitals: parsed.vitals || seedDb.vitals || [],
        careReports: parsed.careReports || seedDb.careReports || [],
        complaints: parsed.complaints || seedDb.complaints || [],
        expenses: parsed.expenses || seedDb.expenses || [],
        payments: parsed.payments || seedDb.payments || [],
        notifications: parsed.notifications || seedDb.notifications || [],
        settings: { ...defaultSettings, ...(parsed.settings || seedDb.settings || {}) },
      });
      // Backfill patientId on bookings from patients by phone/name
      if (merged.patients?.length) {
        merged.bookings = merged.bookings.map((b) => {
          if (b.patientId) return b;
          const hit = merged.patients.find(
            (p) =>
              p.phone.replace(/\s/g, "") === b.phone.replace(/\s/g, "") ||
              p.name.toLowerCase() === b.patientName.toLowerCase(),
          );
          return hit ? { ...b, patientId: hit.id } : b;
        });
      }
      await fs.writeFile(dbPath, JSON.stringify(merged, null, 2), "utf8");
    }
  } catch {
    await fs.writeFile(dbPath, JSON.stringify(seedDb, null, 2), "utf8");
  }
}

let memoryCache: { mtimeMs: number; db: DbShape } | null = null;

export async function readDb(): Promise<DbShape> {
  await ensureDb();
  try {
    const stat = await fs.stat(dbPath);
    if (memoryCache && memoryCache.mtimeMs === stat.mtimeMs) {
      return memoryCache.db;
    }
    const raw = await fs.readFile(dbPath, "utf8");
    const db = ensureArrays(JSON.parse(raw) as DbShape);
    memoryCache = { mtimeMs: stat.mtimeMs, db };
    return db;
  } catch {
    const raw = await fs.readFile(dbPath, "utf8");
    const db = ensureArrays(JSON.parse(raw) as DbShape);
    memoryCache = { mtimeMs: Date.now(), db };
    return db;
  }
}

export async function writeDb(db: DbShape) {
  await ensureDb();
  const next = ensureArrays(db);
  await fs.writeFile(dbPath, JSON.stringify(next, null, 2), "utf8");
  try {
    const stat = await fs.stat(dbPath);
    memoryCache = { mtimeMs: stat.mtimeMs, db: next };
  } catch {
    memoryCache = { mtimeMs: Date.now(), db: next };
  }
}

export async function resetDb() {
  await fs.mkdir(path.dirname(dbPath), { recursive: true });
  await fs.writeFile(dbPath, JSON.stringify(seedDb, null, 2), "utf8");
  memoryCache = null;
  return seedDb;
}

export async function saveDataUrlImage(
  dataUrl: string,
  folder: "profiles" | "attendance" | "medications" | "documents" | "reports",
  prefix: string,
) {
  const match = /^data:(image\/[a-zA-Z0-9.+-]+|application\/pdf);base64,(.+)$/.exec(dataUrl);
  if (!match) throw new Error("Invalid file data");
  const ext = match[1].includes("png") ? "png" : match[1].includes("pdf") ? "pdf" : "jpg";
  const dir = path.join(process.cwd(), "public", "uploads", folder);
  await fs.mkdir(dir, { recursive: true });
  const fileName = `${prefix}-${Date.now()}.${ext}`;
  await fs.writeFile(path.join(dir, fileName), Buffer.from(match[2], "base64"));
  return `/uploads/${folder}/${fileName}`;
}
