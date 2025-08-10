import { Button } from "@/components/ui/button";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export default function SettingsView() {
  const { user } = useSupabaseAuth();

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({ title: "Sign out failed", description: error.message });
    } else {
      toast({ title: "Signed out", description: "You have been signed out." });
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-4">
      <h1 className="text-2xl font-semibold">Settings</h1>
      {user ? (
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">{user.email}</div>
          <Button variant="softPrimary" onClick={signOut}>Log out</Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">You are not signed in.</p>
      )}
    </div>
  );
}
