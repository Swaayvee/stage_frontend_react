import { Suspense } from "react";
import AccountEditor from "../../components/AccountEditor";

export default function AccountPage() {
  return (
    <Suspense fallback={null}>
      <AccountEditor />
    </Suspense>
  );
}
