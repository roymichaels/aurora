import { db } from "@/integrations/db";
import { toast } from "@/hooks/use-toast";
import { getTonUser } from "@/integrations/auth";
import { uploadToStorage } from "@/integrations/storage";

export async function addNote() {
  const user = await getTonUser();
  if (!user) {
    toast({ title: "Sign in required", description: "Sign in to capture notes." });
    return;
  }
  const text = window.prompt("Enter note text");
  if (!text || !text.trim()) return;
  const { error } = await db.from("moments").insert({
    user_id: user.id,
    type: "text",
    content: text.trim(),
    folder: "Memories",
    tags: ["note"],
    visibility: "private",
  });
  if (error) {
    console.error(error);
    toast({ title: "Error", description: "Could not save note." });
    return;
  }
  toast({ title: "Saved", description: "Note added to Archive." });
}

export async function startVoiceNote() {
  const user = await getTonUser();
  if (!user) {
    toast({ title: "Sign in required", description: "Sign in to record voice notes." });
    return;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const chunks: BlobPart[] = [];
    const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };
    recorder.onstop = async () => {
      try {
        const blob = new Blob(chunks, { type: "audio/webm" });
        const filePath = `${user.id}/${Date.now()}.webm`;
        const { error: upErr } = await uploadToStorage(
          "voice-notes",
          filePath,
          blob,
          "audio/webm",
        );
        if (upErr) throw upErr;
        const { error: insErr } = await db.from("moments").insert({
          user_id: user.id,
          type: "audio",
          content: "Voice note",
          storage_path: `voice-notes/${filePath}`,
          folder: "Memories",
          tags: ["voice"],
          visibility: "private",
        });
        if (insErr) throw insErr;
        toast({ title: "Saved", description: "Voice note added to Archive." });
      } catch (err) {
        console.error(err);
        toast({ title: "Error", description: "Could not save voice note." });
      } finally {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
    recorder.start();
    toast({ title: "Recording", description: "Recording for 5 seconds…" });
    setTimeout(() => {
      try {
        recorder.stop();
      } catch {}
    }, 5000);
  } catch (e) {
    console.error(e);
    toast({ title: "Microphone blocked", description: "Please allow microphone access." });
  }
}
