export type Role =
  | "super_admin"
  | "admin"
  | "care_coordinator"
  | "nurse"
  | "family"
  | "patient";

export type User = {
  id: string;
  name: string;
  email: string;
  /** scrypt hash or legacy plaintext (migrated on login) */
  password: string;
  role: Role;
  phone?: string;
  active?: boolean;
};

export type SessionUser = Omit<User, "password">;

export type Staff = {
  id: string;
  name: string;
  userId?: string;
  role: "Nurse" | "Attendant" | "Physio";
  skills: string[];
  area: string;
  status: "available" | "on-duty" | "leave";
  rating: number;
  shiftsCompleted: number;
  phone: string;
  email?: string;
  photoUrl?: string;
  bio?: string;
  salaryMonthly?: number;
  salaryPerShift: number;
  performanceScore?: number;
  /** Legacy HR fields (old PHP staff table) */
  fatherName?: string;
  alternativeMobile?: string;
  familyMobile?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  pincode?: string;
  permanentAddress?: string;
  aadharNumber?: string;
};

export type CareLocation = {
  id: string;
  locationName: string;
  address: string;
  city?: string;
  lat: number;
  lng: number;
  geofenceRadiusM?: number;
  notes?: string;
  createdAt: string;
};

export type SiteAllotment = {
  id: string;
  locationId: string;
  staffId: string;
  bookingId?: string;
  shift: "Morning" | "Evening" | "Night" | "Day" | "24 Hours" | "8hr" | "12hr" | "24hr";
  startDate: string;
  endDate?: string;
  status: "active" | "completed" | "cancelled";
  createdAt: string;
};

export type MonthlySalary = {
  id: string;
  staffId: string;
  month: number;
  year: number;
  workingDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  halfDays: number;
  basicSalary: number;
  deductions: number;
  bonus: number;
  netSalary: number;
  status: "pending" | "paid";
  createdAt: string;
  paidAt?: string;
};

export type BookingStatus =
  | "pending"
  | "assigned"
  | "active"
  | "completed"
  | "cancelled";

export type Booking = {
  id: string;
  patientName: string;
  /** Linked CRM patient (dual-read with patientName during migration) */
  patientId?: string;
  careType: string;
  shift: "8hr" | "12hr" | "24hr";
  address: string;
  area: string;
  startDate: string;
  phone: string;
  notes?: string;
  status: BookingStatus;
  assignedStaffId?: string;
  backupStaffId?: string;
  familyUserId?: string;
  amount: number;
  createdAt: string;
  lat?: number;
  lng?: number;
  geofenceRadiusM?: number;
  patientAge?: number;
  gender?: "Male" | "Female" | "Other";
  endDate?: string;
  priority?: "normal" | "urgent";
  guardianName?: string;
  staffPayPerShift?: number;
  upiId?: string;
  /** 4–6 digit site PIN staff enters with morning/evening present */
  sitePin?: string;
  /** Configurable duty window (HH:mm). Defaults from shift preset when omitted. */
  shiftStartTime?: string;
  shiftEndTime?: string;
};

export type Patient = {
  id: string;
  name: string;
  phone: string;
  age?: number;
  gender?: "Male" | "Female" | "Other";
  address?: string;
  area?: string;
  notes?: string;
  familyUserIds: string[];
  /** Optional login user for patient portal */
  userId?: string;
  status: "active" | "inactive";
  createdAt: string;
};

export type CarePlan = {
  id: string;
  patientId: string;
  bookingId?: string;
  title: string;
  goals?: string;
  tasks: string[];
  status: "draft" | "active" | "completed" | "cancelled";
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
};

export type VitalRecord = {
  id: string;
  patientId: string;
  bookingId?: string;
  recordedBy: string;
  recordedByName: string;
  bp?: string;
  sugar?: string;
  pulse?: string;
  temp?: string;
  spo2?: string;
  notes?: string;
  recordedAt: string;
  createdAt: string;
};

export type CareReport = {
  id: string;
  patientId: string;
  bookingId?: string;
  dutyDate: string;
  summary: string;
  vitalsNote?: string;
  medsNote?: string;
  /** daily shift note vs full complete patient report */
  reportType?: "daily" | "complete";
  conditionNote?: string;
  tasksDone?: string;
  familyUpdate?: string;
  attachmentUrl?: string;
  attachmentName?: string;
  /** Doctor review / check on the report */
  doctorChecked?: boolean;
  doctorName?: string;
  doctorRemarks?: string;
  doctorCheckedAt?: string;
  doctorCheckedBy?: string;
  doctorCheckedByName?: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
};

export type Complaint = {
  id: string;
  subject: string;
  message: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  bookingId?: string;
  patientId?: string;
  raisedByUserId: string;
  raisedByName: string;
  raisedByRole: Role;
  response?: string;
  createdAt: string;
  updatedAt?: string;
};

export type Expense = {
  id: string;
  category: string;
  amount: number;
  date: string;
  note?: string;
  staffId?: string;
  receiptUrl?: string;
  createdBy: string;
  createdAt: string;
};

export type PaymentRecord = {
  id: string;
  invoiceId: string;
  amount: number;
  method: "cash" | "upi" | "bank" | "other";
  note?: string;
  recordedBy: string;
  recordedByName: string;
  createdAt: string;
};

export type AppNotification = {
  id: string;
  userId: string;
  title: string;
  body?: string;
  href?: string;
  readAt?: string;
  createdAt: string;
};

export type AppSettings = {
  orgName: string;
  supportPhone: string;
  supportEmail: string;
  city: string;
  /** Street / clinic address for invoices */
  address?: string;
  /** Billing contact / admin display name */
  adminName?: string;
  /** Logo as data URL or public path */
  logoUrl?: string;
  /** Optional GSTIN / tax id on bills */
  gstin?: string;
  /** Invoice footer / tagline */
  invoiceTagline?: string;
  /** UPI ID shown on printed bills */
  upiId?: string;
  demoLogins: boolean;
  defaultGeofenceM: number;
  updatedAt?: string;
};

/** Admin-marked nurse day availability (beyond leave + assigned duties). */
export type NurseAvailability = {
  id: string;
  staffId: string;
  date: string;
  status: "available" | "unavailable" | "preferred";
  note?: string;
  shiftHint?: "8hr" | "12hr" | "24hr";
  createdAt: string;
};

export type Invoice = {
  id: string;
  bookingId: string;
  patientName: string;
  amount: number;
  paid: number;
  status: "unpaid" | "partial" | "paid";
  dueDate: string;
};

export type CareNote = {
  id: string;
  bookingId: string;
  nurseId: string;
  vitals: {
    bp?: string;
    sugar?: string;
    pulse?: string;
    temp?: string;
  };
  notes: string;
  createdAt: string;
};

export type Lead = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  careType: string;
  message: string;
  status: "new" | "contacted" | "converted";
  createdAt: string;
};

export type AttendanceSlot = "morning" | "evening";

export type AttendancePunctuality = "present" | "late" | "half-day";

export type Attendance = {
  id: string;
  bookingId: string;
  staffId: string;
  nurseId: string;
  type: AttendanceSlot | "present" | "checkout";
  dutyDate: string;
  lat: number;
  lng: number;
  accuracy?: number;
  distanceMeters: number;
  withinGeofence: boolean;
  photoUrl: string;
  photoHash?: string;
  gpsQuality?: "good" | "ok" | "weak" | "unknown";
  /** Old HCMS parity: present / late / half-day */
  punctualityStatus?: AttendancePunctuality;
  minutesLate?: number;
  /** Shift × punctuality multiplier (24hr=2, half-day=0.5) */
  salaryMultiplier?: number;
  /** Admin desk marked this present on behalf of staff */
  markedByAdmin?: boolean;
  adminNote?: string;
  createdAt: string;
};

export type SalaryPayout = {
  id: string;
  staffId: string;
  bookingId: string;
  patientName: string;
  dutyDate: string;
  amount: number;
  morningAttendanceId: string;
  eveningAttendanceId: string;
  status: "earned" | "paid";
  createdAt: string;
};

export type MedicationType = "tablet" | "syrup" | "injection" | "iv" | "ointment" | "other";

export type MedicationLog = {
  id: string;
  bookingId: string;
  staffId: string;
  nurseId: string;
  patientName: string;
  medicineName: string;
  type: MedicationType;
  dose: string;
  route?: string;
  timeGiven: string;
  notes?: string;
  photoUrl?: string;
  createdAt: string;
};

export type LeaveRequest = {
  id: string;
  staffId: string;
  staffName: string;
  fromDate: string;
  toDate: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  decidedAt?: string;
};

export type StaffDocument = {
  id: string;
  staffId: string;
  title: string;
  kind: "id" | "certificate" | "vaccine" | "other";
  fileUrl: string;
  expiryDate?: string;
  createdAt: string;
};

export type SosAlert = {
  id: string;
  bookingId: string;
  patientName: string;
  raisedByUserId: string;
  raisedByName: string;
  raisedByRole: Role;
  message: string;
  status: "open" | "acknowledged" | "resolved";
  createdAt: string;
  updatedAt?: string;
};

export type MedSchedule = {
  id: string;
  bookingId: string;
  patientName: string;
  medicineName: string;
  type: MedicationType;
  dose: string;
  times: string[];
  notes?: string;
  active: boolean;
  createdAt: string;
};

export type SalaryAdvance = {
  id: string;
  staffId: string;
  amount: number;
  reason: string;
  status: "open" | "deducted" | "closed";
  createdAt: string;
};

export type DoctorNote = {
  id: string;
  bookingId: string;
  patientName: string;
  doctorName: string;
  notes: string;
  visitDate: string;
  createdBy: string;
  createdAt: string;
};

export type CallLog = {
  id: string;
  bookingId: string;
  patientName: string;
  direction: "outbound" | "inbound";
  summary: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
};

export type AuditLog = {
  id: string;
  actorId?: string;
  actorName?: string;
  action: string;
  entity: string;
  detail?: string;
  createdAt: string;
};

export type ActivityKind =
  | "booking"
  | "attendance"
  | "medication"
  | "note"
  | "billing"
  | "lead"
  | "staff"
  | "system"
  | "sos"
  | "leave"
  | "complaint"
  | "patient";

export type ActivityEvent = {
  id: string;
  kind: ActivityKind;
  title: string;
  detail?: string;
  href?: string;
  actorId?: string;
  actorName?: string;
  createdAt: string;
  readBy?: string[];
};

export type DbShape = {
  users: User[];
  staff: Staff[];
  bookings: Booking[];
  invoices: Invoice[];
  careNotes: CareNote[];
  leads: Lead[];
  attendance: Attendance[];
  medications: MedicationLog[];
  activities: ActivityEvent[];
  salaryPayouts: SalaryPayout[];
  monthlySalaries: MonthlySalary[];
  careLocations: CareLocation[];
  siteAllotments: SiteAllotment[];
  leaves: LeaveRequest[];
  nurseAvailability: NurseAvailability[];
  documents: StaffDocument[];
  sosAlerts: SosAlert[];
  medSchedules: MedSchedule[];
  advances: SalaryAdvance[];
  doctorNotes: DoctorNote[];
  callLogs: CallLog[];
  auditLogs: AuditLog[];
  patients: Patient[];
  carePlans: CarePlan[];
  vitals: VitalRecord[];
  careReports: CareReport[];
  complaints: Complaint[];
  expenses: Expense[];
  payments: PaymentRecord[];
  notifications: AppNotification[];
  settings: AppSettings;
};
