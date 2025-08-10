export interface PricingTier {
  id: string;
  name: string;
  price: {
    monthly: number;
    yearly: number;
  };
  features: string[];
  limits: {
    widgets: number | 'unlimited';
    aiMessages: number | 'unlimited';
    teamSeats?: number;
    history?: string;
  };
  popular?: boolean;
  buttonText: string;
  stripePriceIds: {
    monthly: string;
    yearly: string;
  };
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  trialEnd?: Date;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  billingCycle: 'monthly' | 'yearly';
}

export interface UsageStats {
  aiMessagesUsed: number;
  widgetsActive: number;
  teamSeatsUsed: number;
}
