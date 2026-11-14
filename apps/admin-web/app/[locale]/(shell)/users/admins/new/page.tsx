"use client";

import { UserAccountCreatePage } from "@/components/users/user-account-form-pages";

export default function NewAdminPage() {
  return <UserAccountCreatePage audience="admins" />;
}
