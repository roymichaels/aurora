/** @jest-environment jsdom */
import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';

function SetupDialog({ onOpenChange }: { onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog onOpenChange={onOpenChange} modal={true}>
      <DialogTrigger data-testid="trigger">Open</DialogTrigger>
      <DialogContent>
        <DialogTitle>Test Dialog</DialogTitle>
      </DialogContent>
    </Dialog>
  );
}

describe('Dialog', () => {
  test('clicking backdrop closes dialog and restores focus', async () => {
    const user = userEvent.setup();
    const onOpenChange = jest.fn();
    render(<SetupDialog onOpenChange={onOpenChange} />);

    const trigger = screen.getByTestId('trigger');
    await user.click(trigger);
    expect(onOpenChange).toHaveBeenLastCalledWith(true);

    const dialog = screen.getByRole('dialog', { name: 'Test Dialog' });
    expect(dialog).toBeInTheDocument();

    const overlay = document.querySelector('[data-state="open"][data-aria-hidden="true"]') as HTMLElement;
    await user.click(overlay);

    await waitFor(() => expect(onOpenChange).toHaveBeenLastCalledWith(false));
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('pressing ESC closes dialog and restores focus', async () => {
    const user = userEvent.setup();
    const onOpenChange = jest.fn();
    render(<SetupDialog onOpenChange={onOpenChange} />);

    const trigger = screen.getByTestId('trigger');
    await user.click(trigger);
    expect(onOpenChange).toHaveBeenLastCalledWith(true);

    const dialog = screen.getByRole('dialog', { name: 'Test Dialog' });
    expect(dialog).toBeInTheDocument();

    await user.keyboard('{Escape}');

    await waitFor(() => expect(onOpenChange).toHaveBeenLastCalledWith(false));
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
