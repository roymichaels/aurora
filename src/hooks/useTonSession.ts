import { useEffect, useState } from "react";
import { useTonAuth } from "./useTonAuth";

export function useTonSession() {
  const { address, logout } = useTonAuth();
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    setInitializing(false);
  }, [address]);

  const user = address ? { id: address, email: address } : null;
  return { user, token: null, initializing, logout };
}


