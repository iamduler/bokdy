import { UserDetailLayout } from "@/components/users/detail/user-detail-layout";

export default function PlayerDetailLayout({ children }: { children: React.ReactNode }) {
  return <UserDetailLayout audience="players">{children}</UserDetailLayout>;
}
