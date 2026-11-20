const base = "http://localhost:3000";
const pdf = `data:application/pdf;base64,${Buffer.from("%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF").toString("base64")}`;
const stamp = Date.now().toString().slice(-6);
const mobile = `98765${stamp.slice(-5)}`;
const email = `applicant.${stamp}@example.com`;

function homeBody(extra = {}) {
  return {
    contactName: "Amit Jain",
    mobile,
    email: "",
    relationship: "Son",
    patientName: `Suresh Test ${stamp}`,
    patientAge: 72,
    patientGender: "Male",
    address: "12, Subhash Nagar",
    area: "Subhash Nagar",
    city: "Bhilwara",
    state: "Rajasthan",
    pinCode: "311001",
    service: "Elderly Care",
    careDescription: "Needs help with daily routine and medicines at home.",
    mobilityAssistance: true,
    dutyHours: "12 Hours",
    preferredStartDate: "2026-12-01",
    preferredShift: "Day",
    urgency: "Normal",
    consentContact: true,
    consentPrivacy: true,
    documents: [{ label: "Prescription", name: "note.pdf", dataUrl: pdf }],
    ...extra,
  };
}

function careerBody(extra = {}) {
  return {
    fullName: `Priya Test ${stamp}`,
    mobile,
    email,
    dateOfBirth: "1998-04-12",
    gender: "Female",
    address: "44, Bapu Nagar",
    city: "Bhilwara",
    state: "Rajasthan",
    pinCode: "311001",
    applyingFor: "Nurse",
    preferredLocation: "Bhilwara",
    employmentType: "Full Time",
    preferredShift: "Day",
    highestEducation: "Graduate",
    nursingQualification: "GNM",
    institutionName: "City Nursing College",
    passingYear: "2019",
    experienceLevel: "Experienced",
    yearsOfExperience: 4,
    skills: ["Patient Care"],
    availabilityType: "Full Time",
    availabilityShift: "Day",
    joiningDate: "2026-12-15",
    documents: [{ label: "Resume", name: "resume.pdf", dataUrl: pdf }],
    consent: true,
    ...extra,
  };
}

async function call(path, options = {}) {
  const res = await fetch(base + path, options);
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text.slice(0, 180) };
  }
  return { status: res.status, json };
}

const results = [];
function check(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} ${name} — ${detail}`);
}

const missing = await call("/api/home-care-requests", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ contactName: "A" }),
});
check("home required fields", missing.status === 400, `status ${missing.status} ${missing.json?.error || ""}`);

const badMobile = await call("/api/home-care-requests", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(homeBody({ mobile: "12345" })),
});
check("home mobile", badMobile.status === 400 && /mobile/i.test(badMobile.json?.error || ""), badMobile.json?.error || missing.status);

const badFile = await call("/api/career-applications", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(
    careerBody({
      documents: [{ label: "Resume", name: "x.html", dataUrl: "data:text/html;base64,PGh0bWw+" }],
    }),
  ),
});
check("file type rejected", badFile.status === 400, badFile.json?.error || String(badFile.status));

const honeypot = await call("/api/home-care-requests", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(homeBody({ website: "http://spam.test" })),
});
check("honeypot", honeypot.status === 400, String(honeypot.status));

const home = await call("/api/home-care-requests", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(homeBody()),
});
check(
  "home submit",
  home.status === 201 && /^HCR-\d+$/.test(home.json?.id || "") && !home.json?.request,
  JSON.stringify(home.json),
);

const career = await call("/api/career-applications", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(careerBody()),
});
check(
  "career submit",
  career.status === 201 && /^APP-\d+$/.test(career.json?.id || "") && !career.json?.application,
  JSON.stringify(career.json),
);

const publicList = await call("/api/home-care-requests");
const publicCareer = await call("/api/career-applications");
const publicPatch = await call("/api/home-care-requests", {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ id: home.json?.id, action: "update", status: "confirmed" }),
});
check("public list blocked", publicList.status === 401, String(publicList.status));
check("public career list blocked", publicCareer.status === 401, String(publicCareer.status));
check("public status update blocked", publicPatch.status === 401, String(publicPatch.status));

const login = await fetch(base + "/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "super@roshancare.in", password: "super123" }),
});
const cookie = (login.headers.getSetCookie?.() || []).map((row) => row.split(";")[0]).join("; ");
check("admin login", login.status === 200 && cookie.includes("roshan_session"), `status ${login.status}`);

const auth = { cookie };
const list = await call("/api/home-care-requests", { headers: auth });
const found = (list.json?.requests || []).find((row) => row.id === home.json?.id);
check(
  "admin list",
  list.status === 200 && found && found.documents?.[0] && !found.documents[0].storedName,
  `status ${list.status} docs ${found?.documents?.length || 0}`,
);

const file = await fetch(
  `${base}/api/home-care-requests/file?id=${home.json?.id}&file=${found?.documents?.[0]?.id || ""}`,
);
const fileAuth = await fetch(
  `${base}/api/home-care-requests/file?id=${home.json?.id}&file=${found?.documents?.[0]?.id || ""}`,
  { headers: auth },
);
check("document private", file.status === 401, String(file.status));
check(
  "document download",
  fileAuth.status === 200 && (fileAuth.headers.get("content-type") || "").includes("pdf"),
  `${fileAuth.status} ${fileAuth.headers.get("content-type")}`,
);

const early = await call("/api/home-care-requests", {
  method: "PATCH",
  headers: { ...auth, "Content-Type": "application/json" },
  body: JSON.stringify({ id: home.json.id, action: "convert" }),
});
check("convert before confirm blocked", early.status === 400, early.json?.error || String(early.status));

const confirmed = await call("/api/home-care-requests", {
  method: "PATCH",
  headers: { ...auth, "Content-Type": "application/json" },
  body: JSON.stringify({
    id: home.json.id,
    action: "update",
    status: "confirmed",
    adminNotes: "Called the family",
  }),
});
check(
  "status update",
  confirmed.status === 200 && confirmed.json?.request?.status === "confirmed",
  confirmed.json?.error || confirmed.json?.request?.status,
);

const converted = await call("/api/home-care-requests", {
  method: "PATCH",
  headers: { ...auth, "Content-Type": "application/json" },
  body: JSON.stringify({ id: home.json.id, action: "convert" }),
});
check(
  "convert to booking",
  converted.status === 200 && /^BK-/.test(converted.json?.bookingId || "") && converted.json?.request?.status === "converted",
  JSON.stringify({ bookingId: converted.json?.bookingId, patientId: converted.json?.patientId, linked: converted.json?.linkedExisting }),
);

const second = await call("/api/home-care-requests", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(homeBody()),
});
await call("/api/home-care-requests", {
  method: "PATCH",
  headers: { ...auth, "Content-Type": "application/json" },
  body: JSON.stringify({ id: second.json.id, action: "update", status: "confirmed" }),
});
const linked = await call("/api/home-care-requests", {
  method: "PATCH",
  headers: { ...auth, "Content-Type": "application/json" },
  body: JSON.stringify({ id: second.json.id, action: "convert" }),
});
check(
  "duplicate patient linked",
  linked.status === 200 && linked.json?.linkedExisting === true && linked.json?.patientId === converted.json?.patientId,
  JSON.stringify({ linked: linked.json?.linkedExisting, patientId: linked.json?.patientId }),
);

const selected = await call("/api/career-applications", {
  method: "PATCH",
  headers: { ...auth, "Content-Type": "application/json" },
  body: JSON.stringify({ id: career.json.id, action: "update", status: "selected", adminRemarks: "Verified" }),
});
check("career status", selected.status === 200 && selected.json?.application?.status === "selected", selected.json?.error || selected.json?.application?.status);

const hired = await call("/api/career-applications", {
  method: "PATCH",
  headers: { ...auth, "Content-Type": "application/json" },
  body: JSON.stringify({
    id: career.json.id,
    action: "hire",
    password: "staffpass1",
    staffRole: "Nurse",
    salaryPerShift: 750,
  }),
});
check(
  "hire into staff",
  hired.status === 200 && hired.json?.application?.status === "joined" && !JSON.stringify(hired.json).includes("staffpass1"),
  JSON.stringify({ staff: hired.json?.staff, status: hired.json?.application?.status }),
);

const nurseLogin = await fetch(base + "/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "nurse@roshancare.in", password: "12345678" }),
});
const nurseCookie = (nurseLogin.headers.getSetCookie?.() || []).map((row) => row.split(";")[0]).join("; ");
const nurseList = await call("/api/career-applications", { headers: { cookie: nurseCookie } });
check("nurse cannot list applicants", nurseList.status === 403, String(nurseList.status));

const failed = results.filter((row) => !row.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
if (failed.length) process.exit(1);
