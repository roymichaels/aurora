export function buildPrompt(
  persona: string,
  memories: string[],
  behaviorStyle: string = "",
  skills: string[] = [],
  filters: string[] = [],
): string {
  const parts = [
    "You are the idealized version of the user.",
    `Persona: ${persona}`,
    "Relevant memories:",
    memories.join("\n"),
  ];
  if (behaviorStyle) parts.push(`Behavior style: ${behaviorStyle}`);
  if (skills.length) parts.push(`Available skills: ${skills.join("; ")}`);
  if (filters.length) parts.push(`Applied filters: ${filters.join(", ")}`);
  return parts.join("\n").trim();
}

export default buildPrompt;
