"use client";

import {
  FormEvent,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  CalendarPlus,
  History,
  Kanban,
  List,
  MessageCircle,
  MoreHorizontal,
  Plus,
  UserPlus,
} from "lucide-react";
import type { ActivityEvent, Lead } from "@/lib/types";
import { formatDate, formatDateTime, formatPhone, titleCase } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { Drawer } from "@/components/ui/Drawer";
import { EmptyState } from "@/components/ui/EmptyState";
import { FormField, Input, Select, Textarea } from "@/components/ui/Input";
import { ListToolbar } from "@/components/ui/ListToolbar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Panel } from "@/components/dashboard/DashboardShell";

const statuses: Lead["status"][] = ["new", "contacted", "converted"];

const careTypes = [
  "Elderly Care",
  "Skilled Nursing",
  "Post-Surgery Nursing",
  "Wound Care",
  "Mother & Baby",
  "Physiotherapy",
  "Critical Bed Care",
  "24hr Nursing",
];

type TimelineItem = {
  id: string;
  title: string;
  detail?: string;
  at: string;
};

function whatsappHref(lead: Lead) {
  const digits = lead.phone.replace(/\D/g, "").slice(-10);
  const text = encodeURIComponent(
    `Hi ${lead.name}, Roshan Care here regarding ${lead.careType}.`,
  );
  return `https://wa.me/91${digits}?text=${text}`;
}

function activitiesForLead(lead: Lead, activities: ActivityEvent[]): TimelineItem[] {
  const name = lead.name.toLowerCase();
  const id = lead.id.toLowerCase();
  return activities
    .filter((a) => {
      if (a.kind !== "lead") return false;
      const hay = `${a.title} ${a.detail || ""}`.toLowerCase();
      return hay.includes(name) || hay.includes(id);
    })
    .map((a) => ({
      id: a.id,
      title: a.title,
      detail: a.detail,
      at: a.createdAt,
    }));
}

function buildTimeline(lead: Lead, activities: ActivityEvent[]): TimelineItem[] {
  const items: TimelineItem[] = [];
  if (lead.message?.trim()) {
    items.push({
      id: `${lead.id}-note`,
      title: "Enquiry note",
      detail: lead.message.trim(),
      at: lead.createdAt,
    });
  }
  items.push(...activitiesForLead(lead, activities));
  const seen = new Set<string>();
  return items
    .filter((item) => {
      const key = `${item.title}|${item.detail || ""}|${item.at}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => b.at.localeCompare(a.at));
}

function ActionMenu({
  open,
  onOpenChange,
  items,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  items: Array<{
    id: string;
    label: string;
    onClick?: () => void;
    href?: string;
    external?: boolean;
    tone?: "danger" | "default";
    disabled?: boolean;
  }>;
}) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    if (!open || !btnRef.current) {
      setPos(null);
      return;
    }
    const rect = btnRef.current.getBoundingClientRect();
    const menuW = 192;
    const approxH = Math.min(items.length, 8) * 40 + 8;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < approxH && rect.top > spaceBelow;
    const top = openUp
      ? Math.max(8, rect.top - approxH - 4)
      : Math.min(window.innerHeight - approxH - 8, rect.bottom + 4);
    const left = Math.min(
      window.innerWidth - menuW - 8,
      Math.max(8, rect.right - menuW),
    );
    setPos({ top, left });
  }, [open, items.length]);

  useEffect(() => {
    if (!open) return;
    function onScroll() {
      onOpenChange(false);
    }
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open, onOpenChange]);

  const menu =
    open && pos
      ? createPortal(
          <>
            <button
              type="button"
              className="fixed inset-0 z-[90]"
              aria-label="Close menu"
              onClick={() => onOpenChange(false)}
            />
            <div
              role="menu"
              style={{ top: pos.top, left: pos.left }}
              className="fixed z-[100] w-48 rounded-[var(--radius-lg)] border border-[var(--line)] bg-surface py-1 shadow-[var(--shadow-lg)]"
            >
              {items.map((item) => {
                const className = cn(
                  "flex w-full items-center px-3 py-2.5 text-left text-sm hover:bg-[var(--surface-muted)] disabled:opacity-50",
                  item.tone === "danger"
                    ? "font-semibold text-danger hover:bg-[var(--danger-soft)]"
                    : "text-heading",
                );
                if (item.href) {
                  return (
                    <a
                      key={item.id}
                      role="menuitem"
                      href={item.href}
                      target={item.external ? "_blank" : undefined}
                      rel={item.external ? "noreferrer" : undefined}
                      className={className}
                      onClick={() => onOpenChange(false)}
                    >
                      {item.label}
                    </a>
                  );
                }
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="menuitem"
                    disabled={item.disabled}
                    className={className}
                    onClick={() => {
                      onOpenChange(false);
                      item.onClick?.();
                    }}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </>,
          document.body,
        )
      : null;

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        aria-label="More actions"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          onOpenChange(!open);
        }}
        className="rounded-full p-1.5 text-muted transition hover:bg-[var(--surface-muted)] hover:text-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {menu}
    </div>
  );
}

function SortableLeadCard({
  lead,
  busy,
  menuOpen,
  onMenuOpenChange,
  onPrimary,
  onConvert,
  onStatus,
  onDelete,
  onTimeline,
}: {
  lead: Lead;
  busy: boolean;
  menuOpen: boolean;
  onMenuOpenChange: (open: boolean) => void;
  onPrimary: () => void;
  onConvert: () => void;
  onStatus: (status: Lead["status"]) => void;
  onDelete: () => void;
  onTimeline: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: lead.id, data: { status: lead.status } });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const primary =
    lead.status === "new"
      ? { label: "Mark contacted", icon: null }
      : lead.status === "contacted"
        ? {
            label: "To patient",
            icon: <UserPlus className="h-3.5 w-3.5" />,
          }
        : {
            label: "Book care",
            icon: <CalendarPlus className="h-3.5 w-3.5" />,
          };

  const menuItems = [
    {
      id: "timeline",
      label: "View timeline",
      onClick: onTimeline,
    },
    {
      id: "whatsapp",
      label: "WhatsApp",
      href: whatsappHref(lead),
      external: true,
    },
    ...(lead.status === "new"
      ? [
          {
            id: "convert",
            label: "Convert to patient",
            onClick: onConvert,
            disabled: busy,
          },
        ]
      : []),
    ...statuses
      .filter((s) => s !== lead.status)
      .map((s) => ({
        id: `status-${s}`,
        label: `Move to ${titleCase(s)}`,
        onClick: () => onStatus(s),
        disabled: busy,
      })),
    {
      id: "delete",
      label: "Delete lead",
      onClick: onDelete,
      tone: "danger" as const,
      disabled: busy,
    },
  ];

  return (
    <article
      ref={setNodeRef}
      style={style}
      className="list-tile space-y-1.5 touch-none"
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-name text-base text-heading">{titleCase(lead.name)}</p>
          <p className="mt-0.5 text-xs text-muted">
            {lead.careType} · {formatPhone(lead.phone)}
          </p>
        </div>
        <StatusBadge status={lead.status} />
      </div>
      {lead.message ? (
        <p className="line-clamp-3 text-sm text-muted">{lead.message}</p>
      ) : null}
      <p className="text-[11px] text-muted">{formatDateTime(lead.createdAt)}</p>
      <div
        className="flex items-center justify-between gap-2 border-t border-[var(--line)] pt-1.5"
        onPointerDown={(e) => e.stopPropagation()}
      >
        {lead.status === "converted" ? (
          <Link
            href="/dashboard/admin/bookings"
            className="btn btn-secondary btn-sm"
          >
            {primary.icon}
            {primary.label}
          </Link>
        ) : (
          <Button
            type="button"
            size="sm"
            disabled={busy}
            onClick={onPrimary}
          >
            {primary.icon}
            {primary.label}
          </Button>
        )}
        <ActionMenu
          open={menuOpen}
          onOpenChange={onMenuOpenChange}
          items={menuItems}
        />
      </div>
    </article>
  );
}

function LeadCardPreview({ lead }: { lead: Lead }) {
  return (
    <article className="list-tile space-y-2 shadow-[var(--shadow-lg)]">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-name text-base text-heading">{titleCase(lead.name)}</p>
          <p className="mt-0.5 text-xs text-muted">
            {lead.careType} · {formatPhone(lead.phone)}
          </p>
        </div>
        <StatusBadge status={lead.status} />
      </div>
    </article>
  );
}

function KanbanColumn({
  status,
  leads,
  busyId,
  menuId,
  setMenuId,
  onPrimary,
  onConvert,
  onStatus,
  onDelete,
  onTimeline,
}: {
  status: Lead["status"];
  leads: Lead[];
  busyId: string | null;
  menuId: string | null;
  setMenuId: (id: string | null) => void;
  onPrimary: (lead: Lead) => void;
  onConvert: (lead: Lead) => void;
  onStatus: (id: string, status: Lead["status"]) => void;
  onDelete: (lead: Lead) => void;
  onTimeline: (lead: Lead) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <section
      ref={setNodeRef}
      className={cn(
        "soft-panel p-2.5 transition",
        isOver && "ring-2 ring-[var(--primary)] ring-offset-2 ring-offset-[var(--paper)]",
      )}
    >
      <div className="mb-1.5 flex items-center justify-between">
        <h3 className="font-display text-lg capitalize text-heading">
          {titleCase(status)}
        </h3>
        <span className="rounded-full bg-paper-2 px-2.5 py-1 text-xs font-semibold text-muted">
          {leads.length}
        </span>
      </div>
      <SortableContext
        items={leads.map((l) => l.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="min-h-[4.5rem] space-y-1.5">
          {leads.length === 0 ? (
            <p className="rounded-[var(--radius-lg)] bg-paper-2 px-3 py-3 text-center text-sm text-muted">
              Drop leads here
            </p>
          ) : (
            leads.map((lead) => (
              <SortableLeadCard
                key={lead.id}
                lead={lead}
                busy={busyId === lead.id}
                menuOpen={menuId === lead.id}
                onMenuOpenChange={(open) => setMenuId(open ? lead.id : null)}
                onPrimary={() => onPrimary(lead)}
                onConvert={() => onConvert(lead)}
                onStatus={(s) => onStatus(lead.id, s)}
                onDelete={() => onDelete(lead)}
                onTimeline={() => onTimeline(lead)}
              />
            ))
          )}
        </div>
      </SortableContext>
    </section>
  );
}

export function LeadsManager({
  leads,
  activities = [],
}: {
  leads: Lead[];
  activities?: ActivityEvent[];
}) {
  const router = useRouter();
  const [items, setItems] = useState(leads);
  const [busy, setBusy] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | Lead["status"]>("all");
  const [view, setView] = useState<"kanban" | "table">("kanban");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [timelineLead, setTimelineLead] = useState<Lead | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Lead | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    careType: "Elderly Care",
    message: "",
  });

  useEffect(() => {
    if (!activeId) setItems(leads);
  }, [leads, activeId]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const filtered = useMemo(() => {
    return items.filter((l) => {
      const q = query.trim().toLowerCase();
      const matchQ =
        !q ||
        l.name.toLowerCase().includes(q) ||
        l.phone.includes(q) ||
        l.careType.toLowerCase().includes(q) ||
        l.message.toLowerCase().includes(q);
      const matchS = status === "all" || l.status === status;
      return matchQ && matchS;
    });
  }, [items, query, status]);

  const byStatus = useMemo(() => {
    return {
      new: filtered.filter((l) => l.status === "new"),
      contacted: filtered.filter((l) => l.status === "contacted"),
      converted: filtered.filter((l) => l.status === "converted"),
    };
  }, [filtered]);

  const activeLead = activeId ? items.find((l) => l.id === activeId) : null;

  const timeline = useMemo(
    () => (timelineLead ? buildTimeline(timelineLead, activities) : []),
    [timelineLead, activities],
  );

  async function setLeadStatus(id: string, next: Lead["status"]) {
    const prev = items;
    setItems((cur) =>
      cur.map((l) => (l.id === id ? { ...l, status: next } : l)),
    );
    setBusy(id);
    const res = await fetch("/api/leads", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: next }),
    });
    setBusy(null);
    if (!res.ok) {
      setItems(prev);
      const data = await res.json();
      toast.error("Lead update failed", data.error);
      return;
    }
    toast.success("Lead status saved", titleCase(next));
    router.refresh();
  }

  async function convertLead(lead: Lead) {
    setBusy(lead.id);
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "convert", id: lead.id }),
    });
    const data = await res.json();
    setBusy(null);
    if (!res.ok) {
      toast.error("Convert failed", data.error);
      return;
    }
    toast.success("Converted to patient", titleCase(data.patient?.name || lead.name));
    router.refresh();
    if (data.patient?.id) {
      router.push(`/dashboard/admin/patients/${data.patient.id}`);
    }
  }

  async function removeConfirmed() {
    if (!confirmDelete) return;
    const lead = confirmDelete;
    setDeleting(true);
    setBusy(lead.id);
    const res = await fetch(`/api/leads?id=${encodeURIComponent(lead.id)}`, {
      method: "DELETE",
    });
    setBusy(null);
    setDeleting(false);
    if (!res.ok) {
      const data = await res.json();
      toast.error("Delete failed", data.error);
      return;
    }
    setConfirmDelete(null);
    toast.success("Lead deleted", titleCase(lead.name));
    router.refresh();
  }

  async function createLead(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", ...form }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      toast.error("Create failed", data.error);
      return;
    }
    toast.success("Lead added", titleCase(data.lead?.name || form.name));
    setForm({ name: "", phone: "", email: "", careType: "Elderly Care", message: "" });
    setShowForm(false);
    router.refresh();
  }

  function onPrimary(lead: Lead) {
    if (lead.status === "new") {
      void setLeadStatus(lead.id, "contacted");
      return;
    }
    if (lead.status === "contacted") {
      void convertLead(lead);
    }
  }

  function resolveDropStatus(overId: string): Lead["status"] | null {
    if (statuses.includes(overId as Lead["status"])) {
      return overId as Lead["status"];
    }
    const overLead = items.find((l) => l.id === overId);
    return overLead?.status ?? null;
  }

  function onDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
    setMenuId(null);
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;
    const leadId = String(active.id);
    const lead = items.find((l) => l.id === leadId);
    if (!lead) return;
    const next = resolveDropStatus(String(over.id));
    if (!next || next === lead.status) return;
    void setLeadStatus(leadId, next);
  }

  const columns = useMemo<DataTableColumn<Lead>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Lead",
        cell: ({ row }) => (
          <div>
            <p className="font-name text-heading">{titleCase(row.original.name)}</p>
            <p className="text-xs text-muted tabular-nums">
              {formatPhone(row.original.phone)}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "careType",
        header: "Care",
        cell: ({ getValue }) => (
          <span className="text-muted">{String(getValue() || "—")}</span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }) => <StatusBadge status={String(getValue())} />,
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ getValue }) => (
          <span className="text-xs text-muted">
            {formatDate(String(getValue() || ""))}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        enableSorting: false,
        cell: ({ row }) => {
          const lead = row.original;
          const isBusy = busy === lead.id;
          return (
            <div className="flex flex-wrap items-center gap-1.5">
              {lead.status === "converted" ? (
                <Link
                  href="/dashboard/admin/bookings"
                  className="btn btn-secondary btn-sm"
                >
                  <CalendarPlus className="h-3.5 w-3.5" />
                  Book
                </Link>
              ) : lead.status === "new" ? (
                <Button
                  type="button"
                  size="sm"
                  disabled={isBusy}
                  onClick={() => void setLeadStatus(lead.id, "contacted")}
                >
                  Contact
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  disabled={isBusy}
                  onClick={() => void convertLead(lead)}
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  Convert
                </Button>
              )}
              <ActionMenu
                open={menuId === `table-${lead.id}`}
                onOpenChange={(open) =>
                  setMenuId(open ? `table-${lead.id}` : null)
                }
                items={[
                  {
                    id: "timeline",
                    label: "View timeline",
                    onClick: () => setTimelineLead(lead),
                  },
                  {
                    id: "whatsapp",
                    label: "WhatsApp",
                    href: whatsappHref(lead),
                    external: true,
                  },
                  ...(lead.status !== "converted" && lead.status !== "contacted"
                    ? [
                        {
                          id: "convert",
                          label: "Convert to patient",
                          onClick: () => void convertLead(lead),
                          disabled: isBusy,
                        },
                      ]
                    : []),
                  ...statuses
                    .filter((s) => s !== lead.status)
                    .map((s) => ({
                      id: `status-${s}`,
                      label: `Move to ${titleCase(s)}`,
                      onClick: () => void setLeadStatus(lead.id, s),
                      disabled: isBusy,
                    })),
                  {
                    id: "delete",
                    label: "Delete lead",
                    onClick: () => setConfirmDelete(lead),
                    tone: "danger" as const,
                    disabled: isBusy,
                  },
                ]}
              />
            </div>
          );
        },
      },
    ],
    [busy, menuId],
  );

  return (
    <div className="space-y-1.5">
      <ListToolbar
        query={query}
        onQueryChange={setQuery}
        placeholder="Search name, phone, care type…"
        filters={[
          { id: "all", label: "all" },
          ...statuses.map((s) => ({ id: s, label: s })),
        ]}
        activeFilter={status}
        onFilterChange={(id) => setStatus(id as "all" | Lead["status"])}
        actions={
          <>
            <div
              role="group"
              aria-label="View mode"
              className="inline-flex items-center rounded-full border border-[var(--line)] bg-surface p-0.5 shadow-[var(--shadow-xs)]"
            >
              <button
                type="button"
                aria-label="Kanban view"
                aria-pressed={view === "kanban"}
                onClick={() => setView("kanban")}
                className={cn(
                  "grid h-8 w-8 place-items-center rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]",
                  view === "kanban"
                    ? "bg-primary text-[var(--sidebar-fg)] shadow-sm"
                    : "text-muted hover:text-heading",
                )}
              >
                <Kanban className="h-3.5 w-3.5" strokeWidth={2.25} />
              </button>
              <button
                type="button"
                aria-label="List view"
                aria-pressed={view === "table"}
                onClick={() => setView("table")}
                className={cn(
                  "grid h-8 w-8 place-items-center rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]",
                  view === "table"
                    ? "bg-primary text-[var(--sidebar-fg)] shadow-sm"
                    : "text-muted hover:text-heading",
                )}
              >
                <List className="h-3.5 w-3.5" strokeWidth={2.25} />
              </button>
            </div>
            <Button type="button" size="sm" onClick={() => setShowForm((v) => !v)}>
              <Plus className="h-3.5 w-3.5" />
              {showForm ? "Close" : "Add lead"}
            </Button>
          </>
        }
      />

      {showForm ? (
        <Panel title="Capture lead" subtitle="Desk enquiry → CRM pipeline">
          <form onSubmit={createLead} className="grid gap-2 sm:grid-cols-2">
            <FormField label="Name *">
              <Input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </FormField>
            <FormField label="Phone *">
              <Input
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </FormField>
            <FormField label="Email">
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </FormField>
            <FormField label="Care type">
              <Select
                value={form.careType}
                onChange={(e) => setForm({ ...form, careType: e.target.value })}
              >
                {careTypes.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Message" className="sm:col-span-2">
              <Textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
              />
            </FormField>
            <div className="sm:col-span-2">
              <Button type="submit" loading={saving} disabled={saving}>
                Save lead
              </Button>
            </div>
          </form>
        </Panel>
      ) : null}

      {leads.length === 0 ? (
        <EmptyState
          title="No leads yet"
          description="Contact and booking enquiries will appear in this pipeline."
          actionLabel="Add lead"
          onAction={() => setShowForm(true)}
        />
      ) : filtered.length === 0 ? (
        <EmptyState title="No leads match" description="Try another filter." />
      ) : view === "kanban" ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onDragCancel={() => setActiveId(null)}
        >
          <div className="grid gap-2 lg:grid-cols-3">
            {statuses.map((col) => (
              <KanbanColumn
                key={col}
                status={col}
                leads={byStatus[col]}
                busyId={busy}
                menuId={menuId}
                setMenuId={setMenuId}
                onPrimary={onPrimary}
                onConvert={(lead) => void convertLead(lead)}
                onStatus={(id, next) => void setLeadStatus(id, next)}
                onDelete={(lead) => setConfirmDelete(lead)}
                onTimeline={(lead) => setTimelineLead(lead)}
              />
            ))}
          </div>
          <DragOverlay>
            {activeLead ? <LeadCardPreview lead={activeLead} /> : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <DataTable
          data={filtered}
          columns={columns}
          getRowId={(row) => row.id}
          searchPlaceholder="Filter table…"
          emptyTitle="No leads match"
          emptyDescription="Try another filter."
          exportFilename="leads.csv"
        />
      )}

      <Drawer
        open={!!timelineLead}
        onClose={() => setTimelineLead(null)}
        title={timelineLead ? titleCase(timelineLead.name) : "Lead timeline"}
        description={
          timelineLead
            ? `${formatPhone(timelineLead.phone)} · ${timelineLead.careType}`
            : undefined
        }
      >
        {timelineLead ? (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={timelineLead.status} />
              <span className="text-xs text-muted">
                Created {formatDateTime(timelineLead.createdAt)}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {timelineLead.status !== "converted" ? (
                <Button
                  type="button"
                  size="sm"
                  disabled={busy === timelineLead.id}
                  onClick={() => void convertLead(timelineLead)}
                >
                  <UserPlus className="h-3.5 w-3.5" /> To patient
                </Button>
              ) : (
                <Link
                  href="/dashboard/admin/bookings"
                  className="btn btn-secondary btn-sm"
                >
                  <CalendarPlus className="h-3.5 w-3.5" /> Book care
                </Link>
              )}
              <a
                href={whatsappHref(timelineLead)}
                target="_blank"
                rel="noreferrer"
                className="btn btn-outline btn-sm"
              >
                <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
              </a>
            </div>

            <div>
              <h3 className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-heading">
                <History className="h-4 w-4 text-muted" />
                Activity & notes
              </h3>
              {timeline.length === 0 ? (
                <EmptyState
                  title="No activity yet"
                  description="Status changes and notes for this lead will show here."
                />
              ) : (
                <ol className="space-y-1.5 border-l border-[var(--line)] pl-4">
                  {timeline.map((item) => (
                    <li key={item.id} className="relative">
                      <span className="absolute -left-[1.15rem] top-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
                      <p className="text-sm font-semibold text-heading">
                        {item.title}
                      </p>
                      {item.detail ? (
                        <p className="mt-0.5 text-sm text-muted">{item.detail}</p>
                      ) : null}
                      <p className="mt-1 text-[11px] text-muted">
                        {formatDateTime(item.at)}
                      </p>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        ) : null}
      </Drawer>

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete lead?"
        description={
          confirmDelete
            ? `${titleCase(confirmDelete.name)} will be removed from the pipeline. This cannot be undone.`
            : undefined
        }
        confirmLabel="Delete"
        tone="danger"
        busy={deleting}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => void removeConfirmed()}
      />
    </div>
  );
}
