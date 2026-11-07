"use client";

import { usePathname } from "next/navigation";

export function WhatsAppFab() {
  const pathname = usePathname();
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/login")) {
    return null;
  }

  return (
    <a
      href="https://wa.me/917073231360?text=Hi%20Roshan%20Care%2C%20I%20need%20home%20nursing%20help"
      target="_blank"
      rel="noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-5 right-5 z-50 grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-[var(--shadow-lg)] transition duration-200 hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#25D366]/35"
    >
      <svg viewBox="0 0 24 24" className="h-7 w-7 fill-current" aria-hidden>
        <path d="M20.5 3.5A11 11 0 0 0 2.1 17.8L1 23l5.4-1.1A11 11 0 1 0 20.5 3.5Zm-8.5 17a9 9 0 0 1-4.6-1.3l-.3-.2-3.2.7.7-3.1-.2-.3A9 9 0 1 1 12 20.5Zm5.2-6.7c-.3-.1-1.7-.8-1.9-.9s-.5-.1-.7.1-.8.9-1 .9-.5 0-.8-.2a7.4 7.4 0 0 1-2.2-1.9 8.2 8.2 0 0 1-1.5-2.3c-.2-.4 0-.6.1-.8l.4-.5.3-.4c.1-.2 0-.4 0-.5l-.8-1.9c-.2-.5-.4-.4-.7-.4h-.6c-.2 0-.5.1-.8.4s-1 1-1 2.4 1.1 2.8 1.2 3 .2.4 2.1 3.2a14 14 0 0 0 3.2 2.5c1.4.6 1.8.6 2.4.5.4-.1 1.7-.7 1.9-1.4.2-.7.2-1.2.2-1.4 0-.1-.3-.2-.6-.3Z" />
      </svg>
    </a>
  );
}