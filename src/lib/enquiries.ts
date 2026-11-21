import { z } from "zod";
import { pushActivity } from "./activity";
import { pushAudit } from "./audit";
import { hashPassword } from "./password";
import { defaultShiftTimes, findAssignmentConflicts, validateBookingDates } from "./schedule";
import {
  CAREER_DOC_LABELS,
  CAREER_SKILLS,
  CAREER_STATUSES,
  EDUCATIONS,
  HOME_DOC_LABELS,
  HOME_DUTIES,
  HOME_SERVICES,
  HOME_STATUSES,
  JOB_ROLES,
  NURSING_QUALIFICATIONS,
  SHIFT_PREFS,
} from "./enquiry-options";
import type {
  Booking,
  CareerApplication,
  CareerApplicationStatus,
  DbShape,
  DocumentMeta,
  HomeCareDuty,
  HomeCareRequest,
  HomeCareRequestStatus,
  Invoice,
  Patient,
  RecordHistory,
  ShiftPreference,
  Staff,
  StoredDocument,
  User,
} from "./types";

export {
  CAREER_DOC_LABELS,
  CAREER_SKILLS,
  CAREER_STATUS_LABEL,
  CAREER_STATUSES,
  EDUCATIONS,
  HOME_DOC_LABELS,
  HOME_DUTIES,
  HOME_SERVICES,
  HOME_STATUS_LABEL,
  HOME_STATUSES,
  JOB_ROLES,
  NURSING_QUALIFICATIONS,
  SHIFT_PREFS,
} from "./enquiry-options";

const uploadSchema = z.object({
  label: z.string().trim().min(1).max(80),
  name: z.string().trim().min(1).max(180),
  dataUrl: z.string().min(32).max(2_800_000),
});

const genderSchema = z.enum(["Male", "Female", "Other"]);
const employmentSchema = z.enum(["Full Time", "Part Time"]);

export function phoneDigits(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  return digits;
}

export function isIndianMobile(value: string) {
  return /^[6-9]\d{9}$/.test(phoneDigits(value));
}

const mobileSchema = z
  .string()
  .trim()
  .refine(isIndianMobile, "Enter a valid 10-digit mobile number")
  .transform(phoneDigits);

function parseISODate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
}

function isAdultDob(value: string) {
  const date = parseISODate(value);
  if (!date) return false;
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const month = today.getMonth() - date.getMonth();
  if (month < 0 || (month === 0 && today.getDate() < date.getDate())) age -= 1;
  return age >= 18 && age <= 80;
}

function isServiceDate(value: string) {
  const date = parseISODate(value);
  if (!date) return false;
  return date.getFullYear() >= 2024 && date.getFullYear() <= 2032;
}

const dateField = (message: string) =>
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, message).refine(isServiceDate, message);

export const homeCareSubmissionSchema = z
  .object({
    contactName: z.string().trim().min(2, "Full name is required").max(120),
    mobile: mobileSchema,
    email: z
      .string()
      .trim()
      .max(200)
      .refine((value) => value === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), "Enter a valid email")
      .optional()
      .default(""),
    relationship: z.string().trim().min(2, "Relationship is required").max(80),
    patientName: z.string().trim().min(2, "Patient name is required").max(120),
    patientAge: z.number().int().min(0).max(120),
    patientGender: genderSchema,
    address: z.string().trim().min(5, "Full address is required").max(400),
    area: z.string().trim().min(2, "Area is required").max(120),
    city: z.string().trim().min(2, "City is required").max(80),
    state: z.string().trim().min(2, "State is required").max(80),
    pinCode: z.string().trim().regex(/^\d{6}$/, "Enter a 6-digit PIN code"),
    landmark: z.string().trim().max(160).optional().default(""),
    service: z.enum(HOME_SERVICES),
    careDescription: z.string().trim().min(10, "Describe the care required").max(2000),
    mobilityAssistance: z.boolean(),
    specialCare: z.string().trim().max(1000).optional().default(""),
    doctorInstructions: z.string().trim().max(2000).optional().default(""),
    dutyHours: z.enum(HOME_DUTIES),
    preferredStartDate: dateField("Enter a valid start date"),
    preferredShift: z.enum(SHIFT_PREFS),
    urgency: z.enum(["Normal", "Urgent"]),
    documents: z.array(uploadSchema).max(3).optional().default([]),
    consentContact: z.literal(true, { message: "Permission to contact is required" }),
    consentPrivacy: z.literal(true, { message: "Privacy acknowledgement is required" }),
  })
  .superRefine((value, ctx) => {
    const labels = value.documents.map((doc) => doc.label);
    if (new Set(labels).size !== labels.length) {
      ctx.addIssue({ code: "custom", message: "Each document can be uploaded once.", path: ["documents"] });
    }
    if (labels.some((label) => !HOME_DOC_LABELS.includes(label as (typeof HOME_DOC_LABELS)[number]))) {
      ctx.addIssue({ code: "custom", message: "Unknown document type.", path: ["documents"] });
    }
  });

export const careerApplicationSchema = z
  .object({
    fullName: z.string().trim().min(2, "Full name is required").max(120),
    mobile: mobileSchema,
    email: z.string().trim().toLowerCase().email("Enter a valid email").max(200),
    dateOfBirth: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date of birth")
      .refine(isAdultDob, "Applicant must be at least 18 years old"),
    gender: genderSchema,
    address: z.string().trim().min(5, "Full address is required").max(400),
    city: z.string().trim().min(2, "City is required").max(80),
    state: z.string().trim().min(2, "State is required").max(80),
    pinCode: z.string().trim().regex(/^\d{6}$/, "Enter a 6-digit PIN code"),
    applyingFor: z.enum(JOB_ROLES),
    preferredLocation: z.string().trim().min(2, "Preferred work location is required").max(120),
    expectedSalary: z.string().trim().max(40).optional().default(""),
    employmentType: employmentSchema,
    preferredShift: z.enum(SHIFT_PREFS),
    highestEducation: z.enum(EDUCATIONS),
    nursingQualification: z.enum(NURSING_QUALIFICATIONS),
    institutionName: z.string().trim().min(2, "Institution name is required").max(160),
    passingYear: z
      .string()
      .trim()
      .regex(/^\d{4}$/, "Enter the passing year")
      .refine((year) => Number(year) >= 1970 && Number(year) <= new Date().getFullYear() + 1, "Enter a valid passing year"),
    experienceLevel: z.enum(["Fresher", "Experienced"]),
    yearsOfExperience: z.number().int().min(0).max(60).optional().default(0),
    previousEmployer: z.string().trim().max(160).optional().default(""),
    previousRole: z.string().trim().max(120).optional().default(""),
    skills: z.array(z.enum(CAREER_SKILLS)).min(1, "Select at least one skill").max(8),
    otherSkills: z.string().trim().max(300).optional().default(""),
    availabilityType: employmentSchema,
    availabilityShift: z.enum(SHIFT_PREFS),
    joiningDate: dateField("Enter a valid joining date"),
    documents: z.array(uploadSchema).min(1, "Resume is required").max(3),
    about: z.string().trim().max(2000).optional().default(""),
    referenceContact: z.string().trim().max(160).optional().default(""),
    consent: z.literal(true, { message: "Consent is required to submit this application" }),
  })
  .superRefine((value, ctx) => {
    if (value.experienceLevel === "Experienced" && value.yearsOfExperience < 1) {
      ctx.addIssue({
        code: "custom",
        message: "Years of experience is required",
        path: ["yearsOfExperience"],
      });
    }
    const labels = value.documents.map((doc) => doc.label);
    if (!labels.includes("Resume")) {
      ctx.addIssue({ code: "custom", message: "Resume is required", path: ["documents"] });
    }
    if (new Set(labels).size !== labels.length) {
      ctx.addIssue({ code: "custom", message: "Each document can be uploaded once.", path: ["documents"] });
    }
    if (labels.some((label) => !CAREER_DOC_LABELS.includes(label as (typeof CAREER_DOC_LABELS)[number]))) {
      ctx.addIssue({ code: "custom", message: "Unknown document type.", path: ["documents"] });
    }
  });

export function schemaError(error: z.ZodError) {
  return error.issues[0]?.message || "Check the form and try again.";
}

export function nextRefId(existing: string[], prefix: string) {
  let max = 1000;
  const pattern = new RegExp(`^${prefix}-(\\d+)$`);
  for (const id of existing) {
    const match = pattern.exec(id);
    if (match) max = Math.max(max, Number(match[1]));
  }
  return `${prefix}-${max + 1}`;
}

export function documentMeta(doc: StoredDocument): DocumentMeta {
  return {
    id: doc.id,
    label: doc.label,
    originalName: doc.originalName,
    mime: doc.mime,
    size: doc.size,
  };
}

export function toHomeCareDTO(row: HomeCareRequest) {
  return { ...row, documents: row.documents.map(documentMeta) };
}

export function toCareerDTO(row: CareerApplication) {
  return { ...row, documents: row.documents.map(documentMeta) };
}

function blankToUndefined(value?: string) {
  const next = value?.trim();
  return next ? next : undefined;
}

function history(action: string, extra?: Partial<RecordHistory>): RecordHistory {
  return {
    at: new Date().toISOString(),
    action,
    ...extra,
  };
}

function notifyOps(db: DbShape, title: string, body: string, href: string) {
  db.notifications = db.notifications || [];
  const createdAt = new Date().toISOString();
  for (const user of db.users) {
    if (user.role !== "admin" && user.role !== "super_admin" && user.role !== "care_coordinator") continue;
    db.notifications.unshift({
      id: `ntf-${Date.now()}-${user.id}`,
      userId: user.id,
      title,
      body,
      href,
      createdAt,
    });
  }
  db.notifications = db.notifications.slice(0, 300);
}

type HomeInput = z.infer<typeof homeCareSubmissionSchema>;
type CareerInput = z.infer<typeof careerApplicationSchema>;

export function insertHomeCareRequest(db: DbShape, input: HomeInput, documents: StoredDocument[]) {
  db.homeCareRequests = db.homeCareRequests || [];
  const now = new Date().toISOString();
  const row: HomeCareRequest = {
    id: nextRefId(db.homeCareRequests.map((item) => item.id), "HCR"),
    contactName: input.contactName,
    mobile: input.mobile,
    email: blankToUndefined(input.email),
    relationship: input.relationship,
    patientName: input.patientName,
    patientAge: input.patientAge,
    patientGender: input.patientGender,
    address: input.address,
    area: input.area,
    city: input.city,
    state: input.state,
    pinCode: input.pinCode,
    landmark: blankToUndefined(input.landmark),
    service: input.service,
    careDescription: input.careDescription,
    mobilityAssistance: input.mobilityAssistance,
    specialCare: blankToUndefined(input.specialCare),
    doctorInstructions: blankToUndefined(input.doctorInstructions),
    dutyHours: input.dutyHours,
    preferredStartDate: input.preferredStartDate,
    preferredShift: input.preferredShift,
    urgency: input.urgency,
    documents,
    consentContact: true,
    consentPrivacy: true,
    status: "new",
    history: [history("submitted", { actorName: "Public form", note: "Home care request submitted" })],
    createdAt: now,
    updatedAt: now,
  };
  db.homeCareRequests.unshift(row);
  pushActivity(db, {
    kind: "enquiry",
    title: `Home care request · ${row.patientName}`,
    detail: `${row.id} · ${row.service}`,
    href: "/dashboard/admin/home-care-requests",
  });
  pushAudit(db, {
    action: "homecare.submit",
    entity: "homeCareRequest",
    detail: `${row.id} · ${row.contactName}`,
    actorName: "Public form",
  });
  notifyOps(db, "New home care request", `${row.patientName} · ${row.service}`, "/dashboard/admin/home-care-requests");
  return row;
}

export function insertCareerApplication(db: DbShape, input: CareerInput, documents: StoredDocument[]) {
  db.careerApplications = db.careerApplications || [];
  const now = new Date().toISOString();
  const row: CareerApplication = {
    id: nextRefId(db.careerApplications.map((item) => item.id), "APP"),
    fullName: input.fullName,
    mobile: input.mobile,
    email: input.email,
    dateOfBirth: input.dateOfBirth,
    gender: input.gender,
    address: input.address,
    city: input.city,
    state: input.state,
    pinCode: input.pinCode,
    applyingFor: input.applyingFor,
    preferredLocation: input.preferredLocation,
    expectedSalary: blankToUndefined(input.expectedSalary),
    employmentType: input.employmentType,
    preferredShift: input.preferredShift,
    highestEducation: input.highestEducation,
    nursingQualification: input.nursingQualification,
    institutionName: input.institutionName,
    passingYear: input.passingYear,
    experienceLevel: input.experienceLevel,
    yearsOfExperience: input.experienceLevel === "Fresher" ? 0 : input.yearsOfExperience,
    previousEmployer: blankToUndefined(input.previousEmployer),
    previousRole: blankToUndefined(input.previousRole),
    skills: input.skills,
    otherSkills: blankToUndefined(input.otherSkills),
    availabilityType: input.availabilityType,
    availabilityShift: input.availabilityShift,
    joiningDate: input.joiningDate,
    documents,
    about: blankToUndefined(input.about),
    referenceContact: blankToUndefined(input.referenceContact),
    consent: true,
    status: "new",
    history: [history("submitted", { actorName: "Public form", note: "Job application submitted" })],
    createdAt: now,
    updatedAt: now,
  };
  db.careerApplications.unshift(row);
  pushActivity(db, {
    kind: "enquiry",
    title: `Career application · ${row.fullName}`,
    detail: `${row.id} · ${row.applyingFor}`,
    href: "/dashboard/admin/career-applications",
  });
  pushAudit(db, {
    action: "career.submit",
    entity: "careerApplication",
    detail: `${row.id} · ${row.fullName}`,
    actorName: "Public form",
  });
  notifyOps(db, "New career application", `${row.fullName} · ${row.applyingFor}`, "/dashboard/admin/career-applications");
  return row;
}

type Actor = { id: string; name: string };
type Err = { error: string };

function pushRecordHistory(list: RecordHistory[], entry: RecordHistory) {
  return [entry, ...list].slice(0, 40);
}

export function updateHomeCareRequest(
  db: DbShape,
  input: {
    id: string;
    status?: HomeCareRequestStatus;
    adminNotes?: string;
    assignedStaffId?: string | null;
  },
  actor: Actor,
): Err | { request: HomeCareRequest } {
  const idx = (db.homeCareRequests || []).findIndex((row) => row.id === input.id);
  if (idx < 0) return { error: "Request not found" as const };
  const current = db.homeCareRequests[idx];
  if (input.status === "converted" && current.status !== "converted") {
    return { error: "Use convert to create a booking. Status cannot be set to converted directly." as const };
  }
  if (current.status === "converted" && input.status && input.status !== "converted") {
    return { error: "This request is already converted to a booking." as const };
  }
  if (input.status && !HOME_STATUSES.includes(input.status)) return { error: "Invalid status" as const };

  let assignedStaffId = current.assignedStaffId;
  if (input.assignedStaffId === null || input.assignedStaffId === "") assignedStaffId = undefined;
  else if (typeof input.assignedStaffId === "string") {
    const staff = db.staff.find((item) => item.id === input.assignedStaffId);
    if (!staff) return { error: "Selected staff was not found" as const };
    assignedStaffId = staff.id;
  }

  const nextStatus = input.status || current.status;
  const notes = input.adminNotes !== undefined ? blankToUndefined(input.adminNotes) : current.adminNotes;
  const events: RecordHistory[] = [];
  if (nextStatus !== current.status) {
    events.push(
      history("status", {
        actorId: actor.id,
        actorName: actor.name,
        from: current.status,
        to: nextStatus,
      }),
    );
  }
  if (notes !== current.adminNotes) {
    events.push(history("notes", { actorId: actor.id, actorName: actor.name, note: "Admin notes updated" }));
  }
  if (assignedStaffId !== current.assignedStaffId) {
    const staff = db.staff.find((item) => item.id === assignedStaffId);
    events.push(
      history("assign", {
        actorId: actor.id,
        actorName: actor.name,
        note: staff ? `Assigned ${staff.name}` : "Staff assignment cleared",
      }),
    );
  }

  const updated: HomeCareRequest = {
    ...current,
    status: nextStatus,
    adminNotes: notes,
    assignedStaffId,
    history: events.reduce((list, event) => pushRecordHistory(list, event), current.history),
    updatedAt: new Date().toISOString(),
  };
  db.homeCareRequests[idx] = updated;
  if (events.length) {
    pushAudit(db, {
      action: "homecare.update",
      entity: "homeCareRequest",
      detail: `${updated.id} · ${events.map((event) => event.action).join(", ")}`,
      actorId: actor.id,
      actorName: actor.name,
    });
  }
  return { request: updated };
}

export function updateCareerApplication(
  db: DbShape,
  input: {
    id: string;
    status?: CareerApplicationStatus;
    adminRemarks?: string;
    interviewAt?: string;
    interviewNote?: string;
  },
  actor: Actor,
): Err | { application: CareerApplication } {
  const idx = (db.careerApplications || []).findIndex((row) => row.id === input.id);
  if (idx < 0) return { error: "Application not found" as const };
  const current = db.careerApplications[idx];
  if (input.status === "joined" && current.status !== "joined") {
    return { error: "Use add-to-staff after the applicant is selected. Joined is set only then." as const };
  }
  if (current.status === "joined" && input.status && input.status !== "joined") {
    return { error: "This applicant is already on staff." as const };
  }
  if (input.status && !CAREER_STATUSES.includes(input.status)) return { error: "Invalid status" as const };

  const nextStatus = input.status || current.status;
  let interviewAt = input.interviewAt !== undefined ? blankToUndefined(input.interviewAt) : current.interviewAt;
  if (interviewAt && !/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?)?$/.test(interviewAt)) {
    return { error: "Enter a valid interview date and time" as const };
  }
  if (nextStatus === "interview_scheduled" && !interviewAt) {
    return { error: "Interview date and time is required" as const };
  }
  const remarks = input.adminRemarks !== undefined ? blankToUndefined(input.adminRemarks) : current.adminRemarks;
  const interviewNote = input.interviewNote !== undefined ? blankToUndefined(input.interviewNote) : current.interviewNote;

  const events: RecordHistory[] = [];
  if (nextStatus !== current.status) {
    events.push(
      history("status", {
        actorId: actor.id,
        actorName: actor.name,
        from: current.status,
        to: nextStatus,
      }),
    );
  }
  if (remarks !== current.adminRemarks) {
    events.push(history("remarks", { actorId: actor.id, actorName: actor.name, note: "Remarks updated" }));
  }
  if (interviewAt !== current.interviewAt || interviewNote !== current.interviewNote) {
    events.push(
      history("interview", {
        actorId: actor.id,
        actorName: actor.name,
        note: interviewAt ? `Interview ${interviewAt.replace("T", " ")}` : "Interview details updated",
      }),
    );
  }

  const updated: CareerApplication = {
    ...current,
    status: nextStatus,
    adminRemarks: remarks,
    interviewAt,
    interviewNote,
    history: events.reduce((list, event) => pushRecordHistory(list, event), current.history),
    updatedAt: new Date().toISOString(),
  };
  db.careerApplications[idx] = updated;
  if (events.length) {
    pushAudit(db, {
      action: "career.update",
      entity: "careerApplication",
      detail: `${updated.id} · ${events.map((event) => event.action).join(", ")}`,
      actorId: actor.id,
      actorName: actor.name,
    });
  }
  return { application: updated };
}

export function findPatientMatch(patients: Patient[], input: { name: string; phone: string }) {
  const digits = phoneDigits(input.phone);
  const name = input.name.trim().toLowerCase();
  return patients.find(
    (patient) => phoneDigits(patient.phone) === digits && patient.name.trim().toLowerCase() === name,
  );
}

function dutyToShift(duty: HomeCareDuty): Booking["shift"] {
  if (duty === "8 Hours") return "8hr";
  if (duty === "24 Hours") return "24hr";
  return "12hr";
}

function defaultRate(shift: Booking["shift"]) {
  if (shift === "24hr") return 2200;
  if (shift === "12hr") return 1200;
  return 900;
}

function nextBookingId(bookings: Booking[]) {
  const max = bookings.reduce((highest, booking) => {
    const value = Number(String(booking.id).replace(/\D/g, "")) || 0;
    return Math.max(highest, value);
  }, 1000);
  return `BK-${max + 1}`;
}

export function convertHomeCareRequest(
  db: DbShape,
  id: string,
  actor: Actor,
): Err | { request: HomeCareRequest; booking: Booking; patient: Patient; linkedExisting: boolean } {
  db.homeCareRequests = db.homeCareRequests || [];
  db.patients = db.patients || [];
  db.bookings = db.bookings || [];
  db.invoices = db.invoices || [];
  const idx = db.homeCareRequests.findIndex((row) => row.id === id);
  if (idx < 0) return { error: "Request not found" as const };
  const request = db.homeCareRequests[idx];
  if (request.bookingId || request.status === "converted") {
    return { error: "This request is already linked to a booking." as const };
  }
  if (request.status !== "confirmed") {
    return { error: "Confirm the request before converting it to a booking." as const };
  }

  const shift = dutyToShift(request.dutyHours);
  const times = defaultShiftTimes(shift);
  const dateError = validateBookingDates(request.preferredStartDate);
  if (dateError) return { error: dateError };

  const staffId = request.assignedStaffId;
  if (staffId && !db.staff.some((staff) => staff.id === staffId)) {
    return { error: "Assigned staff was not found. Clear the assignment and try again." as const };
  }

  const address = [request.address, request.landmark].filter(Boolean).join(", ");
  const notes = [
    `Home care request ${request.id}`,
    `Duty: ${request.dutyHours}`,
    `Shift preference: ${request.preferredShift}`,
    `Contact: ${request.contactName} (${request.relationship})`,
    request.careDescription,
    request.mobilityAssistance ? "Mobility assistance required" : "",
    request.specialCare ? `Special care: ${request.specialCare}` : "",
    request.doctorInstructions ? `Doctor instructions: ${request.doctorInstructions}` : "",
    request.adminNotes ? `Desk note: ${request.adminNotes}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const booking: Booking = {
    id: nextBookingId(db.bookings),
    patientName: request.patientName,
    careType: request.service,
    shift,
    address,
    area: request.area || request.city,
    startDate: request.preferredStartDate,
    phone: request.mobile,
    notes,
    status: staffId ? "assigned" : "pending",
    assignedStaffId: staffId,
    amount: defaultRate(shift),
    createdAt: new Date().toISOString(),
    geofenceRadiusM: db.settings?.defaultGeofenceM || 250,
    patientAge: request.patientAge,
    gender: request.patientGender,
    priority: request.urgency === "Urgent" ? "urgent" : "normal",
    guardianName: request.contactName,
    upiId: db.settings?.upiId || undefined,
    sitePin: String(1000 + Math.floor(Math.random() * 9000)),
    shiftStartTime: times.start,
    shiftEndTime: times.end,
  };

  if (staffId) {
    const conflicts = findAssignmentConflicts({
      staffId,
      booking,
      bookings: db.bookings,
      leaves: db.leaves || [],
      availability: db.nurseAvailability || [],
    });
    if (conflicts.length) return { error: conflicts[0].message };
  }

  const fullAddress = [request.address, request.landmark, request.city, request.state, request.pinCode]
    .filter(Boolean)
    .join(", ");
  const existing = findPatientMatch(db.patients, { name: request.patientName, phone: request.mobile });
  let patient: Patient;
  let linkedExisting = false;
  if (existing) {
    linkedExisting = true;
    const patientIndex = db.patients.findIndex((item) => item.id === existing.id);
    const patientNotes = existing.notes?.includes(request.id)
      ? existing.notes
      : [existing.notes, `Home care request ${request.id}`].filter(Boolean).join("\n");
    patient = {
      ...existing,
      age: existing.age ?? request.patientAge,
      gender: existing.gender ?? request.patientGender,
      address: existing.address || fullAddress,
      area: existing.area || request.area,
      notes: patientNotes,
    };
    db.patients[patientIndex] = patient;
  } else {
    patient = {
      id: `pat-${Date.now()}`,
      name: request.patientName,
      phone: request.mobile,
      age: request.patientAge,
      gender: request.patientGender,
      address: fullAddress,
      area: request.area,
      notes: `Home care request ${request.id}`,
      familyUserIds: [],
      status: "active",
      createdAt: new Date().toISOString(),
    };
    db.patients.unshift(patient);
  }

  booking.patientId = patient.id;
  db.bookings.unshift(booking);
  if (!db.invoices.some((invoice) => invoice.bookingId === booking.id)) {
    const invoice: Invoice = {
      id: `INV-${String(db.invoices.length + 101).padStart(3, "0")}`,
      bookingId: booking.id,
      patientName: booking.patientName,
      amount: booking.amount,
      paid: 0,
      status: "unpaid",
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    };
    db.invoices.unshift(invoice);
  }
  if (staffId) {
    db.staff = db.staff.map((staff) => (staff.id === staffId ? { ...staff, status: "on-duty" as const } : staff));
  }

  const updated: HomeCareRequest = {
    ...request,
    status: "converted",
    patientId: patient.id,
    bookingId: booking.id,
    updatedAt: new Date().toISOString(),
    history: pushRecordHistory(
      request.history,
      history("converted", {
        actorId: actor.id,
        actorName: actor.name,
        from: request.status,
        to: "converted",
        note: `${booking.id} · ${linkedExisting ? "existing patient" : "new patient"} ${patient.id}`,
      }),
    ),
  };
  db.homeCareRequests[idx] = updated;
  pushAudit(db, {
    action: "homecare.convert",
    entity: "booking",
    detail: `${request.id} → ${booking.id} · patient ${patient.id}`,
    actorId: actor.id,
    actorName: actor.name,
  });
  pushActivity(db, {
    kind: "booking",
    title: `Booking ${booking.id} · ${booking.patientName}`,
    detail: `Converted from ${request.id}`,
    href: "/dashboard/admin/bookings",
    actorId: actor.id,
    actorName: actor.name,
  });
  return { request: updated, booking, patient, linkedExisting };
}

function staffRoleFor(applyingFor: string): Staff["role"] {
  if (applyingFor === "Physiotherapist") return "Physio";
  if (applyingFor === "Patient Attendant" || applyingFor === "Caregiver") return "Attendant";
  return "Nurse";
}

export function hireCareerApplicant(
  db: DbShape,
  input: {
    id: string;
    password: string;
    staffRole?: Staff["role"];
    salaryPerShift: number;
    area?: string;
  },
  actor: Actor,
): Err | { application: CareerApplication; staff: Staff; email: string } {
  const idx = (db.careerApplications || []).findIndex((row) => row.id === input.id);
  if (idx < 0) return { error: "Application not found" as const };
  const application = db.careerApplications[idx];
  if (application.staffId || application.status === "joined") {
    return { error: "This applicant is already on staff." as const };
  }
  if (application.status !== "selected") {
    return { error: "Select the applicant before adding them to staff." as const };
  }
  if (!input.password || input.password.trim().length < 8) {
    return { error: "Set a login password of at least 8 characters." as const };
  }
  if (!Number.isFinite(input.salaryPerShift) || input.salaryPerShift <= 0) {
    return { error: "Per-shift salary is required." as const };
  }
  const email = application.email.trim().toLowerCase();
  if (db.users.some((user) => user.email.toLowerCase() === email)) {
    return { error: "Email already exists on a staff account. No account was created." as const };
  }
  const role = input.staffRole || staffRoleFor(application.applyingFor);
  if (role !== "Nurse" && role !== "Attendant" && role !== "Physio") {
    return { error: "Choose a valid staff role." as const };
  }

  const userId = `u-${Date.now()}`;
  const staffId = `s-${Date.now()}`;
  const user: User = {
    id: userId,
    name: application.fullName,
    email,
    password: hashPassword(input.password.trim()),
    role: "nurse",
    phone: application.mobile,
    active: true,
  };
  const staff: Staff = {
    id: staffId,
    name: application.fullName,
    userId,
    email,
    role,
    phone: application.mobile,
    dutyShift: "Morning",
    area: input.area?.trim() || application.preferredLocation || application.city,
    skills: application.skills,
    status: "available",
    rating: 5,
    shiftsCompleted: 0,
    salaryPerShift: input.salaryPerShift,
    bio: application.about,
    streetAddress: application.address,
    city: application.city,
    state: application.state,
    pincode: application.pinCode,
  };
  db.users.push(user);
  db.staff.unshift(staff);
  const updated: CareerApplication = {
    ...application,
    status: "joined",
    staffId,
    userId,
    updatedAt: new Date().toISOString(),
    history: pushRecordHistory(
      application.history,
      history("joined", {
        actorId: actor.id,
        actorName: actor.name,
        from: application.status,
        to: "joined",
        note: `Staff ${staffId}`,
      }),
    ),
  };
  db.careerApplications[idx] = updated;
  pushAudit(db, {
    action: "career.hire",
    entity: "staff",
    detail: `${application.id} → ${staffId}`,
    actorId: actor.id,
    actorName: actor.name,
  });
  pushActivity(db, {
    kind: "staff",
    title: `Staff added · ${staff.name}`,
    detail: `From application ${application.id}`,
    href: "/dashboard/admin/staff",
    actorId: actor.id,
    actorName: actor.name,
  });
  return { application: updated, staff, email };
}

export type { ShiftPreference };
