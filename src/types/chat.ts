export type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export interface ChatOptions {
  model?: string;
  depth?: number;
  /**
   * Confidence score for the current request (0-1). When this exceeds
   * `tunedThreshold`, the router will prefer the fine-tuned local model.
   */
  confidence?: number;
  /** Threshold above which the tuned model will be used. Default 0.8 */
  tunedThreshold?: number;
  /** Force routing to a specific model */
  route?: 'local' | 'cloud';
  /** When routing to local fails, allow fallback to cloud */
  fallbackToCloud?: boolean;
}
