import { z } from "zod";

export const roleSchema = z.enum([
  "super_admin",
  "admin",
  "care_coordinator",
  "nurse",
  "family",
  "patient",
]);

export const loginSchema = z.object({
  email: z.string().email().max(200),
  password: z.string().min(1).max(200),
});

export const patientSchema = z.object({
  name: z.string().min(2).max(120),
  phone: z.string().min(7).max(20),
  age: z.number().int().min(0).max(120).optional(),
  gender: z.enum(["Male", "Female", "Other"]).optional(),
  address: z.string().max(400).optional(),
  area: z.string().max(120).optional(),
  notes: z.string().max(2000).optional(),
  familyUserIds: z.array(z.string()).optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

export const bookingWriteSchema = z.object({
  patientName: z.string().min(2).max(120).optional(),
  phone: z.string().min(7).max(20).optional(),
  careType: z.string().min(2).max(120).optional(),
  address: z.string().min(3).max(400).optional(),
  shift: z.enum(["8hr", "12hr", "24hr"]).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  shiftStartTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  shiftEndTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  patientId: z.string().optional(),
  assignedStaffId: z.string().optional().nullable(),
});

export const carePlanSchema = z.object({
  patientId: z.string().min(1),
  bookingId: z.string().optional(),
  title: z.string().min(2).max(160),
  goals: z.string().max(2000).optional(),
  tasks: z.array(z.string().max(200)).max(40).optional(),
  status: z.enum(["draft", "active", "completed", "cancelled"]).optional(),
});

export const vitalSchema = z.object({
  patientId: z.string().min(1),
  bookingId: z.string().optional(),
  bp: z.string().max(40).optional(),
  sugar: z.string().max(40).optional(),
  pulse: z.string().max(40).optional(),
  temp: z.string().max(40).optional(),
  spo2: z.string().max(40).optional(),
  notes: z.string().max(1000).optional(),
  recordedAt: z.string().optional(),
});

export const complaintSchema = z.object({
  subject: z.string().min(3).max(160),
  message: z.string().min(3).max(4000),
  bookingId: z.string().optional(),
  patientId: z.string().optional(),
});

export const expenseSchema = z.object({
  category: z.string().min(2).max(80),
  amount: z.number().positive().max(1_000_000),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  note: z.string().max(1000).optional(),
  staffId: z.string().optional(),
});

export const paymentSchema = z.object({
  invoiceId: z.string().min(1),
  amount: z.number().positive().max(1_000_000),
  method: z.enum(["cash", "upi", "bank", "other"]).default("upi"),
  note: z.string().max(500).optional(),
});

export const settingsSchema = z.object({
  orgName: z.string().min(2).max(120).optional(),
  supportPhone: z.string().max(30).optional(),
  supportEmail: z.string().email().optional().or(z.literal("")),
  city: z.string().max(80).optional(),
  address: z.string().max(300).optional(),
  adminName: z.string().max(120).optional(),
  logoUrl: z.union([z.string().max(2_500_000), z.literal("")]).optional(),
  gstin: z.string().max(30).optional(),
  invoiceTagline: z.string().max(160).optional(),
  upiId: z.string().max(80).optional(),
  demoLogins: z.boolean().optional(),
  defaultGeofenceM: z.number().int().min(50).max(2000).optional(),
});

export function parseBody<T>(schema: z.ZodType<T>, data: unknown) {
  const result = schema.safeParse(data);
  if (!result.success) {
    return {
      error: result.error.issues[0]?.message || "Invalid input",
      data: null as T | null,
    };
  }
  return { error: null as string | null, data: result.data };
}
