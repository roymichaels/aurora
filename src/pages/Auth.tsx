
import { useEffect, useState, FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

const AuthPage = () => {
  const { user, initializing } = useSupabaseAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (!initializing && user) {
      navigate("/", { replace: true });
    }
  }, [user, initializing, navigate]);

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast({ title: "Login failed", description: error.message });
      return;
    }
    toast({ title: "Welcome back!", description: "You are now signed in." });
    navigate("/", { replace: true });
  };

  const handleSignup = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectUrl },
    });
    if (error) {
      toast({ title: "Signup failed", description: error.message });
      return;
    }
    toast({
      title: "Check your email",
      description: "We sent a confirmation link. After confirming, you'll be redirected here.",
    });
  };

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
          <h1 className="text-xl font-semibold">{mode === "login" ? "Sign in" : "Create account"}</h1>
          <p className="text-sm text-muted-foreground">
            {mode === "login" ? "Welcome back! Enter your details below." : "Sign up with email and a password."}
          </p>
        </div>

        <form onSubmit={mode === "login" ? handleLogin : handleSignup} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <Button className="flex-1" type="submit">
              {mode === "login" ? "Sign in" : "Create account"}
            </Button>
          </div>
        </form>

        <div className="text-xs text-muted-foreground">
          {mode === "login" ? (
            <span>
              New here?{" "}
              <button className="text-primary underline" onClick={()=> setMode("signup")}>Create an account</button>
            </span>
          ) : (
            <span>
              Already have an account?{" "}
              <button className="text-primary underline" onClick={()=> setMode("login")}>Sign in</button>
            </span>
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
