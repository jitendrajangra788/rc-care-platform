import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_Devanagari } from "next/font/google";
import { WhatsAppFab } from "@/components/marketing/WhatsAppFab";
import { ToastHost } from "@/components/ui/toast";
import { LocaleProvider } from "@/lib/i18n";
import "./globals.css";

const inter = Inter({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const noto = Noto_Sans_Devanagari({
  variable: "--font-body",
  subsets: ["latin", "devanagari"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Roshan Care — Home Nursing in Bhilwara",
    template: "%s · Roshan Care",
  },
  description:
    "Roshan Care — Trusted Home Healthcare in Bhilwara. Verified staff, clear packages, and family updates every shift.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#087F8C",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${noto.variable} h-full antialiased`}>
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
