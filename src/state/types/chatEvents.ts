export type SphereState =
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'progress';

export type ChatEvents = {
  'chat/send': { id: string; content: string };
  'chat/stream:start': { id: string };
  'chat/stream:chunk': { id: string; content: string };
  'chat/stream:end': { id: string };
  'chat/stream:error': { id: string; error: unknown };
  'sphere/state:set': { state: SphereState; value?: number; text?: string };
  'voice/state:set': { state: 'thinking' | 'speaking' };
  'voice/listen:start': {};
  'voice/listen:stop': {};
  'voice/transcript': { text: string };
};

