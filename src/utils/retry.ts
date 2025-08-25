import { toast } from '@/hooks/use-toast';

type ToastHandle = ReturnType<typeof toast>;

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  initialDelay = 500,
): Promise<T> {
  let attempt = 0;
  let t: ToastHandle | undefined;
  while (attempt <= maxRetries) {
    try {
      const result = await fn();
      if (t && attempt > 0) {
        t.update({ id: t.id, description: 'Success' });
        setTimeout(() => t?.dismiss(), 2000);
      }
      return result;
    } catch (err) {
      if (!t) {
        t = toast({ description: 'Something went wrong—retrying' });
      }
      attempt++;
      if (attempt > maxRetries) {
        t.update({ id: t.id, description: 'Failed', variant: 'destructive' });
        setTimeout(() => t?.dismiss(), 2000);
        throw err;
      }
      const delay = initialDelay * Math.pow(2, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error('retryWithBackoff reached unexpected state');
}
