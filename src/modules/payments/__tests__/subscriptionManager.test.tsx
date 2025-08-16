/** @jest-environment jsdom */
import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { jest } from '@jest/globals';
import { SubscriptionManager } from '../components/SubscriptionManager';
import { useSubscription } from '../hooks/useSubscription';

jest.mock('../hooks/useSubscription');
const mockUseSubscription = useSubscription as jest.Mock;

const baseSubscription = {
  id: 'sub_123',
  userId: 'user_1',
  planId: 'pro',
  status: 'active',
  currentPeriodStart: new Date().toISOString(),
  currentPeriodEnd: new Date().toISOString(),
  cancelAtPeriodEnd: false,
  stripeCustomerId: 'cust_123',
  stripeSubscriptionId: 'stripe_sub_123',
  billingCycle: 'monthly' as const,
};

describe('SubscriptionManager refresh', () => {
  beforeEach(() => {
    mockUseSubscription.mockReset();
  });

  it('handles missing usage object', async () => {
    const refetch = jest.fn();
    mockUseSubscription.mockReturnValue({
      subscription: baseSubscription,
      usage: null,
      isLoading: false,
      error: null,
      isOnTrial: false,
      trialDaysLeft: 0,
      canAccessFeature: jest.fn(),
      cancelSubscription: jest.fn(),
      updateSubscription: jest.fn(),
      refetch,
    });

    const user = userEvent.setup();
    render(<SubscriptionManager />);
    await user.click(screen.getByRole('button', { name: /refresh/i }));
    expect(refetch).toHaveBeenCalled();
  });

  it('handles missing usedTimes property', async () => {
    const refetch = jest.fn();
    mockUseSubscription.mockReturnValue({
      subscription: baseSubscription,
      usage: { aiMessagesUsed: 1, widgetsActive: 0, teamSeatsUsed: 0 },
      isLoading: false,
      error: null,
      isOnTrial: false,
      trialDaysLeft: 0,
      canAccessFeature: jest.fn(),
      cancelSubscription: jest.fn(),
      updateSubscription: jest.fn(),
      refetch,
    });

    const user = userEvent.setup();
    render(<SubscriptionManager />);
    await user.click(screen.getByRole('button', { name: /refresh/i }));
    expect(refetch).toHaveBeenCalled();
  });
});
