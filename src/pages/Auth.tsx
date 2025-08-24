import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useTonAuth } from "@/hooks/useTonAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const AuthPage = () => {
  const { user, initializing } = useSupabaseAuth();
  const navigate = useNavigate();

  const { connect, isConnecting } = useTonAuth();

  useEffect(() => {
    if (!initializing && user) {
      navigate("/", { replace: true });
    }
  }, [user, initializing, navigate]);

  if (initializing || user) {
    return (
      <div className="relative min-h-svh w-screen grid place-items-center">
        <div className="os-bg" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-svh w-screen grid place-items-center p-4">
      <div className="os-bg" />
      <Card className="w-full max-w-sm p-6 space-y-4">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">Connect wallet</h1>
          <p className="text-sm text-muted-foreground">
            Sign in with your TON wallet to continue.
          </p>
        </div>

        <Button className="w-full" onClick={connect} disabled={isConnecting}>
          {isConnecting ? "Connecting..." : "Connect Wallet"}
        </Button>

        <div className="text-xs">
          <Link to="/" className="text-muted-foreground underline">
            Back to app
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default AuthPage;
