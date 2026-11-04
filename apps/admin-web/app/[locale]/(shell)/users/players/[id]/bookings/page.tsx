"use client";

import { useTranslations } from "next-intl";

import { usePageShellTitle } from "@/components/shell/shell-title";
import { PlayerBookingsView } from "@/components/users/detail/player-bookings-view";

export default function PlayerBookingsPage() {
  const ts = useTranslations("shell");
  usePageShellTitle(ts("pageTitles.usersPlayers"));
  return <PlayerBookingsView />;
}
