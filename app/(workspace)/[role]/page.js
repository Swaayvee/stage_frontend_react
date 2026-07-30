import Dashboard from "../../../components/Dashboard";

export default async function RolePage({ params }) {
  const { role } = await params;
  return <Dashboard role={role} />;
}
