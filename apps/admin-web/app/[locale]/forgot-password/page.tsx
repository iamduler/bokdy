import { AdminAuthShell } from "@/components/auth/admin-auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <AdminAuthShell>
      <ForgotPasswordForm />
    </AdminAuthShell>
  );
}
