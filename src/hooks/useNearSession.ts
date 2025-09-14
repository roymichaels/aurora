
import { useEffect, useState } from "react";
import { useNearAuth } from "./useNearAuth";

export function useNearSession() {
  const { address, logout } = useNearAuth();
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    setInitializing(false);
  }, [address]);

  const user = address ? { id: address, email: address } : null;
  return { user, token: null, initializing, logout };
}