import AppShell from "../../../../components/AppShell";
import WorkspacePage from "../../../../components/WorkspacePage";
import { notFound } from "next/navigation";
const roles = ["merchant", "courier", "manager", "super_manager"];
export default async function SectionPage({ params }) {
  const { role, section } = await params;
  if (!roles.includes(role)) notFound();
  return (
    <AppShell role={role}>
      <WorkspacePage role={role} section={section} />
    </AppShell>
  );
}
