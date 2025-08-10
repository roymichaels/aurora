import cognition, { CognitionConfig } from './cognition';
import behavior, { BehaviorConfig } from './behavior';
import filters, { Filter } from './filters';
import skills, { Skill } from './skills';

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
