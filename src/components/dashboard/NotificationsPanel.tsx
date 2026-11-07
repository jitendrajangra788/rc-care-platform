"use client";

import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import type { AppNotification } from "@/lib/types";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListTileHeader, ListTileMeta } from "@/components/ui/ListTile";
import { Panel } from "@/components/dashboard/DashboardShell";
import { cn } from "@/lib/utils";

export function NotificationsPanel({ notifications }: { notifications: AppNotification[] }) {
  const router = useRouter();
  const unread = notifications.filter((n) => !n.readAt).length;

  async function markAll() {
    const res = await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAll: true }),
    });
    if (!res.ok) {
      toast.error("Failed");
      return;
    }
    router.refresh();
  }

  async function markOne(id: string) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    router.refresh();
  }

  return (
    <Panel
      title="Notifications"
      subtitle={unread ? `${unread} unread` : "All caught up"}
      action={
        notifications.length ? (
          <Button type="button" size="sm" variant="secondary" onClick={markAll}>
            Mark all read
          </Button>
        ) : null
      }
    >
      {notifications.length === 0 ? (
        <EmptyState
          icon={<Bell className="h-5 w-5" />}
          title="No notifications"
          description="Desk alerts and care updates will land here."
        />
      ) : (
        <div className="space-y-1.5">
          {notifications.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => markOne(n.id)}
              className={cn(
                "list-tile block w-full cursor-pointer text-left transition",
                !n.readAt && "border-primary/25 bg-primary/[0.03]",
                n.readAt && "opacity-75",
              )}
            >
              <ListTileHeader>
                <h3 className="font-display text-lg text-heading">{n.title}</h3>
                {!n.readAt ? (
                  <span className="h-2.5 w-2.5 rounded-full bg-primary" aria-label="Unread" />
                ) : null}
              </ListTileHeader>
              {n.body ? <p className="mt-1 text-sm text-muted">{n.body}</p> : null}
              <ListTileMeta>{new Date(n.createdAt).toLocaleString()}</ListTileMeta>
            </button>
          ))}
        </div>
      )}
    </Panel>
  );
}
