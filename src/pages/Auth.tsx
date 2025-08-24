import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTonAuth, connector } from "@/hooks/useTonAuth";

const AuthPage = () => {
  const { address } = useTonAuth();
  const navigate = useNavigate();
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    if (address) {
      navigate("/", { replace: true });
    }
  }, [address, navigate]);

  const connect = async () => {
    setIsConnecting(true);
    try {
      await connector.connectWallet();
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="relative min-h-svh w-screen grid place-items-center p-4">
      <div className="os-bg" />
      <Card className="w-full max-w-sm p-6 space-y-4">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">Connect Wallet</h1>
          <p className="text-sm text-muted-foreground">Use your TON wallet to sign in.</p>
        </div>
        <div className="flex justify-center">
          {isConnecting ? (
            <p className="text-sm text-muted-foreground">Connecting...</p>
          ) : (
            <Button onClick={connect}>Connect TON Wallet</Button>
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
