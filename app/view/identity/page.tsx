
// [AURORA-BEGIN:identity-viewer]
"use client";

import { useEffect, useState } from "react";
import ComposedIdentityScene from "@/components/identity/ComposedIdentityScene";
import { db } from "@/integrations/db";
import { useTonSession } from "@/hooks/useTonSession";

export default function IdentityPage() {
  const { user } = useTonSession();
  const [stats, setStats] = useState<any | null>(null);

  useEffect(() => {
    (async () => {
      if (!user) return;
      try {
        const { data } = await db
          .from("user_stats")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();
        setStats(data ?? null);
      } catch (e) {
        console.error("[identity] failed to load stats", e);
        setStats(null);
      }
    })();
  }, [user]);

  if (!stats) return null;

  return <ComposedIdentityScene stats={stats} />;
}
// [AURORA-END:identity-viewer]
