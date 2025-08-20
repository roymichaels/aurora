import { actions } from './registry';
import type { ActionResult } from './types';
import { useProgressStore } from '@/state/progress';
import { track } from '@/utils/telemetry';

export async function dispatch(
  id: string,
  params: any = {},
): Promise<ActionResult> {
  const action = actions.get(id);
  if (!action) {
    console.warn('[dispatcher] unknown action', id);
    return { success: false, error: 'unknown_action' };
  }

  if (action.confirm && typeof window !== 'undefined') {
    const ok = window.confirm(`Allow action ${id}?`);
    if (!ok) {
      track('agent/action_cancelled', { id });
      return { success: false, error: 'cancelled' };
    }
  }

  const result = await action.run(params).catch((e) => ({ success: false, error: String(e) }));
  if (result.success && action.reward) {
    try {
      useProgressStore.getState().awardXP(action.reward, { action: id });
    } catch {}
  }
  track('agent/action', { id, success: result.success });
  return result;
}
