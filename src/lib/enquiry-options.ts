export const HOME_SERVICES = [
  "Skilled Nursing",
  "Home Care Nursing",
  "Elderly Care",
  "Patient Attendant",
  "Post-operative Care",
  "ICU Care at Home",
  "Other",
] as const;

export const HOME_DUTIES = ["8 Hours", "12 Hours", "24 Hours", "Short Term", "Long Term"] as const;
export const SHIFT_PREFS = ["Day", "Night", "Rotational"] as const;

export const HOME_STATUSES = [
  "new",
  "contacted",
  "assessment_scheduled",
  "quotation_sent",
  "confirmed",
  "converted",
  "rejected",
  "cancelled",
] as const;

export const JOB_ROLES = [
  "Nurse",
  "Caregiver",
  "Patient Attendant",
  "ICU Nurse",
  "Physiotherapist",
  "Other",
] as const;

export const EDUCATIONS = ["10th", "12th", "Diploma", "Graduate", "Post Graduate", "Other"] as const;

export const NURSING_QUALIFICATIONS = [
  "ANM",
  "GNM",
  "B.Sc Nursing",
  "M.Sc Nursing",
  "Caregiver Certificate",
  "None",
  "Other",
] as const;

export const CAREER_SKILLS = [
  "Patient Care",
  "Elderly Care",
  "Bedside Care",
  "ICU Care",
  "Injection and Dressing",
  "Mobility Assistance",
  "Other",
] as const;

export const CAREER_STATUSES = [
  "new",
  "under_review",
  "shortlisted",
  "interview_scheduled",
  "selected",
  "rejected",
  "joined",
] as const;

export const HOME_DOC_LABELS = ["Prescription", "Doctor Instructions", "Medical Report"] as const;
export const CAREER_DOC_LABELS = ["Resume", "Qualification Certificate", "Experience Certificate"] as const;

export const HOME_STATUS_LABEL = {
  new: "New Request",
  contacted: "Contacted",
  assessment_scheduled: "Assessment Scheduled",
  quotation_sent: "Quotation Sent",
  confirmed: "Confirmed",
  converted: "Converted to Booking",
  rejected: "Rejected",
  cancelled: "Cancelled",
} as const;

export const CAREER_STATUS_LABEL = {
  new: "New",
  under_review: "Under Review",
  shortlisted: "Shortlisted",
  interview_scheduled: "Interview Scheduled",
  selected: "Selected",
  rejected: "Rejected",
  joined: "Joined",
} as const;
