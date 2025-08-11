import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { memoryStore } from "@/memory/indexedDbMemory";
import { usePersonaStore } from "@/state/persona";

export default function PersonaSetup() {
  const { profile, updateProfile } = usePersonaStore();
  const [goals, setGoals] = useState(profile.goals || "");
  const [values, setValues] = useState(profile.values || "");
  const [tone, setTone] = useState(profile.tones || "");
  const [quirks, setQuirks] = useState(profile.quirks || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const updates = { goals, values, tones: tone, quirks };
    updateProfile(updates);
    await Promise.all([
      goals
        ? memoryStore.add("semantic", "user", `Goals: ${goals}`, {
            tags: ["persona", "goals"],
          })
        : Promise.resolve(),
      values
        ? memoryStore.add("semantic", "user", `Values: ${values}`, {
            tags: ["persona", "values"],
          })
        : Promise.resolve(),
      tone
        ? memoryStore.add("semantic", "user", `Tone: ${tone}`, {
            tags: ["persona", "tone"],
          })
        : Promise.resolve(),
      quirks
        ? memoryStore.add("semantic", "user", `Quirks: ${quirks}`, {
            tags: ["persona", "quirks"],
          })
        : Promise.resolve(),
    ]);
  };

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Persona Setup</h1>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="goals">Goals</Label>
          <Textarea
            id="goals"
            value={goals}
            onChange={(e) => setGoals(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="values">Values</Label>
          <Textarea
            id="values"
            value={values}
            onChange={(e) => setValues(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tone">Tone</Label>
          <Textarea
            id="tone"
            value={tone}
            onChange={(e) => setTone(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="quirks">Quirks</Label>
          <Textarea
            id="quirks"
            value={quirks}
            onChange={(e) => setQuirks(e.target.value)}
          />
        </div>
        <Button type="submit">Save Persona</Button>
      </form>
    </div>
  );
}
