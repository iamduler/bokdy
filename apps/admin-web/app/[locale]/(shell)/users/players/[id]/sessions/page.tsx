import { UserActivityView } from "@/components/users/detail/user-activity-view";
import { UserSessionsView } from "@/components/users/detail/user-sessions-view";

export default function PlayerSessionsPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-auto soft-scrollbar p-4 md:p-6">
      <UserSessionsView embedded />
      <UserActivityView embedded />
    </div>
  );
}
