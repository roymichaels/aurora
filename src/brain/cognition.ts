import brainPolicy from '../../BRAIN_POLICY.md?raw';

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
  systemPrompt: brainPolicy,
  contextPrompt: 'Respond in a warm and supportive tone.'
};

export default cognition;
