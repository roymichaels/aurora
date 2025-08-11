import { safetyFilter } from '@/agent/safety'

export type Filter = (text: string) => string

export const filterRegistry: Record<string, Filter> = {
  trim: text => text.trim(),
  lowercase: text => text.toLowerCase(),
  uppercase: text => text.toUpperCase(),
  safety: safetyFilter,
}

export type FilterName = keyof typeof filterRegistry

/**
 * List of filters applied to every outgoing message.
 */
export const filters: Filter[] = [filterRegistry.trim, filterRegistry.safety]

export function getFilterByName(name: string): Filter | undefined {
  return filterRegistry[name as FilterName]
}

export function getFilterName(fn: Filter): string | undefined {
  for (const [name, filter] of Object.entries(filterRegistry)) {
    if (filter === fn) return name
  }
  return undefined
}

export default filters
