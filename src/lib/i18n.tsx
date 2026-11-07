"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";

export type Locale = "en" | "hi";

const strings = {
  en: {
    searchPages: "Search records…",
    commandHint: "Ctrl+K",
    notifications: "Notifications",
    website: "Website",
    logout: "Logout",
    profile: "Profile",
    settings: "Settings",
    language: "Language",
    welcome: "Welcome",
    markRead: "Mark read",
    noNotifications: "No recent activity",
    sessionSoon: "Session expiring soon",
    staySignedIn: "Stay signed in",
    signOut: "Sign out",
  },
  hi: {
    searchPages: "रिकॉर्ड खोजें…",
    commandHint: "Ctrl+K",
    notifications: "सूचनाएँ",
    website: "वेबसाइट",
    logout: "लॉग आउट",
    profile: "प्रोफ़ाइल",
    settings: "सेटिंग्स",
    language: "भाषा",
    welcome: "स्वागत है",
    markRead: "पढ़ा हुआ",
    noNotifications: "कोई नई गतिविधि नहीं",
    sessionSoon: "सत्र जल्द समाप्त होगा",
    staySignedIn: "साइन इन रहें",
    signOut: "साइन आउट",
  },
} as const;

type Dict = {
  searchPages: string;
  commandHint: string;
  notifications: string;
  website: string;
  logout: string;
  profile: string;
  settings: string;
  language: string;
  welcome: string;
  markRead: string;
  noNotifications: string;
  sessionSoon: string;
  staySignedIn: string;
  signOut: string;
};

const KEY = "rc-locale";
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function readLocale(): Locale {
  try {
    const v = localStorage.getItem(KEY);
    if (v === "hi" || v === "en") return v;
  } catch {
    /* ignore */
  }
  return "en";
}

function getServerLocale(): Locale {
  return "en";
}

const LocaleContext = createContext<{
  locale: Locale;
  t: Dict;
  setLocale: (l: Locale) => void;
  toggle: () => void;
} | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const locale = useSyncExternalStore(subscribe, readLocale, getServerLocale);

  const setLocale = useCallback((l: Locale) => {
    try {
      localStorage.setItem(KEY, l);
    } catch {
      /* ignore */
    }
    emit();
  }, []);

  const toggle = useCallback(() => {
    setLocale(locale === "en" ? "hi" : "en");
  }, [locale, setLocale]);

  const value = useMemo(
    () => ({ locale, t: strings[locale] as Dict, setLocale, toggle }),
    [locale, setLocale, toggle],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    return {
      locale: "en" as Locale,
      t: strings.en as Dict,
      setLocale: () => {},
      toggle: () => {},
    };
  }
  return ctx;
}
