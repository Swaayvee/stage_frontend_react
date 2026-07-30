import WorkspacePage from "../../../../components/WorkspacePage";

export default async function SectionPage({ params }) {
  const { role, section } = await params;
  return <WorkspacePage role={role} section={section} />;
}
