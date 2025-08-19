import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useOnboardingStore } from "@/state/onboarding";

export default function OnboardingOverlay() {
  const { messages, sending, lockStep, skip } = useOnboardingStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  return (
    <div
      className="absolute inset-x-0 top-0 flex flex-col items-center pointer-events-none"
      style={{
        bottom: "calc(var(--dock-h) + var(--chatbar-h) + env(safe-area-inset-bottom))",
      }}
    >
      <div className="flex-1 w-full max-w-md overflow-y-auto space-y-2 p-4 pointer-events-auto">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === "assistant" ? "justify-start" : "justify-end"}`}>
            <div
              className={`glass-panel rounded-2xl px-3 py-2 text-sm max-w-[80%] ${
                m.role === "assistant" ? "" : "bg-primary text-primary-foreground"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="glass-panel rounded-2xl px-3 py-2 text-sm max-w-[80%]">...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="pointer-events-auto flex gap-2 mb-4">
        <Button onClick={lockStep}>Lock step</Button>
        <Button variant="ghost" onClick={skip}>
          Skip for now
        </Button>
      </div>
    </div>
  );
}
