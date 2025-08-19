import { memo } from "react";
import { QuickPodsRow } from "@/components/quick/QuickPodsRow";

export default memo(function ActionsView() {
  return (
    <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Actions</h1>
      </header>

      {/* Quick tools that used to be on Home */}
      <section aria-label="Quick actions">
        <QuickPodsRow />
      </section>

      {/* Optional: drop in other small panels you had on Home */}
      {/* <RecentChanges /> */}
    </div>
  );
});

