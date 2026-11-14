import { UserDetailLayout } from "@/components/users/detail/user-detail-layout";

export default function AdminUserDetailLayout({ children }: { children: React.ReactNode }) {
  return <UserDetailLayout audience="admins">{children}</UserDetailLayout>;
}
