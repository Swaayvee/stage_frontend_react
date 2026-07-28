import AppShell from "../../../components/AppShell";
import Dashboard from "../../../components/Dashboard";
import { notFound } from "next/navigation";
const roles = ["merchant", "courier", "manager", "super_manager"];
export default async function RolePage({ params }) {
  const { role } = await params;
  if (!roles.includes(role)) notFound();
  return (
    <AppShell role={role}>
      <Dashboard role={role} />
    </AppShell>
  );
}
