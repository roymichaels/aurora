import { lazy } from "react";

const LiveFocusView = lazy(() => import("@/components/live/LiveFocusView"));

export default function LiveShell() {
  return (
    <div className="min-h-[60vh]">
      <LiveFocusView />
    </div>
  );
}
