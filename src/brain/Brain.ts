import cognition, { CognitionConfig } from './cognition.ts';
import behavior, { BehaviorConfig } from './behavior.ts';
import filters, { Filter } from './filters.ts';
import skills, { Skill } from './skills.ts';

/**
 * Combined configuration for Aura's behaviour and prompts.
 */
export interface BrainConfig {
  cognition: CognitionConfig;
  behavior: BehaviorConfig;
  filters: Filter[];
  skills: Skill[];
}

export const brain: BrainConfig = {
  cognition,
  behavior,
  filters,
  skills,
};

export default brain;
