import { UserActivityView } from "@/components/users/detail/user-activity-view";
import { UserSessionsView } from "@/components/users/detail/user-sessions-view";

export default function PlayerSessionsPage() {
  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-auto soft-scrollbar p-4 md:gap-6 md:p-6 lg:grid-cols-2 lg:overflow-hidden">
      <div className="min-h-0 lg:overflow-auto lg:soft-scrollbar">
        <UserSessionsView embedded />
      </div>
      <div className="min-h-0 lg:overflow-auto lg:soft-scrollbar">
        <UserActivityView embedded />
      </div>
    </div>
  );
}
