"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  ClipboardList,
  FileText,
  FolderOpen,
  Gauge,
  Globe,
  HeartPulse,
  Inbox,
  LayoutDashboard,
  LogOut,
  MapPin,
  MapPinned,
  Menu,
  MessageSquareWarning,
  PlusCircle,
  Radio,
  Receipt,
  Search,
  Settings,
  Stethoscope,
  Syringe,
  UserRound,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  flattenNav,
  groupHasActive,
  isNavActive,
  isNavGroup,
  navForUser,
  type NavIcon,
  type NavItem,
} from "@/lib/nav";
import type { SessionUser } from "@/lib/types";
import { ActivityBell } from "@/components/dashboard/ActivityBell";
import { Breadcrumbs } from "@/components/dashboard/Breadcrumbs";
import { CommandPalette } from "@/components/dashboard/CommandPalette";
import { SessionTimeoutDialog } from "@/components/dashboard/SessionTimeoutDialog";
import { UserMenu } from "@/components/dashboard/UserMenu";
import { Badge } from "@/components/ui/Badge";
import { LocaleProvider, useLocale } from "@/lib/i18n";

const icons: Record<NavIcon, React.ComponentType<{ className?: string }>> = {
  overview: LayoutDashboard,
  bookings: CalendarDays,
  staff: Users,
  billing: Receipt,
  leads: Inbox,
  duties: ClipboardList,
  notes: FileText,
  profile: UserRound,
  updates: Bell,
  request: PlusCircle,
  attendance: MapPinned,
  medications: Syringe,
  payroll: Wallet,
  ops: Gauge,
  hr: FolderOpen,
  live: Radio,
  locations: MapPin,
  salary: Wallet,
  schedule: CalendarDays,
  patients: Users,
  care: ClipboardList,
  vitals: HeartPulse,
  complaints: MessageSquareWarning,
  expenses: Wallet,
  reports: FileText,
  notifications: Bell,
  settings: Settings,
  users: Users,
  clinical: Stethoscope,
  finance: Wallet,
  operations: BriefcaseBusiness,
  system: Settings,
};

const COLLAPSE_KEY = "rc-sidebar-collapsed";

function subscribeAlwaysMounted() {
  return () => {};
}

function getClientMounted() {
  return true;
}

function getServerMounted() {
  return false;
}

function readCollapsed() {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
}

export function DashboardShell({
  user,
  avatarUrl,
  children,
}: {
  user: SessionUser;
  avatarUrl?: string;
  children: React.ReactNode;
}) {
  return (
    <LocaleProvider>
      <DashboardShellInner user={user} avatarUrl={avatarUrl}>
        {children}
      </DashboardShellInner>
    </LocaleProvider>
  );
}

function DashboardShellInner({
  user,
  avatarUrl,
  children,
}: {
  user: SessionUser;
  avatarUrl?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { t, locale, toggle } = useLocale();
  const [open, setOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const mounted = useSyncExternalStore(
    subscribeAlwaysMounted,
    getClientMounted,
    getServerMounted,
  );
  const [collapsed, setCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const links = useMemo(
    () => navForUser(user),
    // Role/id are enough — avoid new object identity resetting nav each render
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user.id, user.role],
  );
  const flatLinks = useMemo(() => flattenNav(links), [links]);

  useEffect(() => {
    const id = window.setTimeout(() => setCollapsed(readCollapsed()), 0);
    return () => window.clearTimeout(id);
  }, []);

  // Auto-expand only the group that owns the current page (on route change).
  useEffect(() => {
    const id = window.setTimeout(() => {
      setOpenGroups((prev) => {
        const next = { ...prev };
        let changed = false;
        for (const entry of links) {
          if (!isNavGroup(entry)) continue;
          if (groupHasActive(pathname, entry) && next[entry.id] !== true) {
            next[entry.id] = true;
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 0);
    return () => window.clearTimeout(id);
  }, [pathname, links]);

  function toggleCollapse() {
    setCollapsed((v) => {
      const next = !v;
      try {
        localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  function toggleGroup(id: string) {
    setOpenGroups((prev) => {
      const currentlyOpen = prev[id] === true;
      if (currentlyOpen) return { ...prev, [id]: false };
      // Accordion: only one section open at a time
      const next: Record<string, boolean> = {};
      for (const entry of links) {
        if (isNavGroup(entry)) next[entry.id] = entry.id === id;
      }
      return next;
    });
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    const { toast } = await import("@/components/ui/toast");
    toast.success("Logged out successfully");
    router.push("/login");
    router.refresh();
  }

  function renderLink(link: NavItem, compact: boolean, nested = false) {
    const Icon = icons[link.icon];
    const active = mounted && isNavActive(pathname, link.href);
    return (
      <Link
        key={link.href}
        href={link.href}
        prefetch={false}
        title={compact ? link.label : undefined}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(false);
        }}
        className={cn(
          "relative z-10 flex items-center gap-2 rounded-xl text-sm font-medium transition pointer-events-auto",
          compact ? "justify-center px-2 py-2.5" : nested ? "px-3 py-2" : "px-3 py-2.5",
          active
            ? "bg-primary text-[var(--sidebar-fg)] shadow-sm"
            : "text-[var(--sidebar-fg-muted)] hover:bg-[var(--sidebar-surface)] hover:text-[var(--sidebar-fg)]",
        )}
      >
        <Icon className={cn("h-4 w-4 shrink-0", nested && "ml-0.5")} />
        {!compact ? <span>{link.label}</span> : null}
      </Link>
    );
  }

  const sidebar = (compact: boolean) => (
    <div className="sidebar-rail flex h-full flex-col text-[var(--sidebar-fg)]">
      <div className={cn("border-b border-[var(--sidebar-line)]", compact ? "px-3 py-2" : "px-5 py-2")}>
        <Link href="/" className="sidebar-brand block">
          {compact ? (
            <span className="font-display sidebar-brand grid h-10 w-10 place-items-center rounded-xl bg-primary text-lg">
              R
            </span>
          ) : (
            <>
              <span className="font-display sidebar-brand text-2xl tracking-[-0.03em]">
                Roshan Care
              </span>
              <p className="sidebar-brand-meta mt-1 text-[10px] font-semibold uppercase tracking-[0.2em]">
                {user.role} panel
              </p>
            </>
          )}
        </Link>
      </div>

      <nav
        className={cn(
          "scrollbar-thin relative z-10 flex-1 space-y-1 overflow-y-auto py-2",
          compact ? "px-2" : "px-3",
        )}
      >
        {links.map((entry) => {
          if (!isNavGroup(entry)) {
            return renderLink(entry, compact);
          }

          const GroupIcon = icons[entry.icon];
          const groupActive = mounted && groupHasActive(pathname, entry);
          const expanded = compact ? false : openGroups[entry.id] === true;

          if (compact) {
            return (
              <div key={entry.id} className="space-y-1">
                {entry.children.map((child) => renderLink(child, true))}
              </div>
            );
          }

          return (
            <div key={entry.id} className="relative z-10 pt-1">
              <button
                type="button"
                onClick={() => toggleGroup(entry.id)}
                className={cn(
                  "flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition",
                  groupActive
                    ? "bg-[var(--sidebar-surface)] text-[var(--sidebar-fg)] ring-1 ring-[color-mix(in_srgb,var(--sidebar-fg)_18%,transparent)]"
                    : "text-[var(--sidebar-fg-soft)] hover:bg-[var(--sidebar-surface)] hover:text-[var(--sidebar-fg)]",
                )}
              >
                <GroupIcon className="h-4 w-4 shrink-0" />
                <span className="flex-1">{entry.label}</span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 transition-transform",
                    expanded ? "rotate-0" : "-rotate-90",
                  )}
                />
              </button>
              {expanded ? (
                <div className="relative z-10 mt-1 ml-3 space-y-0.5 border-l border-[var(--sidebar-line)] pl-2">
                  {entry.children.map((child) => renderLink(child, false, true))}
                </div>
              ) : null}
            </div>
          );
        })}
      </nav>

      <div className={cn("border-t border-[var(--sidebar-line)]", compact ? "p-2" : "p-4")}>
        {!compact ? (
          <div className="flex items-center gap-2 rounded-2xl bg-[var(--sidebar-surface)] px-3 py-3">
            <div className="h-10 w-10 overflow-hidden rounded-full bg-[var(--sidebar-line)]">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt={user.name} className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full place-items-center text-sm font-semibold text-[var(--sidebar-fg)]">
                  {user.name.slice(0, 1)}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="font-name sidebar-user-name truncate text-sm">{user.name}</p>
              <p className="sidebar-user-meta truncate text-xs">{user.email}</p>
            </div>
          </div>
        ) : null}
        <button
          type="button"
          onClick={logout}
          title="Logout"
          className={cn(
            "sidebar-logout mt-3 inline-flex items-center justify-center gap-2 rounded-full text-sm font-semibold transition hover:bg-[var(--secondary)]",
            compact ? "h-10 w-full px-0" : "w-full px-4 py-2.5",
          )}
        >
          <LogOut className="h-4 w-4" />
          {!compact ? t.logout : null}
        </button>
      </div>
    </div>
  );

  const asideWidth = collapsed ? "lg:w-[4.5rem]" : "lg:w-64";
  const mainPad = collapsed ? "lg:pl-[4.5rem]" : "lg:pl-64";

  return (
    <div
      className={cn(
        "min-h-screen overflow-x-hidden bg-paper",
        user.role === "nurse" && "nurse-ops",
      )}
    >
      <CommandPalette links={flatLinks} open={cmdOpen} onOpenChange={setCmdOpen} />
      <SessionTimeoutDialog />
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden bg-[var(--sidebar-bg)] transition-[width] duration-300 lg:block",
          asideWidth,
        )}
      >
        {sidebar(collapsed)}
        <button
          type="button"
          onClick={toggleCollapse}
          className="absolute -right-3 top-20 z-50 grid h-6 w-6 place-items-center rounded-full border border-[var(--line)] bg-surface text-heading shadow-sm"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronsRight className="h-3.5 w-3.5" />
          ) : (
            <ChevronsLeft className="h-3.5 w-3.5" />
          )}
        </button>
      </aside>

      {/* Mobile drawer */}
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/45"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-[280px] bg-[var(--sidebar-bg)] shadow-2xl">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 rounded-full bg-[var(--sidebar-surface)] p-2 text-[var(--sidebar-fg)]"
              aria-label="Close sidebar"
            >
              <X className="h-4 w-4" />
            </button>
            {sidebar(false)}
          </aside>
        </div>
      ) : null}

      <div className={cn("transition-[padding] duration-300", mainPad)}>
        <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-surface/90 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
          <div className="flex flex-col gap-1 px-3 py-2 md:px-4 md:py-1.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <button
                  type="button"
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-paper-2 text-heading lg:hidden"
                  onClick={() => setOpen(true)}
                  aria-label="Open sidebar"
                >
                  <Menu className="h-5 w-5" />
                </button>

                <button
                  type="button"
                  onClick={() => setCmdOpen(true)}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-paper-2 text-heading md:hidden"
                  aria-label={t.searchPages}
                >
                  <Search className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setCmdOpen(true)}
                  className="field field-with-icon relative hidden min-w-0 max-w-md flex-1 !cursor-pointer items-center rounded-full !py-1.5 pr-3 text-left text-sm text-muted md:flex"
                  aria-label={t.searchPages}
                >
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  <span className="truncate">{t.searchPages}</span>
                  <kbd className="ml-auto rounded border border-[var(--line)] bg-[var(--surface-muted)] px-1.5 py-0.5 text-[10px] font-semibold text-muted">
                    {t.commandHint}
                  </kbd>
                </button>
              </div>

              <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={toggle}
                  className="hidden rounded-full border border-[var(--line)] px-2.5 py-1.5 text-xs font-bold uppercase text-heading transition hover:bg-[var(--surface-muted)] sm:inline-flex focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                  aria-label={t.language}
                >
                  {locale === "en" ? "HI" : "EN"}
                </button>
                <Badge tone="primary" className="hidden capitalize sm:inline-flex">
                  {user.role}
                </Badge>
                <ActivityBell />
                <Link
                  href="/"
                  className="hidden items-center gap-1.5 rounded-full bg-paper-2 px-3 py-2 text-xs font-semibold text-heading transition hover:bg-secondary sm:inline-flex"
                >
                  <Globe className="h-3.5 w-3.5" /> {t.website}
                </Link>
                <UserMenu user={user} avatarUrl={avatarUrl} onLogout={logout} />
              </div>
            </div>

            <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
              <div className="min-w-0 flex-1 overflow-hidden">
                <Breadcrumbs />
              </div>
              <p className="hidden max-w-[10rem] truncate text-xs text-muted min-[420px]:block md:hidden">
                {t.welcome},{" "}
                <span className="font-semibold text-heading">{user.name.split(" ")[0]}</span>
              </p>
            </div>
          </div>
        </header>

        <main className="min-w-0 px-3 pb-4 pt-2 md:px-4 md:pb-5 md:pt-2">
          <div className="mx-auto w-full min-w-0 max-w-[1280px] space-y-2 md:space-y-1.5">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "primary" | "success" | "warning" | "danger";
}) {
  const accent =
    tone === "primary"
      ? "from-primary/10"
      : tone === "success"
        ? "from-success/10"
        : tone === "warning"
          ? "from-warning/10"
          : tone === "danger"
            ? "from-danger/10"
            : "from-transparent";
  return (
    <div
      className={cn(
        "soft-panel relative rounded-[var(--radius-lg)] p-2",
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-0 rounded-[var(--radius-lg)] bg-gradient-to-br to-transparent",
          accent,
        )}
      />
      <div className="relative">
        <p className="text-label">{label}</p>
        <p className="font-display mt-1 text-xl leading-none tracking-[-0.03em] text-heading md:text-2xl">
          {value}
        </p>
        {hint ? <p className="mt-0.5 text-xs text-muted">{hint}</p> : null}
      </div>
    </div>
  );
}

export function Panel({
  title,
  children,
  action,
  subtitle,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  subtitle?: string;
}) {
  return (
    <section className="soft-panel min-w-0 rounded-[var(--radius-md)] p-2.5 md:p-3">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="font-display text-display-md text-heading">{title}</h2>
          {subtitle ? <p className="mt-0 text-xs text-muted">{subtitle}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}
