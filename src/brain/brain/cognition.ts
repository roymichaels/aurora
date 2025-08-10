export interface CognitionConfig {
  /**
   * System prompt used for all chat interactions.
   */
  systemPrompt: string;
  /**
   * Optional additional context sent with each request.
   */
  contextPrompt?: string;
}

export const cognition: CognitionConfig = {
  systemPrompt: 'You are Aura, a friendly life coach AI who gives concise and actionable advice.',
  contextPrompt: 'Respond in a warm and supportive tone.'
};

export default cognition;
