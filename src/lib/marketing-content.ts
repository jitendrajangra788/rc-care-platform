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
      en: "How quickly can a nurse be assigned?",
      hi: "Nurse kitni jaldi assign hoti hai?",
    },
    a: {
      en: "For urgent cases we try same-day cover. Standard requests are usually matched within 24 hours, depending on skill, shift length, and area. The care desk confirms ETA on WhatsApp or phone.",
      hi: "Urgent cases me same-day cover try karte hain. Standard requests usually 24 hours me match ho jaate hain — skill, shift length, aur area pe depend karta hai. Care desk WhatsApp / call pe ETA confirm karti hai.",
    },
  },
  {
    category: "Booking",
    q: {
      en: "What happens after I book online?",
      hi: "Online book ke baad kya hota hai?",
    },
    a: {
      en: "Your request reaches the care desk. The team verifies patient needs, address, and shift, then assigns verified staff. You get confirmation by call or WhatsApp.",
      hi: "Request care desk ko milti hai. Team patient need, address, aur shift verify karti hai, phir verified staff assign hoti hai. Aapko call / WhatsApp pe confirmation milta hai.",
    },
  },
  {
    category: "Pricing",
    q: {
      en: "Are the package rates final?",
      hi: "Package rate final hai kya?",
    },
    a: {
      en: "Listed rates are starting packages (₹900 / ₹1,200 / ₹2,200 by shift type). Final quotes depend on clinical complexity, night cover, or specialist skill — always confirmed clearly before care starts.",
      hi: "Listed rates starting packages hain (₹900 / ₹1,200 / ₹2,200 per shift type). Clinical complexity, night cover, ya specialist skill pe final quote care desk confirm karti hai — pehle clear bataya jata hai.",
    },
  },
  {
    category: "Pricing",
    q: {
      en: "How do payments work?",
      hi: "Payment kaise hota hai?",
    },
    a: {
      en: "Pay by cash, UPI, or invoice. Billing status appears in the family portal. For continuous monthly care, slips and statements are available from the care desk.",
      hi: "Cash, UPI, ya invoice ke through. Family portal pe billing status dikhta hai. Monthly continuous care pe slip / statement care desk se mil sakta hai.",
    },
  },
  {
    category: "Care",
    q: {
      en: "Which services do you offer?",
      hi: "Kaun-kaun si services milti hain?",
    },
    a: {
      en: "Skilled nursing, elderly attendant care, post-surgery support, mother & baby care, wound care, injections / IV support, vitals logging, and medicine charts — in 8hr / 12hr / 24hr shifts.",
      hi: "Skilled nursing, elderly attendant care, post-surgery support, mother & baby, wound care, injections / IV support, vitals logging, aur medicine chart — shift ke hisaab se 8hr / 12hr / 24hr.",
    },
  },
  {
    category: "Care",
    q: {
      en: "How are staff replacements handled?",
      hi: "Staff replace kaise hota hai?",
    },
    a: {
      en: "For leave, delay, or emergencies the care desk assigns backup staff. You are informed by call or WhatsApp so the patient is never left without cover.",
      hi: "Leave, delay, ya emergency pe care desk backup assign karti hai. Aapko call / WhatsApp pe confirm kiya jata hai taaki patient alone na rahe.",
    },
  },
  {
    category: "Family",
    q: {
      en: "How do families receive updates?",
      hi: "Family updates kaise milte hain?",
    },
    a: {
      en: "Family login shows duty status, medicine charts, and care notes. Attendance is marked with GPS and a site photo, so every shift stays transparent.",
      hi: "Family login pe duty status, medicine chart, aur care notes dikhte hain. Attendance GPS + site photo ke saath mark hoti hai, isliye shift transparency rehti hai.",
    },
  },
  {
    category: "Family",
    q: {
      en: "Can I follow live care progress?",
      hi: "Kya main live care dekh sakta hoon?",
    },
    a: {
      en: "Yes — assigned family accounts can open Live Care / Updates for recent notes, medicines, and duty progress. SOS and complaints can also be raised from the portal.",
      hi: "Haan — assigned family account pe live care / updates section me recent notes, meds, aur duty progress dikhta hai. SOS / complaints bhi portal se raise ho sakte hain.",
    },
  },
  {
    category: "Staff",
    q: {
      en: "How are nurses verified?",
      hi: "Nurses verified kaise hote hain?",
    },
    a: {
      en: "Staff join the roster after document checks, skill matching, and local reliability review. On duty they use GPS geofence plus photo attendance for advanced tracking.",
      hi: "Documents, skill match, aur local reliability check ke baad roster pe aate hain. Duty pe GPS geofence + photo attendance hoti hai — advanced tracking ke saath.",
    },
  },
  {
    category: "Staff",
    q: {
      en: "Do you serve areas outside Bhilwara?",
      hi: "Bhilwara ke bahar service hai?",
    },
    a: {
      en: "Our primary focus is the Bhilwara city belt. Nearby areas are considered case by case based on staff reachability — please mention the area clearly when booking.",
      hi: "Primary focus Bhilwara city belt hai. Nearby areas pe request ke hisaab se staff reachability confirm karke decide karte hain — booking pe area zaroor likhein.",
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
