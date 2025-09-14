import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNearAuth } from "@/hooks/useNearAuth";

const AuthPage = () => {
  const { address, login, loading } = useNearAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (address) {
      navigate("/", { replace: true });
    }
  }, [address, navigate]);

  const connect = async () => {
    await login();
  };

  return (
    <div className="relative min-h-svh w-screen grid place-items-center p-4">
      <div className="os-bg" />
      <Card className="w-full max-w-sm p-6 space-y-4">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">Connect NEAR Wallet</h1>
          <p className="text-sm text-muted-foreground">Use your NEAR wallet to sign in.</p>
        </div>
        <div className="flex justify-center">
          {loading ? (
            <p className="text-sm text-muted-foreground">Connecting...</p>
          ) : (
            <Button onClick={connect}>Connect NEAR Wallet</Button>
          )}
        </div>
        <div className="text-xs">
          <Link to="/" className="text-muted-foreground underline">Back to app</Link>
        </div>
      </Card>
    </div>
  );
};

export default AuthPage;
