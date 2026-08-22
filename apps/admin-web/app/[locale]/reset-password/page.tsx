import { Suspense } from "react";

import { AdminAuthShell } from "@/components/auth/admin-auth-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <AdminAuthShell>
      <Suspense fallback={null}>
        <ResetPasswordForm />
      </Suspense>
    </AdminAuthShell>
  );
}
