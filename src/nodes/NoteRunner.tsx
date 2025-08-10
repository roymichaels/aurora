import { useState } from "react";
import { useProgressStore } from "@/state/progress";

type Props = { node: { id: string; label: string }; onExit: () => void };

export default function NoteRunner({ node, onExit }: Props) {
  const [text, setText] = useState("");
  const addNote = useProgressStore((s) => s.addNote);

  const save = () => {
    if (!text.trim()) return;
    addNote({ text, ts: Date.now() });
    setText("");
  };

  return (
    <main className="relative min-h-svh px-4 pt-10 pb-28 max-w-[760px] mx-auto">
      <div className="os-bg" />
      <h1 className="text-2xl font-semibold mb-2">{node.label}</h1>
      <p className="opacity-80 mb-6">Quick note capture</p>

      <textarea
        className="w-full min-h-[160px] rounded-lg bg-white/5 border border-white/10 p-3 outline-none"
        placeholder="Write a thought…"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <div className="mt-4 flex gap-3">
        <button className="btn" onClick={save}>Save</button>
        <button className="btn" onClick={onExit}>Back</button>
      </div>
    </main>
  );
}
