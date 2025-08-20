import { bus } from '@/utils/bus';
import { useFocusTimer } from '@/state/focusTimer';
import { AgentAction } from './types';

export const actions = new Map<string, AgentAction>([
  [
    'view.open',
    {
      id: 'view.open',
      scope: 'view',
      run: async ({ id, params }: { id: string; params?: Record<string, string> }) => {
        bus.emit('nav:view', { id, params });
        return { success: true };
      },
    },
  ],
  [
    'task.create',
    {
      id: 'task.create',
      scope: 'task',
      confirm: true,
      run: async (p: { title: string }) => {
        console.debug('[actions] create task', p);
        return { success: true };
      },
    },
  ],
  [
    'focus.start',
    {
      id: 'focus.start',
      scope: 'focus',
      reward: 10,
      run: async () => {
        useFocusTimer.getState().start();
        return { success: true };
      },
    },
  ],
]);
