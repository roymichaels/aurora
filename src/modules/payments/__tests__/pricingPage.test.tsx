/** @jest-environment jsdom */
import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { jest } from '@jest/globals';

// Mock external modules
jest.mock('framer-motion', () => {
  const React = require('react');
  return {
    motion: {
      div: React.forwardRef((props: any, ref: any) => React.createElement('div', { ...props, ref })),
    },
  };
});

jest.mock('@/hooks/use-toast', () => ({ toast: jest.fn() }));

jest.mock('@/modules/payments/api/subscription', () => ({
  createCheckoutSession: jest.fn().mockResolvedValue({ url: 'https://example.com' }),
}));

jest.mock('@/modules/payments/hooks/useSubscription', () => ({
  useSubscription: jest.fn().mockReturnValue({ subscription: null }),
}));

import { createCheckoutSession } from '@/modules/payments/api/subscription';
import { PricingPage } from '../components/PricingPage';

const tiersWithCheckout = [
  {
    button: /start free trial/i,
    priceId: 'price_personal_monthly',
    yearlyPriceId: 'price_personal_yearly',
  },
  {
    button: /upgrade to pro/i,
    priceId: 'price_pro_monthly',
    yearlyPriceId: 'price_pro_yearly',
  },
];

const tiersWithoutCheckout = [/get started free/i, /contact sales/i];

describe('PricingPage checkout flow', () => {
  beforeEach(() => {
    (createCheckoutSession as jest.Mock).mockClear();
  });

  it.each(tiersWithCheckout)(
    'creates checkout session for %p tier on monthly billing',
    async ({ button, priceId }) => {
      const user = userEvent.setup();
      render(<PricingPage />);
      await user.click(screen.getByRole('button', { name: button }));
      expect(createCheckoutSession).toHaveBeenCalledWith(priceId, 'monthly');
    }
  );

  it.each(tiersWithCheckout)(
    'creates checkout session for %p tier on yearly billing',
    async ({ button, yearlyPriceId }) => {
      const user = userEvent.setup();
      render(<PricingPage />);
      await user.click(screen.getByRole('switch'));
      await user.click(screen.getByRole('button', { name: button }));
      expect(createCheckoutSession).toHaveBeenCalledWith(yearlyPriceId, 'yearly');
    }
  );

  it.each(tiersWithoutCheckout)(
    'does not create checkout session for %p tier',
    async (button) => {
      const user = userEvent.setup();
      render(<PricingPage />);
      await user.click(screen.getByRole('button', { name: button }));
      expect(createCheckoutSession).not.toHaveBeenCalled();
    }
  );
});

