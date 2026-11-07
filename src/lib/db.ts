import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { defaultSettings } from "./defaults";
import {
  hasRemoteDb,
  remoteReadDb,
  remoteStoreLabel,
  remoteWriteDb,
} from "./db-remote";
import { seedDb } from "./seed";
import type { DbShape } from "./types";

/**
 * Local: `.data/db.json` (gitignored).
 * Vercel/serverless: Upstash / Vercel KV (durable). Falls back to /tmp only if
 * no Redis env is configured (data will NOT survive cold starts).
 */
const legacyDbPath = path.join(process.cwd(), "data", "db.json");
const localDbPath = path.join(process.cwd(), ".data", "db.json");
const tmpDbPath = path.join(os.tmpdir(), "rc-care-db.json");
const isServerless =
  process.env.VERCEL === "1" || process.env.AWS_LAMBDA_FUNCTION_NAME != null;

function cloneSeed(): DbShape {
  return ensureArrays(JSON.parse(JSON.stringify(seedDb)) as DbShape);
}

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

function mergeMigrated(parsed: DbShape): DbShape {
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
    careLocations: parsed.careLocations?.length ? parsed.careLocations : seedDb.careLocations,
    siteAllotments: parsed.siteAllotments?.length ? parsed.siteAllotments : seedDb.siteAllotments,
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
  return merged;
}

type StoreMode = "remote" | "file" | "memory";

let storeMode: StoreMode | null = null;
let activeDbPath = localDbPath;
let memoryCache: { mtimeMs: number; db: DbShape } | null = null;
let remoteBootstrapped = false;
let warnedEphemeral = false;

async function canUsePath(filePath: string): Promise<boolean> {
  try {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    const probe = `${filePath}.probe`;
    await fs.writeFile(probe, "ok", "utf8");
    await fs.unlink(probe).catch(() => {});
    return true;
  } catch {
    return false;
  }
}

async function resolveStore(): Promise<{ mode: StoreMode; filePath: string }> {
  if (storeMode) return { mode: storeMode, filePath: activeDbPath };

  if (hasRemoteDb()) {
    storeMode = "remote";
    activeDbPath = "remote://upstash";
    return { mode: "remote", filePath: activeDbPath };
  }

  if (isServerless && !warnedEphemeral) {
    warnedEphemeral = true;
    console.warn(
      "[db] No KV/Upstash env on Vercel — add/update/delete will NOT persist. Add Vercel KV (KV_REST_API_URL + KV_REST_API_TOKEN).",
    );
  }

  const candidates = isServerless ? [tmpDbPath, localDbPath] : [localDbPath, tmpDbPath];

  for (const candidate of candidates) {
    if (await canUsePath(candidate)) {
      storeMode = "file";
      activeDbPath = candidate;
      return { mode: "file", filePath: candidate };
    }
  }

  storeMode = "memory";
  activeDbPath = tmpDbPath;
  if (!memoryCache) {
    memoryCache = { mtimeMs: Date.now(), db: cloneSeed() };
  }
  return { mode: "memory", filePath: activeDbPath };
}

async function readJsonFile(filePath: string): Promise<DbShape | null> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return ensureArrays(JSON.parse(raw) as DbShape);
  } catch {
    return null;
  }
}

async function writeJsonFile(filePath: string, db: DbShape) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(db, null, 2), "utf8");
}

function normalizeLoaded(parsed: DbShape): DbShape {
  return needsMigrate(parsed) ? mergeMigrated(parsed) : ensureArrays(parsed);
}

async function ensureRemoteDb() {
  if (remoteBootstrapped && memoryCache) return;
  const remote = await remoteReadDb();
  if (remote) {
    const next = normalizeLoaded(remote);
    memoryCache = { mtimeMs: Date.now(), db: next };
    // Re-save if migration reshaped the document
    if (needsMigrate(remote)) {
      await remoteWriteDb(next);
    }
    remoteBootstrapped = true;
    return;
  }

  // First boot on KV — seed once and persist
  const seeded = cloneSeed();
  memoryCache = { mtimeMs: Date.now(), db: seeded };
  const ok = await remoteWriteDb(seeded);
  if (!ok) {
    console.error("[db] Failed to bootstrap remote DB — falling back to memory");
    storeMode = "memory";
  }
  remoteBootstrapped = true;
}

async function ensureFileDb(filePath: string) {
  try {
    let parsed = await readJsonFile(filePath);
    if (!parsed) {
      const legacy = await readJsonFile(legacyDbPath);
      if (legacy) {
        parsed = legacy;
        await writeJsonFile(filePath, legacy).catch(() => {});
      }
    }

    if (!parsed) {
      const seeded = cloneSeed();
      try {
        await writeJsonFile(filePath, seeded);
      } catch {
        storeMode = "memory";
        memoryCache = { mtimeMs: Date.now(), db: seeded };
        return;
      }
      memoryCache = { mtimeMs: Date.now(), db: seeded };
      return;
    }

    const next = normalizeLoaded(parsed);
    if (needsMigrate(parsed)) {
      try {
        await writeJsonFile(filePath, next);
      } catch {
        /* keep in memory */
      }
    }
    memoryCache = { mtimeMs: Date.now(), db: next };
  } catch {
    storeMode = "memory";
    memoryCache = { mtimeMs: Date.now(), db: cloneSeed() };
  }
}

async function ensureDb() {
  const store = await resolveStore();
  if (store.mode === "remote") {
    await ensureRemoteDb();
    return;
  }
  if (store.mode === "memory") {
    if (!memoryCache) memoryCache = { mtimeMs: Date.now(), db: cloneSeed() };
    return;
  }
  await ensureFileDb(store.filePath);
}

export async function getDbStoreInfo() {
  const store = await resolveStore();
  return {
    mode: store.mode,
    remote: remoteStoreLabel(),
    durable: store.mode === "remote" || (store.mode === "file" && !isServerless),
    serverless: isServerless,
    path: store.filePath,
  };
}

export async function readDb(): Promise<DbShape> {
  await ensureDb();

  if (storeMode === "remote") {
    // Always re-read from KV so every serverless instance sees latest writes
    const remote = await remoteReadDb();
    if (remote) {
      const next = ensureArrays(remote);
      memoryCache = { mtimeMs: Date.now(), db: next };
      return next;
    }
    if (memoryCache) return memoryCache.db;
    const seeded = cloneSeed();
    memoryCache = { mtimeMs: Date.now(), db: seeded };
    return seeded;
  }

  if (storeMode === "memory") {
    if (!memoryCache) memoryCache = { mtimeMs: Date.now(), db: cloneSeed() };
    return memoryCache.db;
  }

  try {
    const stat = await fs.stat(activeDbPath);
    if (memoryCache && memoryCache.mtimeMs === stat.mtimeMs) {
      return memoryCache.db;
    }
    const raw = await fs.readFile(activeDbPath, "utf8");
    const db = ensureArrays(JSON.parse(raw) as DbShape);
    memoryCache = { mtimeMs: stat.mtimeMs, db };
    return db;
  } catch {
    if (memoryCache) return memoryCache.db;
    const seeded = cloneSeed();
    memoryCache = { mtimeMs: Date.now(), db: seeded };
    storeMode = "memory";
    return seeded;
  }
}

export async function writeDb(db: DbShape) {
  await ensureDb();
  const next = ensureArrays(db);
  memoryCache = { mtimeMs: Date.now(), db: next };

  if (storeMode === "remote") {
    const ok = await remoteWriteDb(next);
    if (!ok) {
      console.error("[db] remote write failed — data may not persist across instances");
    }
    return;
  }

  if (storeMode === "memory") return;

  try {
    await writeJsonFile(activeDbPath, next);
    try {
      const stat = await fs.stat(activeDbPath);
      memoryCache = { mtimeMs: stat.mtimeMs, db: next };
    } catch {
      /* keep Date.now mtime */
    }
  } catch {
    storeMode = "memory";
  }
}

export async function resetDb() {
  const seeded = cloneSeed();
  memoryCache = { mtimeMs: Date.now(), db: seeded };
  const store = await resolveStore();
  if (store.mode === "remote") {
    await remoteWriteDb(seeded);
    remoteBootstrapped = true;
    return seeded;
  }
  if (store.mode === "file") {
    try {
      await writeJsonFile(store.filePath, seeded);
    } catch {
      storeMode = "memory";
    }
  }
  return seeded;
}

export async function saveDataUrlImage(
  dataUrl: string,
  folder: "profiles" | "attendance" | "medications" | "documents" | "reports",
  prefix: string,
) {
  const match = /^data:(image\/[a-zA-Z0-9.+-]+|application\/pdf);base64,(.+)$/.exec(dataUrl);
  if (!match) throw new Error("Invalid file data");
  const ext = match[1].includes("png") ? "png" : match[1].includes("pdf") ? "pdf" : "jpg";
  const fileName = `${prefix}-${Date.now()}.${ext}`;

  const publicDir = path.join(process.cwd(), "public", "uploads", folder);
  try {
    await fs.mkdir(publicDir, { recursive: true });
    await fs.writeFile(path.join(publicDir, fileName), Buffer.from(match[2], "base64"));
    return `/uploads/${folder}/${fileName}`;
  } catch {
    // Vercel: persist under /tmp (not publicly served; still keeps API from crashing)
    const tmpDir = path.join(os.tmpdir(), "rc-uploads", folder);
    await fs.mkdir(tmpDir, { recursive: true });
    await fs.writeFile(path.join(tmpDir, fileName), Buffer.from(match[2], "base64"));
    return `/uploads/${folder}/${fileName}`;
  }
}
