import { useCallback, useEffect, useState } from "react";
import { UserProfile } from "@/data/profile";
import { MasterPlan } from "@/brain/masterPlan";
import { updatePlan } from "@/brain/updateEngine";

export function usePlanUpdater(initialPlan?: MasterPlan) {
  const [plan, setPlan] = useState<MasterPlan>(
    initialPlan ?? { goals: [], habits: [], plan_versions: [] },
  );

  useEffect(() => {
    if (initialPlan) {
      setPlan(initialPlan);
    }
  }, [initialPlan]);

  const update = useCallback(
    (oldProfile: UserProfile, newProfile: UserProfile) => {
      setPlan((prev) => updatePlan(oldProfile, newProfile, prev));
    },
    [],
  );

  return { plan, update } as const;
}
