import { Subscription, UsageStats } from '@/modules/payments/types/subscription'
import { loggedFetch } from '@/lib/loggedFetch'

const API_BASE_URL = process.env.VITE_API_BASE_URL ?? ''

async function request(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem('accessToken')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined)
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await loggedFetch(`${API_BASE_URL}${path}`, { ...options, headers }, `subscription:${path}`)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error((data as any)?.message || res.statusText)
  }
  return data
}

export const getSubscription = () =>
  request('/subscription') as Promise<{ subscription: Subscription | null; usage: UsageStats }>

export const createCheckoutSession = (priceId: string, billingCycle: 'monthly' | 'yearly') =>
  request('/subscription/checkout', {
    method: 'POST',
    body: JSON.stringify({ priceId, billingCycle })
  }) as Promise<{ sessionId: string; url: string }>

export const cancelSubscription = (cancelAtPeriodEnd = true) =>
  request('/subscription/cancel', {
    method: 'POST',
    body: JSON.stringify({ cancelAtPeriodEnd })
  }) as Promise<{ success: boolean; subscription: Subscription }>

export const updateSubscription = (priceId: string, billingCycle: 'monthly' | 'yearly') =>
  request('/subscription/update', {
    method: 'POST',
    body: JSON.stringify({ priceId, billingCycle })
  }) as Promise<{ success: boolean; subscription: Subscription }>

