/** @jest-environment jsdom */
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { jest } from '@jest/globals';
import QuickStartButtons from '../components/QuickStartButtons';

class MockPlanner {
  constructor(private steps: string[]) {}
  plan = jest.fn(() => this.steps);
}

describe('QuickStartButtons', () => {
  it('generates daily plan', () => {
    const planner = new MockPlanner(['step a', 'step b']);
    render(<QuickStartButtons planner={planner as any} />);
    fireEvent.click(screen.getByText('Daily Plan'));
    expect(planner.plan).toHaveBeenCalledWith('my day');
    expect(screen.getByText('step a')).toBeInTheDocument();
    expect(screen.getByText('step b')).toBeInTheDocument();
  });

  it('generates goal breakdown', () => {
    const planner = new MockPlanner(['goal 1', 'goal 2']);
    render(<QuickStartButtons planner={planner as any} />);
    fireEvent.click(screen.getByText('Goal Breakdown'));
    expect(planner.plan).toHaveBeenCalledWith('my goal');
    expect(screen.getByText('goal 1')).toBeInTheDocument();
  });
});
