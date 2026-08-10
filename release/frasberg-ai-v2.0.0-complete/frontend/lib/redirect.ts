import { redirect } from "next/navigation";

export function requireAuth(session: any) {
  if (!session) {
    redirect("/login");
  }
}
