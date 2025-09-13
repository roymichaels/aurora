/** @jest-environment jsdom */
import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StoreCreation from './StoreCreation';
import { mintStoreNFT } from '@/agent/stores-agent';

jest.mock('@/agent/stores-agent', () => ({
  mintStoreNFT: jest.fn(),
}));

jest.mock('@/hooks/useNearSession', () => ({
  useNearSession: () => ({ user: { id: 'user-1' } }),
}));

describe('StoreCreation', () => {
  test('shows error when mintStoreNFT fails', async () => {
    const user = userEvent.setup();
    (mintStoreNFT as jest.Mock).mockRejectedValue(new Error('Mint failed'));

    render(<StoreCreation />);

    await user.type(screen.getByPlaceholderText('Store name'), 'Test');
    await user.click(screen.getByRole('button', { name: /create store/i }));

    await waitFor(() =>
      expect(screen.getByText('Mint failed')).toBeInTheDocument()
    );
  });
});
