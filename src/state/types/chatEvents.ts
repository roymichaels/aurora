export type ChatEvents = {
  'chat/send': { id: string; content: string };
  'chat/stream:start': { id: string };
  'chat/stream:chunk': { id: string; content: string };
  'chat/stream:end': { id: string };
  'chat/stream:error': { id: string; error: unknown };
  'sphere/state:set': { state: 'thinking' | 'speaking' };
  'sphere/progress:set': { progress: number };
  'voice/state:set': { state: 'thinking' | 'speaking' };
  'tts/pill': { message: string; action?: () => void };
};
