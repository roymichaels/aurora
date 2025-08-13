export function buildPrompt(
  persona,
  brainPolicy,
  memories,
  behaviorStyle = "",
  skills = [],
  filters = [],
) {
  const parts = [brainPolicy.trim()];

  if (typeof persona === "string") {
    if (persona) parts.push(`Persona: ${persona}`);
  } else if (persona && Object.keys(persona).length) {
    const entries = Object.entries(persona).filter(([, v]) => v);
    if (entries.length) {
      parts.push("Persona fields:");
      for (const [key, value] of entries.sort((a, b) => a[0].localeCompare(b[0]))) {
        parts.push(`${key}: ${value}`);
      }
    }
  }

  parts.push("Relevant memories:", memories.join("\n"));
  if (behaviorStyle) parts.push(`Behavior style: ${behaviorStyle}`);
  if (skills.length) parts.push(`Available skills: ${skills.join("; ")}`);
  if (filters.length) parts.push(`Applied filters: ${filters.join(", ")}`);
  return parts.join("\n").trim();
}

export default buildPrompt;
