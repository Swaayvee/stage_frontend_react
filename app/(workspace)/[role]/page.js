import AppShell from "../../../components/AppShell";
import Dashboard from "../../../components/Dashboard";
import { notFound } from "next/navigation";
const roles = ["merchant", "courier", "mgr-9a8f2k4x", "sm-3v8n1w9z"];
export default async function RolePage({ params }) {
  const { role } = await params;
  if (!roles.includes(role)) notFound();
  return (
    <AppShell role={role}>
      <Dashboard role={role} />
    </AppShell>
  );
}
