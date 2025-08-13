import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import VoiceSetup from "@/components/VoiceSetup";
import { useVoiceStore } from "@/state/voice";

// Panel for configuring voice output mode and managing custom voice samples.
export default function VoiceSettings() {
  const { mode, setMode, voiceId } = useVoiceStore();

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Voice Output</h2>
        <div className="flex flex-col gap-2 w-full max-w-sm">
          <Label htmlFor="voice-mode">Mode</Label>
          <Select value={mode} onValueChange={(v) => setMode(v as any)}>
            <SelectTrigger id="voice-mode">
              <SelectValue placeholder="Choose" />
            </SelectTrigger>
            <SelectContent>
              {voiceId && <SelectItem value="cloned">Your voice</SelectItem>}
              <SelectItem value="eleven-default">Stock voice</SelectItem>
              <SelectItem value="browser-tts">Browser voice</SelectItem>
              <SelectItem value="local-tts">Local TTS</SelectItem>
              <SelectItem value="off">Off</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <h3 className="text-md font-semibold">Voice Sample</h3>
        <VoiceSetup />
      </div>
    </div>
  );
}

