export interface QAPair {
  question: string;
  answer: string;
}

/**
 * Handles a simple question/answer conversation flow.
 * Maintains a session log and validates incoming questions.
 */
export class Conversation {
  private log: QAPair[] = [];

  constructor(private context: string[] = []) {}

  /**
   * Repeatedly prompts for a question until it passes validation, then obtains an answer.
   * @param getQuestion  Callback that resolves to the next question from the user
   * @param answerFn     Callback that resolves to an answer for a given question
   * @param onInvalid    Optional callback invoked when a question fails validation
   */
  async askQuestion(
    getQuestion: () => Promise<string>,
    answerFn: (q: string) => Promise<string>,
    onInvalid?: (reason: string) => void
  ): Promise<QAPair> {
    while (true) {
      const q = await getQuestion();
      const reason = this.validate(q);
      if (reason) {
        onInvalid?.(reason);
        continue;
      }
      const a = await answerFn(q);
      const pair = { question: q, answer: a };
      this.log.push(pair);
      return pair;
    }
  }

  private validate(question: string): string | null {
    const words = question.trim().split(/\s+/);
    if (words.length <= 7) {
      return "Question must be longer than 7 words.";
    }
    if (
      this.context.length &&
      !this.context.some((c) => question.toLowerCase().includes(c.toLowerCase()))
    ) {
      return "Question is outside the provided context.";
    }
    return null;
  }

  /** Returns a shallow copy of the session log. */
  getLog() {
    return [...this.log];
  }
}
