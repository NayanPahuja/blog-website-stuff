import { Suspense } from "react";
import { AdminLoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Suspense>
        <AdminLoginForm />
      </Suspense>
    </div>
  );
}
