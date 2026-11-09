import type { Metadata, Viewport } from "next";
import { Fraunces, Noto_Sans_Devanagari } from "next/font/google";
import { WhatsAppFab } from "@/components/marketing/WhatsAppFab";
import { ToastHost } from "@/components/ui/toast";
import { LocaleProvider } from "@/lib/i18n";
import "./globals.css";

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const noto = Noto_Sans_Devanagari({
  variable: "--font-body",
  subsets: ["latin", "devanagari"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Roshan Care — Home Nurse & Elderly Care in Bhilwara",
    template: "%s · Roshan Care",
  },
  description:
    "Book a home nurse in Bhilwara — elderly care, 12/24 hour nursing, post-surgery care, physiotherapy at home, and verified attendants. Call +91 70732 31360.",
  keywords: [
    "home nurse Bhilwara",
    "home nursing Bhilwara",
    "elderly care Bhilwara",
    "24 hour nurse at home",
    "attendant service Bhilwara",
    "post surgery care at home",
    "physiotherapy at home Bhilwara",
    "Roshan Care",
  ],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#087F8C",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${noto.variable} h-full antialiased`}>
      <body className="site-bg flex min-h-full flex-col font-sans">
        <LocaleProvider>
          {children}
          <ToastHost />
          <WhatsAppFab />
        </LocaleProvider>
      </body>
    </html>
  );
}
