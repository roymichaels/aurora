/** @jest-environment jsdom */
import * as React from 'react';
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

jest.mock('../../src/components/settings/VoiceSettings.tsx', () => ({
  __esModule: true,
  default: () => <div />,
}));

jest.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'light', setTheme: jest.fn() }),
}));

let QuickSettingsPanel: any;
beforeAll(async () => {
  QuickSettingsPanel = (await import('./QuickSettingsPanel')).default;
});

describe('QuickSettingsPanel', () => {
  test('focus is trapped within the sheet', async () => {
    const user = userEvent.setup();
    render(<QuickSettingsPanel open onClose={() => {}} />);
    const dialog = screen.getByRole('dialog');
    await user.tab();
    for (let i = 0; i < 10; i++) {
      await user.tab();
    }
    expect(dialog).toContainElement(document.activeElement as HTMLElement);
  });

  function Setup() {
    const [open, setOpen] = React.useState(false);
    return (
      <>
        <button onClick={() => setOpen(true)} data-testid="trigger">Open</button>
        <QuickSettingsPanel open={open} onClose={() => setOpen(false)} />
      </>
    );
  }

  test('pressing ESC closes the sheet', async () => {
    const user = userEvent.setup();
    render(<Setup />);
    const trigger = screen.getByTestId('trigger');
    await user.click(trigger);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  test('clicking outside closes the sheet', async () => {
    const user = userEvent.setup();
    render(<Setup />);
    const trigger = screen.getByTestId('trigger');
    await user.click(trigger);
    const overlay = document.querySelector('[data-state="open"][data-aria-hidden="true"]') as HTMLElement;
    await user.click(overlay);
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
});
