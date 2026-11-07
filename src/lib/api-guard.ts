import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { can, type Permission } from "@/lib/permissions";
import type { SessionUser } from "@/lib/types";

export async function requireApiUser(): Promise<
  { user: SessionUser } | { error: NextResponse }
> {
  const user = await getSession();
  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { user };
}

export async function requirePermission(
  permission: Permission | Permission[],
): Promise<{ user: SessionUser } | { error: NextResponse }> {
  const result = await requireApiUser();
  if ("error" in result) return result;
  const list = Array.isArray(permission) ? permission : [permission];
  if (!list.some((p) => can(result.user, p))) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return result;
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}
