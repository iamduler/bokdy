"use client";

import { useTranslations } from "next-intl";

import { usePageShellTitle } from "@/components/shell/shell-title";
import {
  useUserDetail,
  userDisplayName,
} from "@/components/users/detail/user-detail-context";
import { PlayerBookingsView } from "@/components/users/detail/player-bookings-view";

export default function PlayerBookingsPage() {
  const t = useTranslations("users.detailSubnav");
  const { user } = useUserDetail();
  usePageShellTitle(`${userDisplayName(user)} · ${t("bookings")}`);
  return <PlayerBookingsView />;
}
