import { useApiCallLog } from '@/state/apiCallLog';
import { retryWithBackoff } from '@/utils/retry';

export function loggedFetch(input: RequestInfo | URL, init?: RequestInit, reason = '') {
  const endpoint = typeof input === 'string' ? input : input.toString();
  useApiCallLog.getState().add(endpoint, reason);
  return retryWithBackoff(() => fetch(input, init));
}
