import { UserDetailLayout } from "@/components/users/detail/user-detail-layout";

export default function OwnerDetailLayout({ children }: { children: React.ReactNode }) {
  return <UserDetailLayout audience="owners">{children}</UserDetailLayout>;
}
