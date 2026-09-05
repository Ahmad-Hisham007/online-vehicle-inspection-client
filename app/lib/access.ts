export const ADMIN_ROLE = "administrator";
export const INSPECTOR_ROLE = "inspector";
export const STAFF_ROLES = [ADMIN_ROLE, INSPECTOR_ROLE] as const;

export function isAdministrator(role?: string): boolean {
  return role === ADMIN_ROLE;
}

export function isInspector(role?: string): boolean {
  return role === INSPECTOR_ROLE;
}

export function isStaff(role?: string): boolean {
  return role === ADMIN_ROLE || role === INSPECTOR_ROLE;
}

interface InspectionAccessContext {
  authorDatabaseId?: number | null;
  assignedInspectorDatabaseId?: number | null;
}

/**
 * Who may read an inspection:
 * - administrators: everyone
 * - otherwise the owner (author) of the inspection
 * - inspectors additionally for inspections assigned to them
 */
export function canAccessInspection(
  session: { wpId: number; role?: string },
  ctx: InspectionAccessContext,
): boolean {
  if (isAdministrator(session.role)) return true;
  if (ctx.authorDatabaseId === session.wpId) return true;
  if (
    isInspector(session.role) &&
    ctx.assignedInspectorDatabaseId === session.wpId
  ) {
    return true;
  }
  return false;
}
