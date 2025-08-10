export interface Skill {
  /**
   * Name of the skill available to Aura.
   */
  name: string;
  /**
   * Short description of the skill.
   */
  description: string;
}

export const skills: Skill[] = [
  {
    name: 'widgets',
    description: 'Suggests dashboard widgets based on conversation context.'
  }
];

export default skills;
