import { AdminAuthShell } from "@/components/auth/admin-auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <AdminAuthShell>
      <LoginForm />
    </AdminAuthShell>
  );
}
