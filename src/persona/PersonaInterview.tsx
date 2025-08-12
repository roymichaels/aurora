import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function PersonaInterview() {
  const [tone, setTone] = useState("");
  const [values, setValues] = useState("");
  const [phrases, setPhrases] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const profile = {
      tone,
      values,
      signature_phrases: phrases
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean),
    };

    try {
      await fetch("/persona/profile.json", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
    } catch (err) {
      console.error("Failed to save persona", err);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="tone">Tone</Label>
        <Textarea
          id="tone"
          value={tone}
          onChange={(e) => setTone(e.target.value)}
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
        <Label htmlFor="phrases">Signature Phrases</Label>
        <Textarea
          id="phrases"
          value={phrases}
          onChange={(e) => setPhrases(e.target.value)}
          placeholder="comma separated"
        />
      </div>
      <Button type="submit">Save Persona</Button>
    </form>
  );
}
