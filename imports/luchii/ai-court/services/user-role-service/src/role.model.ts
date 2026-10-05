export interface Role {
  id: string;
  name: string;
  permissions: string[];
}

export const ROLES = {
  JUDGE: "judge",
  LAWYER: "lawyer",
  CLERK: "clerk",
  ADMIN: "admin",
} as const;

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  judge: ["view_cases", "view_evidence", "view_law", "generate_notes"],
  lawyer: ["view_cases", "view_evidence", "view_law", "add_notes"],
  clerk: ["manage_evidence", "manage_audit_logs"],
  admin: ["manage_users", "manage_roles", "configure_system"],
};
