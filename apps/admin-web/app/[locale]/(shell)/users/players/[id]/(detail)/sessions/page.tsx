import { cn } from "@bokdy/ui";

import { softDetailSectionGap } from "@/components/data-list";
import { UserActivityView } from "@/components/users/detail/user-activity-view";
import { UserSessionsView } from "@/components/users/detail/user-sessions-view";

export default function PlayerSessionsPage() {
  return (
    <div
      className={cn(
        "grid grid-cols-1 px-4 pt-3 pb-6 md:px-5 md:pt-4 lg:grid-cols-2",
        softDetailSectionGap,
      )}
    >
      <UserSessionsView embedded />
      <UserActivityView embedded />
    </div>
  );
}
