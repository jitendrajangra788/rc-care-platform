import assert from "node:assert/strict";
import { defaultSettings } from "../src/lib/defaults";
import {
  careerApplicationSchema,
  convertHomeCareRequest,
  findPatientMatch,
  hireCareerApplicant,
  homeCareSubmissionSchema,
  insertCareerApplication,
  insertHomeCareRequest,
  nextRefId,
  schemaError,
  updateHomeCareRequest,
} from "../src/lib/enquiries";
import { inspectUpload, isSafeStoredName } from "../src/lib/private-files";
import { allowPublicSubmit } from "../src/lib/public-rate-limit";
import type { CareerApplication, DbShape, HomeCareRequest, Patient } from "../src/lib/types";

function emptyDb(): DbShape {
  return {
    users: [],
    staff: [],
    bookings: [],
    invoices: [],
    careNotes: [],
    leads: [],
    attendance: [],
    medications: [],
    activities: [],
    salaryPayouts: [],
    monthlySalaries: [],
    careLocations: [],
    siteAllotments: [],
    leaves: [],
    nurseAvailability: [],
    documents: [],
    sosAlerts: [],
    medSchedules: [],
    advances: [],
    doctorNotes: [],
    callLogs: [],
    auditLogs: [],
    patients: [],
    carePlans: [],
    vitals: [],
    careReports: [],
    complaints: [],
    expenses: [],
    payments: [],
    notifications: [],
    homeCareRequests: [],
    careerApplications: [],
    settings: { ...defaultSettings },
  };
}

const homePayload = {
  contactName: "Amit Jain",
  mobile: "9876543210",
  email: "",
  relationship: "Son",
  patientName: "Suresh Jain",
  patientAge: 72,
  patientGender: "Male" as const,
  address: "12, Subhash Nagar",
  area: "Subhash Nagar",
  city: "Bhilwara",
  state: "Rajasthan",
  pinCode: "311001",
  service: "Elderly Care" as const,
  careDescription: "Needs help with daily routine and medicines.",
  mobilityAssistance: true,
  dutyHours: "24 Hours" as const,
  preferredStartDate: "2026-12-01",
  preferredShift: "Day" as const,
  urgency: "Urgent" as const,
  consentContact: true as const,
  consentPrivacy: true as const,
};

function careerPayload(email = "nurse@example.com") {
  return {
    fullName: "Priya Sharma",
    mobile: "+91 98765 43210",
    email,
    dateOfBirth: "1998-04-12",
    gender: "Female" as const,
    address: "44, Bapu Nagar",
    city: "Bhilwara",
    state: "Rajasthan",
    pinCode: "311001",
    applyingFor: "Nurse" as const,
    preferredLocation: "Bhilwara",
    employmentType: "Full Time" as const,
    preferredShift: "Day" as const,
    highestEducation: "Graduate" as const,
    nursingQualification: "GNM" as const,
    institutionName: "City Nursing College",
    passingYear: "2019",
    experienceLevel: "Experienced" as const,
    yearsOfExperience: 4,
    skills: ["Patient Care", "ICU Care"] as ("Patient Care" | "ICU Care")[],
    availabilityType: "Full Time" as const,
    availabilityShift: "Rotational" as const,
    joiningDate: "2026-12-15",
    documents: [
      {
        label: "Resume",
        name: "resume.pdf",
        dataUrl: "data:application/pdf;base64,JVBERi0xLjQK",
      },
    ],
    consent: true as const,
  };
}

function dataUrl(bytes: Buffer, mime: string) {
  return `data:${mime};base64,${bytes.toString("base64")}`;
}

const badMobile = homeCareSubmissionSchema.safeParse({ ...homePayload, mobile: "12345" });
assert.equal(badMobile.success, false);
if (!badMobile.success) assert.match(schemaError(badMobile.error), /mobile/i);

const missingName = homeCareSubmissionSchema.safeParse({ ...homePayload, contactName: "A" });
assert.equal(missingName.success, false);

const withStatus = homeCareSubmissionSchema.safeParse({ ...homePayload, status: "confirmed", password: "secret" });
assert.equal(withStatus.success, true);
if (withStatus.success) {
  assert.equal("status" in withStatus.data, false);
  assert.equal("password" in withStatus.data, false);
  assert.equal(withStatus.data.mobile, "9876543210");
}

const career = careerApplicationSchema.safeParse(careerPayload());
assert.equal(career.success, true);
if (career.success) {
  assert.equal(career.data.mobile, "9876543210");
  assert.equal("password" in career.data, false);
}

const fresherYears = careerApplicationSchema.safeParse({
  ...careerPayload(),
  experienceLevel: "Fresher",
  yearsOfExperience: 0,
});
assert.equal(fresherYears.success, true);

const experiencedZero = careerApplicationSchema.safeParse({
  ...careerPayload(),
  experienceLevel: "Experienced",
  yearsOfExperience: 0,
});
assert.equal(experiencedZero.success, false);

assert.equal(nextRefId(["HCR-1001", "APP-9"], "HCR"), "HCR-1002");
assert.equal(nextRefId(["HCR-1001", "HCR-1002"], "HCR"), "HCR-1003");
assert.notEqual(nextRefId(["APP-1004"], "APP"), nextRefId(["APP-1005"], "APP"));

const pdf = Buffer.from("%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF");
const pdfOk = inspectUpload(dataUrl(pdf, "application/pdf"), "resume.pdf");
assert.equal(pdfOk.ok, true);

const html = inspectUpload(dataUrl(Buffer.from("<html>"), "text/html"), "x.html");
assert.equal(html.ok, false);

const mismatched = inspectUpload(dataUrl(Buffer.from([0xff, 0xd8, 0xff, 0xd9]), "application/pdf"), "a.pdf");
assert.equal(mismatched.ok, false);

const big = Buffer.alloc(2 * 1024 * 1024 + 1);
big.write("%PDF");
const oversized = inspectUpload(dataUrl(big, "application/pdf"), "big.pdf");
assert.equal(oversized.ok, false);
if (!oversized.ok) assert.match(oversized.error, /2 MB/);

assert.equal(isSafeStoredName("a1b2.pdf"), true);
assert.equal(isSafeStoredName("../secret.pdf"), false);
assert.equal(isSafeStoredName("..\\secret.pdf"), false);

const db = emptyDb();
assert.equal(withStatus.success, true);
if (!withStatus.success) throw new Error("home payload");
const request = insertHomeCareRequest(db, withStatus.data, []);
assert.match(request.id, /^HCR-\d+$/);
assert.equal(request.status, "new");
assert.equal(JSON.stringify(request).includes("password"), false);

const blocked = convertHomeCareRequest(db, request.id, { id: "u-admin", name: "Admin" });
assert.equal("error" in blocked, true);
assert.equal(db.homeCareRequests[0].status, "new");
assert.equal(db.bookings.length, 0);

db.homeCareRequests[0] = { ...db.homeCareRequests[0], status: "confirmed" };
const converted = convertHomeCareRequest(db, request.id, { id: "u-admin", name: "Admin" });
if ("error" in converted) throw new Error(converted.error);
assert.equal(converted.request.status, "converted");
assert.equal(converted.booking.shift, "24hr");
assert.equal(converted.booking.priority, "urgent");
assert.equal(converted.booking.patientId, converted.patient.id);
assert.equal(converted.linkedExisting, false);
assert.equal(db.patients.length, 1);
assert.equal(db.bookings.length, 1);
assert.match(converted.booking.notes || "", new RegExp(request.id));
const again = convertHomeCareRequest(db, request.id, { id: "u-admin", name: "Admin" });
assert.equal("error" in again, true);
assert.equal(db.bookings.length, 1);

const dbLink = emptyDb();
const existing: Patient = {
  id: "pat-existing",
  name: "Suresh Jain",
  phone: "+91 98765 43210",
  familyUserIds: [],
  status: "active",
  createdAt: "2026-01-01T00:00:00.000Z",
};
dbLink.patients.push(existing);
assert.ok(findPatientMatch(dbLink.patients, { name: "Suresh Jain", phone: "9876543210" }));
assert.equal(findPatientMatch(dbLink.patients, { name: "Other Person", phone: "9876543210" }), undefined);
const second = insertHomeCareRequest(dbLink, withStatus.data, []);
dbLink.homeCareRequests[0] = { ...second, status: "confirmed" };
const linked = convertHomeCareRequest(dbLink, second.id, { id: "u-admin", name: "Admin" });
if ("error" in linked) throw new Error(linked.error);
assert.equal(linked.linkedExisting, true);
assert.equal(linked.patient.id, "pat-existing");
assert.equal(dbLink.patients.length, 1);

const dbOther = emptyDb();
dbOther.patients.push({ ...existing, name: "Meera Devi" });
const third = insertHomeCareRequest(dbOther, withStatus.data, []);
dbOther.homeCareRequests[0] = { ...third, status: "confirmed" };
const separate = convertHomeCareRequest(dbOther, third.id, { id: "u-admin", name: "Admin" });
if ("error" in separate) throw new Error(separate.error);
assert.equal(separate.linkedExisting, false);
assert.equal(dbOther.patients.length, 2);

const direct = updateHomeCareRequest(
  db,
  { id: request.id, status: "cancelled" },
  { id: "u-admin", name: "Admin" },
);
assert.equal("error" in direct, true);

assert.equal(career.success, true);
if (!career.success) throw new Error("career payload");
const careerDb = emptyDb();
const application = insertCareerApplication(careerDb, career.data, []);
assert.match(application.id, /^APP-\d+$/);
assert.equal(application.status, "new");
assert.equal("password" in application, false);

const earlyHire = hireCareerApplicant(
  careerDb,
  { id: application.id, password: "password1", salaryPerShift: 800 },
  { id: "u-admin", name: "Admin" },
);
assert.equal("error" in earlyHire, true);
assert.equal(careerDb.users.length, 0);

careerDb.careerApplications[0] = { ...application, status: "selected" };
const shortPassword = hireCareerApplicant(
  careerDb,
  { id: application.id, password: "short", salaryPerShift: 800 },
  { id: "u-admin", name: "Admin" },
);
assert.equal("error" in shortPassword, true);

const hired = hireCareerApplicant(
  careerDb,
  { id: application.id, password: "password1", salaryPerShift: 800, staffRole: "Nurse" },
  { id: "u-admin", name: "Admin" },
);
if ("error" in hired) throw new Error(hired.error);
assert.equal(hired.application.status, "joined");
assert.equal(hired.staff.userId, careerDb.users[0]?.id);
assert.equal(JSON.stringify(hired.application).includes("password1"), false);
assert.equal(JSON.stringify(careerDb.careerApplications).includes("password1"), false);
assert.ok(careerDb.users[0]?.password.startsWith("scrypt$"));

const duplicateDb = emptyDb();
duplicateDb.users.push({
  id: "u-taken",
  name: "Existing",
  email: "nurse@example.com",
  password: "scrypt$abc$def",
  role: "nurse",
  active: true,
});
const duplicate = insertCareerApplication(duplicateDb, career.data, []) as CareerApplication;
duplicateDb.careerApplications[0] = { ...duplicate, status: "selected" };
const clash = hireCareerApplicant(
  duplicateDb,
  { id: duplicate.id, password: "password1", salaryPerShift: 700 },
  { id: "u-admin", name: "Admin" },
);
assert.equal("error" in clash, true);
assert.equal(duplicateDb.careerApplications[0].status, "selected");
assert.equal(duplicateDb.staff.length, 0);

const rateKey = `test-${Date.now()}`;
for (let i = 0; i < 8; i += 1) assert.equal(allowPublicSubmit(rateKey, 8, 60_000), true);
assert.equal(allowPublicSubmit(rateKey, 8, 60_000), false);

void (0 as HomeCareRequest | 0);
console.log("enquiries-ok");
