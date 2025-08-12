import { useCallback, useState } from "react";
import { Conversation, QAPair } from "@/agent/conversation";

/**
 * React hook wrapper around the Conversation manager.
 * Provides the session log and an ask utility for UI components.
 */
export function useConversation(context: string[] = []) {
  const [session] = useState(() => new Conversation(context));
  const [log, setLog] = useState<QAPair[]>([]);

  const ask = useCallback(
    async (
      getQuestion: () => Promise<string>,
      answerFn: (q: string) => Promise<string>,
      onInvalid?: (reason: string) => void
    ) => {
      const pair = await session.askQuestion(getQuestion, answerFn, onInvalid);
      setLog(session.getLog());
      return pair;
    },
    [session]
  );

  return { ask, log };
}
