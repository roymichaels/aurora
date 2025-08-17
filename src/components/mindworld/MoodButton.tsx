import { useEffect, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MoodCarousel } from "@/components/live/MoodCarousel";
import { Button } from "@/components/ui/button";

function moodEmoji(k: string) {
  switch (k) {
    case "calm": return "😌";
    case "confident": return "💪";
    case "focused": return "🎯";
    case "tired": return "😴";
    case "stressed": return "😵‍💫";
    default: return "🙂";
  }
}

export default function MoodButton() {
  const [mood, setMood] = useState<string>("focused");
  useEffect(() => {
    const get = () => {
      try { const v = localStorage.getItem("mood.last"); setMood((v || "focused").toLowerCase()); } catch {}
    };
    get();
    const id = setInterval(get, 1500);
    return () => clearInterval(id);
  }, []);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" aria-label="Change mood" className="glass-panel rounded-full px-3 py-2 text-base">
          <span aria-hidden>{moodEmoji(mood)}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent sideOffset={8} className="w-[300px] p-2">
        <MoodCarousel />
      </PopoverContent>
    </Popover>
  );
}
