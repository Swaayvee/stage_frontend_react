import { notFound } from "next/navigation";
import AppShell from "../../../components/AppShell";
import AuthGuard from "../../../components/AuthGuard";

const roles = ["merchant", "courier", "manager", "super_manager"];

export default async function WorkspaceLayout({ children, params }) {
  const { role } = await params;
  if (!roles.includes(role)) notFound();

  return (
    <AuthGuard role={role}>
      <AppShell role={role}>{children}</AppShell>
    </AuthGuard>
  );
}
