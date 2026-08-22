import { OrganizationDetailLayout } from "@/components/organizations/detail/organization-detail-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <OrganizationDetailLayout>{children}</OrganizationDetailLayout>;
}
