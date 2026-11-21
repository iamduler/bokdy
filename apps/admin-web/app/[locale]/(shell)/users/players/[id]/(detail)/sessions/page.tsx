import { cn } from "@bokdy/ui";

import { softDetailSectionGap, softDetailTabBody } from "@/components/data-list";
import { UserActivityView } from "@/components/users/detail/user-activity-view";
import { UserSessionsView } from "@/components/users/detail/user-sessions-view";

export default function PlayerSessionsPage() {
  return (
    <div
      className={cn(
        "grid grid-cols-1 lg:grid-cols-2",
        softDetailTabBody,
        softDetailSectionGap,
      )}
    >
      <UserSessionsView embedded />
      <UserActivityView embedded />
    </div>
  );
}
