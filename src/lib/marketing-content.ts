export type FaqItem = {
  q: string;
  a: string;
  category: "Booking" | "Pricing" | "Care" | "Family" | "Staff";
};

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readMins: number;
  publishedAt: string;
  image: string;
  tags: string[];
  body: string[];
};

export const faqItems: FaqItem[] = [
  {
    category: "Booking",
    q: "Kitni jaldi nurse assign hoti hai?",
    a: "Urgent cases me same-day cover try karte hain. Standard requests usually 24 hours me match ho jaate hain — skill, shift length, aur area pe depend karta hai. Care desk WhatsApp / call pe ETA confirm karti hai.",
  },
  {
    category: "Booking",
    q: "Online book ke baad kya hota hai?",
    a: "Request care desk ko milti hai. Team patient need, address, aur shift verify karti hai, phir verified staff assign hoti hai. Aapko call / WhatsApp pe confirmation milta hai.",
  },
  {
    category: "Pricing",
    q: "Package rate final hai kya?",
    a: "Listed rates starting packages hain (₹900 / ₹1,200 / ₹2,200 per shift type). Clinical complexity, night cover, ya specialist skill pe final quote care desk confirm karti hai — pehle clear bataya jata hai.",
  },
  {
    category: "Pricing",
    q: "Payment kaise hota hai?",
    a: "Cash, UPI, ya invoice ke through. Family portal pe billing status dikhta hai. Monthly continuous care pe slip / statement care desk se mil sakta hai.",
  },
  {
    category: "Care",
    q: "Kaun-kaun si services milti hain?",
    a: "Skilled nursing, elderly attendant care, post-surgery support, mother & baby, wound care, injections / IV support, vitals logging, aur medicine chart — shift ke hisaab se 8hr / 12hr / 24hr.",
  },
  {
    category: "Care",
    q: "Staff replace kaise hota hai?",
    a: "Leave, delay, ya emergency pe care desk backup assign karti hai. Aapko call / WhatsApp pe confirm kiya jata hai taaki patient alone na rahe.",
  },
  {
    category: "Family",
    q: "Family updates kaise milte hain?",
    a: "Family login pe duty status, medicine chart, aur care notes dikhte hain. Attendance GPS + site photo ke saath mark hoti hai, isliye shift transparency rehti hai.",
  },
  {
    category: "Family",
    q: "Kya main live care dekh sakta hoon?",
    a: "Haan — assigned family account pe live care / updates section me recent notes, meds, aur duty progress dikhta hai. SOS / complaints bhi portal se raise ho sakte hain.",
  },
  {
    category: "Staff",
    q: "Nurses verified kaise hote hain?",
    a: "Documents, skill match, aur local reliability check ke baad roster pe aate hain. Duty pe GPS geofence + photo attendance hoti hai — old Roshan system se advanced tracking ke saath.",
  },
  {
    category: "Staff",
    q: "Bhilwara ke bahar service hai?",
    a: "Primary focus Bhilwara city belt hai. Nearby areas pe request ke hisaab se staff reachability confirm karke decide karte hain — booking pe area zaroor likhein.",
  },
];

export const blogPosts: BlogPost[] = [
  {
    slug: "home-nursing-after-hospital-discharge",
    title: "Hospital discharge ke baad ghar pe nursing — pehle 7 din",
    excerpt:
      "Discharge ke baad wound watch, medicine timing, aur mobility support ka practical checklist — Bhilwara families ke liye.",
    category: "Recovery",
    readMins: 6,
    publishedAt: "2026-10-12",
    image:
      "https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?auto=format&fit=crop&w=1400&q=80",
    tags: ["post-surgery", "home care", "checklist"],
    body: [
      "Hospital se ghar aate hi routine toot sakti hai. Pehle hafta recovery ke liye sabse sensitive hota hai — wound, pain, medicine, aur rest.",
      "Roshan Care desk usually doctor note, discharge summary, aur shift length (8 / 12 / 24hr) clear karke nurse match karti hai. Family ko medicine chart aur vitals updates family portal pe milte hain.",
      "Practical tip: pehle din GPS attendance + site photo se confirm karein ki staff sahi address pe hai. Evening note me BP / sugar / wound observation likhwaein.",
      "Agar fever, sudden swelling, ya uncontrolled pain ho to pehle doctor / 108, phir care desk — home nurse clinical emergency replace nahi karti, support karti hai.",
    ],
  },
  {
    slug: "elderly-care-at-home-bhilwara",
    title: "Bhilwara me elderly care at home — kab attendant chahiye",
    excerpt:
      "Mobility, hygiene, aur medication reminders — kab family cover kaafi hai aur kab trained attendant better hai.",
    category: "Elderly",
    readMins: 5,
    publishedAt: "2026-09-28",
    image:
      "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=1400&q=80",
    tags: ["elderly", "attendants", "safety"],
    body: [
      "Elderly care sirf companionship nahi — fall risk, missed medicines, aur hygiene gaps bhi manage karna hota hai.",
      "Agar elder alone rehte hain, night confusion hai, ya bathroom assist chahiye, trained attendant day/night cover safe choice hai.",
      "Roshan Care attendants local reliability + duty tracking ke saath assign hote hain. Family portal pe shift notes se aap office se bhi progress dekh sakte ho.",
      "Starting package usually 12hr / 24hr attendant shifts pe base hota hai; clinical injections / wound ke liye skilled nurse add hoti hai.",
    ],
  },
  {
    slug: "gps-attendance-why-it-matters",
    title: "GPS attendance kyun zaroori hai home nursing me",
    excerpt:
      "Present sirf register pe tick nahi — care address pe geofence, photo, aur morning/evening proof se trust banta hai.",
    category: "Trust",
    readMins: 4,
    publishedAt: "2026-09-05",
    image:
      "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1400&q=80",
    tags: ["gps", "attendance", "transparency"],
    body: [
      "Home care me sabse common tension: “staff time pe aayi ya nahi?” Paper register se yeh clear nahi hota.",
      "Roshan Care me present care-site geofence ke andar GPS + site photo se mark hota hai. Morning aur evening dono slots duty complete banate hain.",
      "Isse salary fairness bhi better hoti hai — late / half-day rules transparent rehte hain, aur family ko portal pe status dikhta hai.",
      "Demo / weak GPS cases me care desk guide karti hai; fake location attempts system flags karta hai.",
    ],
  },
  {
    slug: "medicine-chart-for-families",
    title: "Ghar pe medicine chart — family ke liye simple system",
    excerpt:
      "Kaunsi dawai, kab, kis dose me — confusion kam karne ka clear way, nurse login ke saath.",
    category: "Medicines",
    readMins: 5,
    publishedAt: "2026-08-18",
    image:
      "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=1400&q=80",
    tags: ["medicines", "family portal", "safety"],
    body: [
      "Multiple medicines + multiple caregivers = miss ya double dose ka risk. Written chart + digital log dono chahiye.",
      "Nurse duty pe medicine schedule follow karti hai aur log family portal pe sync hota hai — time, dose, aur notes ke saath.",
      "Family tip: naya prescription aate hi care desk / nurse ko update karo. Purani strip alag box me rakho.",
      "Emergency me latest chart doctor ko dikhana easy hota hai jab portal pe history clear ho.",
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
