import { useState, useEffect, useCallback } from 'react'
import { Subscription, UsageStats } from '@/modules/payments/types/subscription'
import { getSubscription, cancelSubscription, updateSubscription } from '@/modules/payments/api/subscription'
import { useFeatureFlags } from '@/state/featureFlags'

export function useSubscription() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await getSubscription();
      const sub = (response as any).subscription as Subscription | null;
      setSubscription(sub);
      setUsage((response as any).usage);
      useFeatureFlags.setState({ isPro: !!sub && sub.planId !== 'freemium' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch subscription');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const cancelSub = useCallback(async (cancelAtPeriodEnd: boolean = true) => {
    try {
      const response = await cancelSubscription(cancelAtPeriodEnd);
      const sub = (response as any).subscription as Subscription | null;
      setSubscription(sub);
      useFeatureFlags.setState({ isPro: !!sub && sub.planId !== 'freemium' });
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel subscription');
      throw err;
    }
  }, []);

  const updateSub = useCallback(async (priceId: string, billingCycle: 'monthly' | 'yearly') => {
    try {
      const response = await updateSubscription(priceId, billingCycle);
      const sub = (response as any).subscription as Subscription | null;
      setSubscription(sub);
      useFeatureFlags.setState({ isPro: !!sub && sub.planId !== 'freemium' });
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update subscription');
      throw err;
    }
  }, []);

  const isOnTrial = subscription?.status === 'trialing';
  const trialDaysLeft = subscription?.trialEnd 
    ? Math.max(0, Math.ceil((new Date(subscription.trialEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  const canAccessFeature = useCallback((feature: string) => {
    if (!subscription) return false;
    
    switch (subscription.planId) {
      case 'freemium':
        return ['basic_chat', 'basic_widgets'].includes(feature);
      case 'personal':
        return !['team_projects', 'api_access', 'voice_features'].includes(feature);
      case 'pro':
        return feature !== 'enterprise_features';
      case 'enterprise':
        return true;
      default:
        return false;
    }
  }, [subscription]);

  return {
    subscription,
    usage,
    isLoading,
    error,
    isOnTrial,
    trialDaysLeft,
    canAccessFeature,
    cancelSubscription: cancelSub,
    updateSubscription: updateSub,
    refetch: fetchSubscription
  };
}
