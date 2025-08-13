import { logEvent } from '@/integrations/supabase/gameSync';

export async function guardPremiumAction(
  canAccess: (feature: string) => boolean,
  feature: string,
  actionName: string,
  freeAlternative: string
): Promise<'pro' | 'free' | null> {
  if (canAccess(feature)) {
    return 'pro';
  }
  try {
    await logEvent('pro_action_upsell', { action: actionName });
  } catch {
    /* ignore logging errors */
  }
  const confirmFn = typeof globalThis.confirm === 'function' ? globalThis.confirm : () => true;
  const proceed = confirmFn(
    `That's a Pro action. Upgrade to enable it—or I can ${freeAlternative}. Proceed?`
  );
  return proceed ? 'free' : null;
}
