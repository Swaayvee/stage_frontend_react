import AppShell from "../../../../components/AppShell";
import WorkspacePage from "../../../../components/WorkspacePage";
import { notFound } from "next/navigation";
const roles = ["merchant", "courier", "mgr-9a8f2k4x", "sm-3v8n1w9z"];
export default async function SectionPage({ params }) {
  const { role, section } = await params;
  if (!roles.includes(role)) notFound();
  return (
    <AppShell role={role}>
      <WorkspacePage role={role} section={section} />
    </AppShell>
  );
}
