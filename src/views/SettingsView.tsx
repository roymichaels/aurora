import { Button } from "@/components/ui/button";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { exportProfile, deleteProfile } from "@/lib/storage";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import TriggersPanel from "@/components/settings/TriggersPanel";
import ModelPanel from "@/components/settings/ModelPanel";
import DataSourcesPanel from "@/components/settings/DataSourcesPanel";
import MemoryPanel from "@/components/settings/MemoryPanel";


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

  const handleExport = () => {
    if (!user) return;
    const data = exportProfile(user.id);
    if (!data) {
      toast({ title: "No data", description: "No profile found to export." });
      return;
    }
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `profile-${user.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Profile exported", description: "Encrypted profile downloaded." });
  };

  const handleDelete = () => {
    if (!user) return;
    deleteProfile(user.id);
    toast({ title: "Profile deleted", description: "Your profile has been removed." });
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-4">
      <h1 className="text-2xl font-semibold">Settings</h1>
      {user ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">{user.email}</div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={handleExport}>
                Export Profile
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">Delete Profile</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete profile?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will remove your profile data from this device. This action
                      cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button variant="softPrimary" onClick={signOut}>Log out</Button>
            </div>
            </div>
            <DataSourcesPanel />
            <TriggersPanel />
            <ModelPanel />
            <MemoryPanel />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">You are not signed in.</p>
        )}
      </div>
    );
}
