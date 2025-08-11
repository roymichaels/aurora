import { useApiCallLog } from '@/state/apiCallLog';

export function loggedFetch(input: RequestInfo | URL, init?: RequestInit, reason = '') {
  const endpoint = typeof input === 'string' ? input : input.toString();
  useApiCallLog.getState().add(endpoint, reason);
  return fetch(input, init);
}
