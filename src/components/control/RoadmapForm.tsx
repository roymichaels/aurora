import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useTonSession } from "@/hooks/useTonSession";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export default function RoadmapForm({ onCreated }: { onCreated?: (id: string) => void }) {
  const { user } = useTonSession();
  const [title, setTitle] = useState("");
  const [color, setColor] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!user) {
      toast({ title: "Sign in required", description: "Connect Supabase to create roadmaps." });
      return;
    }
    if (!title.trim()) return;
    setBusy(true);
    const { data, error } = await supabase
      .from("roadmaps")
      .insert({
        user_id: user.id,
        title: title.trim(),
        color: color.trim() || null,
        description: description.trim() || null,
        status: "paused",
      })
      .select("id")
      .single();
    setBusy(false);
    if (error) {
      console.error(error);
      toast({ title: "Error", description: "Could not create roadmap." });
      return;
    }
    toast({ title: "Roadmap created", description: "Add tasks and set it active when ready." });
    setTitle(""); setColor(""); setDescription("");
    onCreated?.(data!.id as string);
  };

  return (
    <div className="grid gap-3">
      <div className="text-sm font-medium">New Roadmap</div>
      <div className="grid gap-2 sm:grid-cols-2">
        <Input placeholder="Title" value={title} onChange={(e)=> setTitle(e.target.value)} />
        <Input placeholder="Color (e.g. hsl(var(--primary)))" value={color} onChange={(e)=> setColor(e.target.value)} />
      </div>
      <Textarea placeholder="Description (optional)" value={description} onChange={(e)=> setDescription(e.target.value)} />
      <div className="flex justify-end">
        <Button onClick={submit} disabled={!title.trim() || busy}>{busy ? "Creating..." : "Create"}</Button>
      </div>
    </div>
  );
}
