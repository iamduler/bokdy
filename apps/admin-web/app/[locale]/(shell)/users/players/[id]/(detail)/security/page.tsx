import { redirect } from "@/i18n/navigation";

export default async function PlayerSecurityPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  redirect({ href: `/users/players/${id}`, locale });
}
