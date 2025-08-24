/** @jest-environment jsdom */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import MasterPlanView from '../MasterPlanView';

const mockPlan = {
  goals: [],
  habits: [
    { title: 'Drink Water', frequency: 'daily', trigger: 'Morning' },
    { title: 'Read Book', frequency: 'weekly', trigger: 'Evening' },
  ],
  plan_versions: [],
};

jest.mock('@/hooks/useTonSession', () => ({
  useTonSession: () => ({ user: { id: '1' } }),
}));

jest.mock('@/hooks/usePlanUpdater', () => ({
  usePlanUpdater: () => ({ plan: mockPlan, update: jest.fn() }),
}));

jest.mock('@/hooks/useChatInputFocus', () => ({
  useChatInputFocus: () => jest.fn(),
}));

jest.mock('@/components/goals/GoalForm', () => ({ __esModule: true, default: () => <div /> }));
jest.mock('@/components/control/TasksManager', () => ({ __esModule: true, default: () => <div /> }));
jest.mock('@/components/habits/HabitTracker', () => ({
  __esModule: true,
  default: () => <div data-testid="habit-tracker" />,
}));

jest.mock('@/components/ui/button', () => ({
  __esModule: true,
  Button: (props: any) => <button {...props} />,
}));
jest.mock('@/components/ui/input', () => ({
  __esModule: true,
  Input: (props: any) => <input {...props} />,
}));
jest.mock('@/components/ui/dialog', () => ({
  __esModule: true,
  Dialog: ({ children }: any) => <div>{children}</div>,
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogFooter: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <div>{children}</div>,
}));
jest.mock('@/components/ui/textarea', () => ({
  __esModule: true,
  Textarea: (props: any) => <textarea {...props} />,
}));
jest.mock('@/components/ui/select', () => ({
  __esModule: true,
  Select: ({ children, onValueChange, value }: any) => (
    <select onChange={(e) => onValueChange(e.target.value)} value={value}>
      {children}
    </select>
  ),
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
  SelectTrigger: ({ children }: any) => <>{children}</>,
  SelectValue: ({ placeholder }: any) => <>{placeholder}</>,
}));

jest.mock('@/hooks/use-toast', () => ({ toast: jest.fn() }));

jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn((table: string) => {
      if (table === 'master_plans') {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({ limit: () => ({ maybeSingle: () => Promise.resolve({ data: null }) }) }),
            }),
          }),
        };
      }
      return {
        select: () => ({ eq: () => ({ order: () => Promise.resolve({ data: [] }) }) }),
      };
    }),
    functions: { invoke: jest.fn() },
  },
}));

it('renders habit cards from generated plan', () => {
  render(<MasterPlanView />);
  expect(screen.getByText('Drink Water')).toBeInTheDocument();
  expect(screen.getByText('Read Book')).toBeInTheDocument();
});
