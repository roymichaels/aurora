import { useEffect, useState } from "react";
import { useNearAuth } from "./useNearAuth";

export function useNearSession() {
  const { accountId, logout } = useNearAuth();
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    setInitializing(false);
  }, [accountId]);

  const user = accountId ? { id: accountId, email: accountId } : null;
  return { user, token: null, initializing, logout };
}
