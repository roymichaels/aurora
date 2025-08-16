import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { track } from '@/utils/telemetry';

interface ExportSphereButtonProps {
  duration?: number; // recording duration in ms
  filename?: string; // base filename without extension
}

export function ExportSphereButton({ duration = 8000, filename = 'aurora-sphere' }: ExportSphereButtonProps) {
  const [recording, setRecording] = useState(false);

  const handleClick = async () => {
    if (recording) return;
    const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
    if (!canvas) {
      const message = 'AuroraSphere canvas not found.';
      toast({ title: 'Export failed', description: message });
      track('export/sphere_error', { message });
      return;
    }
    if (typeof MediaRecorder === 'undefined') {
      const message = 'MediaRecorder not supported.';
      toast({ title: 'Export failed', description: message });
      track('export/sphere_error', { message });
      return;
    }

    setRecording(true);
    track('export/sphere_start');
    try {
      const stream = canvas.captureStream();
      const chunks: BlobPart[] = [];
      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
      } catch {
        recorder = new MediaRecorder(stream);
      }
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      recorder.start();
      await new Promise<void>((resolve) => {
        recorder.onstop = () => resolve();
        setTimeout(() => recorder.stop(), duration);
      });

      let blob = new Blob(chunks, { type: 'video/webm' });
      let format: 'webm' | 'mp4' = 'webm';

      try {
        const modName = 'webm-to-mp4';
        // @ts-ignore - optional dependency
        const { default: convert } = await import(/* @vite-ignore */ modName);
        const buffer = await blob.arrayBuffer();
        const mp4Buffer = convert(new Uint8Array(buffer));
        blob = new Blob([mp4Buffer], { type: 'video/mp4' });
        format = 'mp4';
      } catch (e) {
        // conversion library unavailable; keep webm
      }

      const ext = format;
      const fileName = `${filename}.${ext}`;
      const file = new File([blob], fileName, { type: `video/${ext}` });

      let method: 'download' | 'share' = 'download';
      if (navigator.share && (navigator as any).canShare?.({ files: [file] })) {
        try {
          await (navigator as any).share({ files: [file], title: fileName });
          method = 'share';
        } catch {
          // fall back to download
        }
      }

      if (method === 'download') {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
      }

      toast({
        title: 'Export complete',
        description: (
          <span>
            Share your AuroraSphere with friends!{' '}
            <a
              href="https://x.com/intent/tweet"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Post on X
            </a>
            ,{' '}
            <a
              href="https://www.instagram.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Instagram
            </a>
            , or{' '}
            <a
              href="https://www.tiktok.com/upload?lang=en"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              TikTok
            </a>
            .
          </span>
        ),
      });
      track('export/sphere_success', { format, shared: method === 'share' });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast({ title: 'Export failed', description: message });
      track('export/sphere_error', { message });
    } finally {
      setRecording(false);
    }
  };

  return (
    <Button onClick={handleClick} disabled={recording}>
      {recording ? 'Recording…' : 'Export Sphere'}
    </Button>
  );
}

export default ExportSphereButton;

