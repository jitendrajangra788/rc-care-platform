import type { ActivityEvent, ActivityKind, DbShape } from "./types";

export function pushActivity(
  db: DbShape,
  input: {
    kind: ActivityKind;
    title: string;
    detail?: string;
    href?: string;
    actorId?: string;
    actorName?: string;
  },
) {
  if (!db.activities) db.activities = [];
  const event: ActivityEvent = {
    id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    kind: input.kind,
    title: input.title,
    detail: input.detail,
    href: input.href,
    actorId: input.actorId,
    actorName: input.actorName,
    createdAt: new Date().toISOString(),
    readBy: [],
  };
  db.activities.unshift(event);
  db.activities = db.activities.slice(0, 200);
  return event;
}
