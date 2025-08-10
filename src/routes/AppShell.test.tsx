import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AppShell from './AppShell';

vi.mock('@/views/registry', () => ({ views: [] }));
vi.mock('@/components/hud/GameHUD', () => ({ GameHUD: () => <div data-testid="hud" /> }));
vi.mock('@/components/live/FloatingAssistant', () => ({ FloatingAssistant: () => null }));
vi.mock('@/utils/bus', () => ({ bus: { on: () => () => {} } }));
vi.mock('@/state/view', () => ({ useViewNav: () => vi.fn() }));
vi.mock('@/hooks/useXPChime', () => ({ useXPChime: () => {} }));
vi.mock('@/hooks/useSwipeNav', () => ({ useSwipeNav: () => ({}) }));
vi.mock('@/views/ControlView', () => ({ default: () => <div data-testid="control-view" /> }));

describe('AppShell routing', () => {
  it('renders control view at default route', () => {
    const { getByTestId } = render(
      <MemoryRouter initialEntries={['/app']}>
        <Routes>
          <Route path="/app/*" element={<AppShell />} />
        </Routes>
      </MemoryRouter>
    );
    expect(getByTestId('control-view')).toBeDefined();
  });
});
