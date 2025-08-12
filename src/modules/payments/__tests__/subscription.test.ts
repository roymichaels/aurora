import { jest } from '@jest/globals';

// Mock loggedFetch to avoid real network calls and side effects
const mockLoggedFetch = jest.fn();
jest.mock('@/lib/loggedFetch', () => ({ loggedFetch: mockLoggedFetch }));

let getSubscription: any;
let updateSubscription: any;
let cancelSubscription: any;

beforeAll(async () => {
  ({ getSubscription, updateSubscription, cancelSubscription } = await import('../api/subscription'));
});

// Helpers
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

beforeEach(() => {
  mockLoggedFetch.mockReset();
  // minimal localStorage stub
  (global as any).localStorage = {
    getItem: jest.fn(() => null),
  };
});

describe('subscription API', () => {
  it('fetches current subscription and usage', async () => {
    const responseData = {
      subscription: baseSubscription,
      usage: { aiMessagesUsed: 10, widgetsActive: 2, teamSeatsUsed: 1 },
    };
    mockLoggedFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(responseData), { status: 200 })
    );

    const data = await getSubscription();

    expect(mockLoggedFetch).toHaveBeenCalledWith(
      '/subscription',
      expect.objectContaining({ headers: expect.any(Object) }),
      'subscription:/subscription'
    );
    expect(data).toEqual(responseData);
  });

  it('updates subscription plan', async () => {
    const responseData = { success: true, subscription: baseSubscription };
    mockLoggedFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(responseData), { status: 200 })
    );

    const data = await updateSubscription('price_123', 'yearly');

    expect(mockLoggedFetch).toHaveBeenCalledWith(
      '/subscription/update',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ priceId: 'price_123', billingCycle: 'yearly' }),
        headers: expect.any(Object),
      }),
      'subscription:/subscription/update'
    );
    expect(data).toEqual(responseData);
  });

  it('cancels subscription', async () => {
    const responseData = { success: true, subscription: baseSubscription };
    mockLoggedFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(responseData), { status: 200 })
    );

    const data = await cancelSubscription(false);

    expect(mockLoggedFetch).toHaveBeenCalledWith(
      '/subscription/cancel',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ cancelAtPeriodEnd: false }),
        headers: expect.any(Object),
      }),
      'subscription:/subscription/cancel'
    );
    expect(data).toEqual(responseData);
  });
});

