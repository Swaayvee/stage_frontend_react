import WorkspacePage from "../../../../../components/WorkspacePage";

export default async function DetailPage({ params }) {
  const { role, section, detail } = await params;
  return <WorkspacePage role={role} section={`${section}/${detail}`} />;
}
