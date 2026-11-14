import { redirect } from "@/i18n/navigation";

export default async function PlayerActivityPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  redirect({ href: `/users/players/${id}/sessions`, locale });
}
