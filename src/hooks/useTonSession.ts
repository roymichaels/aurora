import { useEffect, useState } from "react";
import { useTonAuth } from "./useTonAuth";

export function useTonSession() {
  const { address, disconnect } = useTonAuth();
  const [token, setToken] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const init = async () => {
      if (!address) {
        setToken(null);
        setInitializing(false);
        return;
      }
      try {
        const res = await fetch("/auth/session");
        if (res.ok) {
          const data = await res.json().catch(() => ({ token: null }));
          setToken(data.token ?? null);
        } else {
          setToken(null);
        }
      } catch {
        setToken(null);
      } finally {
        setInitializing(false);
      }
    };
    init();
  }, [address]);

  const logout = async () => {
    try {
      await fetch("/auth/logout", { method: "POST" });
    } finally {
      await disconnect();
      setToken(null);
    }
  };

  const user = address ? { id: address, email: address } : null;
  return { user, token, initializing, logout };
}

