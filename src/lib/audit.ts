import type { AuditLog, DbShape } from "./types";

export function pushAudit(
  db: DbShape,
  input: {
    action: string;
    entity: string;
    detail?: string;
    actorId?: string;
    actorName?: string;
  },
) {
  if (!db.auditLogs) db.auditLogs = [];
  const row: AuditLog = {
    id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    action: input.action,
    entity: input.entity,
    detail: input.detail,
    actorId: input.actorId,
    actorName: input.actorName,
    createdAt: new Date().toISOString(),
  };
  db.auditLogs.unshift(row);
  db.auditLogs = db.auditLogs.slice(0, 300);
  return row;
}
