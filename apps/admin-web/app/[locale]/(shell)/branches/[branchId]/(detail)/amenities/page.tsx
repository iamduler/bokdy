import { redirect } from "@/i18n/navigation";

export default async function BranchAmenitiesPage({
  params,
}: {
  params: Promise<{ locale: string; branchId: string }>;
}) {
  const { locale, branchId } = await params;
  redirect({ href: `/branches/${branchId}`, locale });
}
