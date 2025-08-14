export type ChatEvents = {
  'chat/send': { id: string; content: string };
  'chat/stream:start': { id: string };
  'chat/stream:chunk': { id: string; content: string };
  'chat/stream:end': { id: string };
  'chat/stream:error': { id: string; error: unknown };
  'sphere/state:set': { state: 'thinking' | 'speaking' };
  'voice/state:set': { state: 'thinking' | 'speaking' };
  'voice/listen:start': {};
  'voice/listen:stop': {};
};

