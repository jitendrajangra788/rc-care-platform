import type { Locale } from "@/lib/i18n";

export type LocalizedText = { en: string; hi: string };

export type FaqItem = {
  q: LocalizedText;
  a: LocalizedText;
  category: "Booking" | "Pricing" | "Care" | "Family" | "Staff";
};

export type BlogPost = {
  slug: string;
  title: LocalizedText;
  excerpt: LocalizedText;
  category: string;
  readMins: number;
  publishedAt: string;
  image: string;
  tags: string[];
  body: LocalizedText[];
};

export function pick(text: LocalizedText, locale: Locale = "en") {
  return text[locale] || text.en;
}

export const faqItems: FaqItem[] = [
  {
    category: "Booking",
    q: {
      en: "How do I book a home nurse in Bhilwara?",
      hi: "Bhilwara me home nurse kaise book karein?",
    },
    a: {
      en: "Call +91 70732 31360, WhatsApp the care desk, or submit the online booking form. Share the patient condition, address, and preferred shift (8 / 12 / 24 hour). We confirm staff and timing quickly.",
      hi: "Call +91 70732 31360, WhatsApp, ya online form se book karein. Patient ki condition, address, aur shift (8 / 12 / 24 hour) bata dein. Staff aur timing jaldi confirm ho jati hai.",
    },
  },
  {
    category: "Booking",
    q: {
      en: "Can I get a nurse at home today?",
      hi: "Kya aaj hi ghar pe nurse mil sakti hai?",
    },
    a: {
      en: "Yes — for urgent home nursing we try same-day assignment in Bhilwara when staff is available. Standard requests are usually matched within 24 hours. The desk confirms ETA on call or WhatsApp.",
      hi: "Haan — urgent home nursing me Bhilwara me same-day try karte hain jab staff free ho. Normal requests usually 24 hours me match hoti hain. Desk call / WhatsApp pe ETA batati hai.",
    },
  },
  {
    category: "Pricing",
    q: {
      en: "What is the cost of home nursing care?",
      hi: "Home nursing ka charge kitna hota hai?",
    },
    a: {
      en: "Charges depend on shift length and care type (attendant, skilled nurse, night cover, or specialised skill). You get a clear quote before care starts — no hidden add-ons after confirmation.",
      hi: "Charge shift length aur care type pe depend karta hai (attendant, skilled nurse, night cover, ya special skill). Care start se pehle clear quote milta hai — confirm ke baad hidden charge nahi.",
    },
  },
  {
    category: "Pricing",
    q: {
      en: "How do I pay for nursing or attendant service?",
      hi: "Nursing / attendant payment kaise karein?",
    },
    a: {
      en: "Pay by UPI, cash, or invoice. Billing status shows in the family portal. For monthly elderly care or 24-hour nursing, the desk shares regular slips and due amounts.",
      hi: "UPI, cash, ya invoice se pay karein. Family portal pe billing status dikhta hai. Monthly elderly care ya 24-hour nursing pe desk slip aur due amount share karti hai.",
    },
  },
  {
    category: "Care",
    q: {
      en: "Which home care services do you provide?",
      hi: "Kaun-kaun si home care services milti hain?",
    },
    a: {
      en: "Home nurse, elderly care attendant, post-surgery nursing, baby care, physiotherapy at home, doctor home visit support, medical equipment on rent, and 24×7 ambulance coordination.",
      hi: "Home nurse, elderly care attendant, post-surgery nursing, baby care, ghar pe physiotherapy, doctor home visit, medical equipment rent, aur 24×7 ambulance coordination.",
    },
  },
  {
    category: "Care",
    q: {
      en: "Do you provide 12-hour and 24-hour nursing shifts?",
      hi: "12-hour aur 24-hour nursing shift milti hai?",
    },
    a: {
      en: "Yes. Families commonly book 8-hour day visits, 12-hour extended care, or 24-hour round-the-clock nursing / attendant cover for elders and bed-bound patients.",
      hi: "Haan. Aksar 8-hour day visit, 12-hour extended care, ya 24-hour round-the-clock nursing / attendant cover book hota hai — elders aur bed-bound patients ke liye.",
    },
  },
  {
    category: "Care",
    q: {
      en: "What if the assigned nurse is late or on leave?",
      hi: "Agar assigned nurse late ya leave pe ho to?",
    },
    a: {
      en: "The care desk arranges backup staff for leave, delay, or emergency. You are informed on call or WhatsApp so the patient is not left without cover.",
      hi: "Leave, delay, ya emergency pe care desk backup staff arrange karti hai. Aapko call / WhatsApp pe bataya jata hai taaki patient alone na rahe.",
    },
  },
  {
    category: "Family",
    q: {
      en: "How will my family get daily care updates?",
      hi: "Family ko daily care update kaise milenge?",
    },
    a: {
      en: "Family portal login shows duty status, medicine chart, and shift notes. Attendance is marked with location so every home nursing visit stays transparent.",
      hi: "Family portal login pe duty status, medicine chart, aur shift notes dikhte hain. Attendance location ke saath mark hoti hai — har home nursing visit transparent rehti hai.",
    },
  },
  {
    category: "Family",
    q: {
      en: "Is home nursing safe for elderly parents living alone?",
      hi: "Akela rehne wale elders ke liye home nursing safe hai?",
    },
    a: {
      en: "Yes — verified attendants and nurses support medicine timing, mobility, hygiene, and companionship. Families abroad or in another city can track updates from the portal.",
      hi: "Haan — verified attendant / nurse medicine timing, mobility, hygiene, aur companionship sambhalte hain. Bahar ya dusre city me family portal se updates dekh sakti hai.",
    },
  },
  {
    category: "Staff",
    q: {
      en: "Are your nurses and attendants verified?",
      hi: "Kya nurses aur attendants verified hain?",
    },
    a: {
      en: "Yes. Staff join after document checks and skill matching. On duty they mark attendance from the care address so families know who arrived and when.",
      hi: "Haan. Document check aur skill match ke baad staff join karti hai. Duty pe care address se attendance mark hoti hai — family ko pata rehta hai kaun aayi aur kab.",
    },
  },
  {
    category: "Staff",
    q: {
      en: "Which areas in Bhilwara do you cover?",
      hi: "Bhilwara me kaun-kaun se areas cover hote hain?",
    },
    a: {
      en: "We cover Bhilwara city and nearby localities such as Subhash Nagar, Bapu Nagar, Shastri Nagar, and surrounding belts. Mention your exact area while booking for faster matching.",
      hi: "Bhilwara city aur nearby areas — Subhash Nagar, Bapu Nagar, Shastri Nagar, aur aas-paas. Jaldi match ke liye booking pe exact area zaroor likhein.",
    },
  },
];

export const blogPosts: BlogPost[] = [
  {
    slug: "home-nursing-after-hospital-discharge",
    title: {
      en: "Home nursing after hospital discharge — the first 7 days",
      hi: "Hospital discharge ke baad ghar pe nursing — pehle 7 din",
    },
    excerpt: {
      en: "A practical checklist for wound watch, medicine timing, and mobility support after discharge — written for Bhilwara families.",
      hi: "Discharge ke baad wound watch, medicine timing, aur mobility support ka practical checklist — Bhilwara families ke liye.",
    },
    category: "Recovery",
    readMins: 6,
    publishedAt: "2026-10-12",
    image:
      "https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?auto=format&fit=crop&w=1400&q=80",
    tags: ["post-surgery", "home care", "checklist"],
    body: [
      {
        en: "Coming home from hospital can disrupt routines. The first week is the most sensitive for wounds, pain, medicines, and rest.",
        hi: "Hospital se ghar aate hi routine toot sakti hai. Pehle hafta recovery ke liye sabse sensitive hota hai — wound, pain, medicine, aur rest.",
      },
      {
        en: "Roshan Care usually matches a nurse after reviewing the doctor note, discharge summary, and shift length (8 / 12 / 24hr). Families see medicine charts and vitals updates in the family portal.",
        hi: "Roshan Care desk usually doctor note, discharge summary, aur shift length (8 / 12 / 24hr) clear karke nurse match karti hai. Family ko medicine chart aur vitals updates family portal pe milte hain.",
      },
      {
        en: "Practical tip: on day one, confirm GPS attendance and site photo so you know staff reached the right address. Ask for BP / sugar / wound notes in the evening update.",
        hi: "Practical tip: pehle din GPS attendance + site photo se confirm karein ki staff sahi address pe hai. Evening note me BP / sugar / wound observation likhwaein.",
      },
      {
        en: "For fever, sudden swelling, or uncontrolled pain, contact the doctor or emergency services first, then the care desk. Home nursing supports recovery — it does not replace emergency care.",
        hi: "Agar fever, sudden swelling, ya uncontrolled pain ho to pehle doctor / 108, phir care desk — home nurse clinical emergency replace nahi karti, support karti hai.",
      },
    ],
  },
  {
    slug: "elderly-care-at-home-bhilwara",
    title: {
      en: "Elderly care at home in Bhilwara — when you need an attendant",
      hi: "Bhilwara me elderly care at home — kab attendant chahiye",
    },
    excerpt: {
      en: "Mobility, hygiene, and medication reminders — when family cover is enough, and when a trained attendant is safer.",
      hi: "Mobility, hygiene, aur medication reminders — kab family cover kaafi hai aur kab trained attendant better hai.",
    },
    category: "Elderly",
    readMins: 5,
    publishedAt: "2026-09-28",
    image:
      "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=1400&q=80",
    tags: ["elderly", "attendants", "safety"],
    body: [
      {
        en: "Elderly care is more than companionship — it also covers fall risk, missed medicines, and hygiene gaps.",
        hi: "Elderly care sirf companionship nahi — fall risk, missed medicines, aur hygiene gaps bhi manage karna hota hai.",
      },
      {
        en: "If an elder lives alone, has night confusion, or needs bathroom assistance, a trained day/night attendant is the safer choice.",
        hi: "Agar elder alone rehte hain, night confusion hai, ya bathroom assist chahiye, trained attendant day/night cover safe choice hai.",
      },
      {
        en: "Roshan Care attendants are assigned with local reliability checks and duty tracking. Shift notes in the family portal let you follow progress even from work.",
        hi: "Roshan Care attendants local reliability + duty tracking ke saath assign hote hain. Family portal pe shift notes se aap office se bhi progress dekh sakte ho.",
      },
      {
        en: "Starting packages are usually based on 12hr / 24hr attendant shifts; skilled nurses are added when injections or wound care are needed.",
        hi: "Starting package usually 12hr / 24hr attendant shifts pe base hota hai; clinical injections / wound ke liye skilled nurse add hoti hai.",
      },
    ],
  },
  {
    slug: "gps-attendance-why-it-matters",
    title: {
      en: "Why GPS attendance matters in home nursing",
      hi: "GPS attendance kyun zaroori hai home nursing me",
    },
    excerpt: {
      en: "Present is not just a register tick — geofence at the care address, photo proof, and morning/evening marks build trust.",
      hi: "Present sirf register pe tick nahi — care address pe geofence, photo, aur morning/evening proof se trust banta hai.",
    },
    category: "Trust",
    readMins: 4,
    publishedAt: "2026-09-05",
    image:
      "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1400&q=80",
    tags: ["gps", "attendance", "transparency"],
    body: [
      {
        en: "The most common home-care worry is simple: did staff arrive on time? A paper register rarely answers that clearly.",
        hi: "Home care me sabse common tension: “staff time pe aayi ya nahi?” Paper register se yeh clear nahi hota.",
      },
      {
        en: "At Roshan Care, present is marked with GPS inside the care-site geofence plus a site photo. Morning and evening slots complete the duty.",
        hi: "Roshan Care me present care-site geofence ke andar GPS + site photo se mark hota hai. Morning aur evening dono slots duty complete banate hain.",
      },
      {
        en: "This also keeps salary rules fair — late and half-day policies stay transparent, and families can see status in the portal.",
        hi: "Isse salary fairness bhi better hoti hai — late / half-day rules transparent rehte hain, aur family ko portal pe status dikhta hai.",
      },
      {
        en: "For weak GPS or demo cases the care desk guides staff; fake-location attempts are flagged by the system.",
        hi: "Demo / weak GPS cases me care desk guide karti hai; fake location attempts system flags karta hai.",
      },
    ],
  },
  {
    slug: "medicine-chart-for-families",
    title: {
      en: "A simple medicine chart system for families at home",
      hi: "Ghar pe medicine chart — family ke liye simple system",
    },
    excerpt: {
      en: "Which medicine, when, and at what dose — a clear way to reduce confusion, with nurse login support.",
      hi: "Kaunsi dawai, kab, kis dose me — confusion kam karne ka clear way, nurse login ke saath.",
    },
    category: "Medicines",
    readMins: 5,
    publishedAt: "2026-08-18",
    image:
      "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=1400&q=80",
    tags: ["medicines", "family portal", "safety"],
    body: [
      {
        en: "Multiple medicines and multiple caregivers raise the risk of missed or double doses. You need both a written chart and a digital log.",
        hi: "Multiple medicines + multiple caregivers = miss ya double dose ka risk. Written chart + digital log dono chahiye.",
      },
      {
        en: "On duty, nurses follow the schedule and sync logs to the family portal with time, dose, and notes.",
        hi: "Nurse duty pe medicine schedule follow karti hai aur log family portal pe sync hota hai — time, dose, aur notes ke saath.",
      },
      {
        en: "Family tip: update the care desk or nurse as soon as a new prescription arrives. Keep old strips in a separate box.",
        hi: "Family tip: naya prescription aate hi care desk / nurse ko update karo. Purani strip alag box me rakho.",
      },
      {
        en: "In an emergency, showing the latest chart to a doctor is much easier when portal history is clear.",
        hi: "Emergency me latest chart doctor ko dikhana easy hota hai jab portal pe history clear ho.",
      },
    ],
  },
];

export function getPost(slug: string) {
  return blogPosts.find((p) => p.slug === slug);
}

export function faqsByCategory() {
  const map = new Map<FaqItem["category"], FaqItem[]>();
  for (const item of faqItems) {
    const list = map.get(item.category) || [];
    list.push(item);
    map.set(item.category, list);
  }
  return map;
}
