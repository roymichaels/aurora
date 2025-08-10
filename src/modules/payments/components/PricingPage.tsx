import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Check,
  Star,
  Zap,
  Users,
  Shield,
  Headphones,
  MessageSquare,
  BarChart3,
  Cloud,
  Mic,
  Building,
  Crown
} from 'lucide-react';
import { PricingTier } from '@/modules/payments/types/subscription'
import { createCheckoutSession } from '@/modules/payments/api/subscription'
import { useSubscription } from '@/modules/payments/hooks/useSubscription'
import { toast } from '@/hooks/use-toast'

/**
 * TODO: Activate billing UI when payments module is ready.
 */
export function PricingPage() {
  return null;
}

const PRICING_TIERS: PricingTier[] = [
  {
    id: 'freemium',
    name: 'Freemium',
    price: { monthly: 0, yearly: 0 },
    features: [
      '3 unlocked widgets',
      '500 AI messages/month',
      'Basic sphere + chat',
      'Local storage only',
      'Community support'
    ],
    limits: {
      widgets: 3,
      aiMessages: 500
    },
    buttonText: 'Get Started Free',
    stripePriceIds: {
      monthly: '',
      yearly: ''
    }
  },
  {
    id: 'personal',
    name: 'Personal',
    price: { monthly: 9, yearly: 90 },
    features: [
      'Unlimited widgets',
      '1,500 AI messages/month',
      'Full analytics dashboard',
      'Calendar & fitness integrations',
      'Cloud sync across devices',
      'Email support'
    ],
    limits: {
      widgets: 'unlimited',
      aiMessages: 1500
    },
    popular: true,
    buttonText: 'Start Free Trial',
    stripePriceIds: {
      monthly: 'price_personal_monthly',
      yearly: 'price_personal_yearly'
    }
  },
  {
    id: 'pro',
    name: 'Pro',
    price: { monthly: 25, yearly: 240 },
    features: [
      '5,000 AI messages/month',
      'Voice features (ElevenLabs + Whisper)',
      'Team projects (5 seats)',
      'Custom widgets via API',
      'API access & webhooks',
      '2-year data history',
      'Priority support'
    ],
    limits: {
      widgets: 'unlimited',
      aiMessages: 5000,
      teamSeats: 5,
      history: '2 years'
    },
    buttonText: 'Upgrade to Pro',
    stripePriceIds: {
      monthly: 'price_pro_monthly',
      yearly: 'price_pro_yearly'
    }
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: { monthly: 0, yearly: 0 },
    features: [
      'Unlimited usage',
      'SLA & dedicated instance',
      'HIPAA/GDPR compliance',
      'SSO & white-label',
      'Dedicated success manager',
      'Custom integrations',
      '24/7 phone support'
    ],
    limits: {
      widgets: 'unlimited',
      aiMessages: 'unlimited'
    },
    buttonText: 'Contact Sales',
    stripePriceIds: {
      monthly: '',
      yearly: ''
    }
  }
];

const FEATURE_COMPARISON = [
  { feature: 'AI Messages', freemium: '500/month', personal: '1,500/month', pro: '5,000/month', enterprise: 'Unlimited' },
  { feature: 'Widgets', freemium: '3', personal: 'Unlimited', pro: 'Unlimited', enterprise: 'Unlimited' },
  { feature: 'Cloud Sync', freemium: '❌', personal: '✅', pro: '✅', enterprise: '✅' },
  { feature: 'Analytics', freemium: 'Basic', personal: 'Full', pro: 'Advanced', enterprise: 'Custom' },
  { feature: 'Team Seats', freemium: '1', personal: '1', pro: '5', enterprise: 'Unlimited' },
  { feature: 'Voice Features', freemium: '❌', personal: '❌', pro: '✅', enterprise: '✅' },
  { feature: 'API Access', freemium: '❌', personal: '❌', pro: '✅', enterprise: '✅' },
  { feature: 'Data History', freemium: '30 days', personal: '1 year', pro: '2 years', enterprise: 'Unlimited' },
  { feature: 'Support', freemium: 'Community', personal: 'Email', pro: 'Priority', enterprise: '24/7 Phone' }
];

function PricingPageUI() {
  const [isYearly, setIsYearly] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const { subscription } = useSubscription();

  const handleSubscribe = async (tier: PricingTier) => {
    if (tier.id === 'freemium') {
      toast({
        title: "Already on Free Plan",
        description: "You're currently using the free tier. Upgrade to unlock more features!"
      });
      return;
    }

    if (tier.id === 'enterprise') {
      window.open('mailto:sales@lifepilot.ai?subject=Enterprise Plan Inquiry', '_blank');
      return;
    }

    try {
      setIsLoading(tier.id);
      const priceId = isYearly ? tier.stripePriceIds.yearly : tier.stripePriceIds.monthly;
      const response = await createCheckoutSession(priceId, isYearly ? 'yearly' : 'monthly');

      // In a real app, redirect to Stripe Checkout
      window.open((response as any).url, '_blank');

      toast({
        title: "Redirecting to Checkout",
        description: "You'll be redirected to Stripe to complete your subscription."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create checkout session. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(null);
    }
  };

  const getDiscountPercentage = (tier: PricingTier) => {
    if (tier.price.monthly === 0) return 0;
    const monthlyTotal = tier.price.monthly * 12;
    const yearlyPrice = tier.price.yearly;
    return Math.round(((monthlyTotal - yearlyPrice) / monthlyTotal) * 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-blue-900 dark:to-purple-900">
      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Choose Your <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Aurora</span> Plan
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Unlock your potential with AI-powered life management. Start free, upgrade when you're ready.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center space-x-4 mb-8">
            <span className={`text-sm font-medium ${!isYearly ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
              Monthly
            </span>
            <Switch
              checked={isYearly}
              onCheckedChange={setIsYearly}
              className="data-[state=checked]:bg-purple-600"
            />
            <span className={`text-sm font-medium ${isYearly ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
              Yearly
            </span>
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              Save up to 25%
            </Badge>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {PRICING_TIERS.map((tier, index) => (
            <motion.div
              key={tier.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative"
            >
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-1">
                    <Star className="w-3 h-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}

              <Card className={`h-full ${tier.popular ? 'ring-2 ring-purple-500 shadow-xl' : 'shadow-lg'} bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300`}>
                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-4">
                    {tier.id === 'freemium' && <Zap className="w-8 h-8 text-blue-500" />}
                    {tier.id === 'personal' && <Users className="w-8 h-8 text-purple-500" />}
                    {tier.id === 'pro' && <Crown className="w-8 h-8 text-yellow-500" />}
                    {tier.id === 'enterprise' && <Building className="w-8 h-8 text-gray-700" />}
                  </div>
                  <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                    {tier.name}
                  </CardTitle>
                  <div className="mt-4">
                    {tier.price.monthly === 0 ? (
                      <div className="text-4xl font-bold text-gray-900 dark:text-white">
                        {tier.id === 'enterprise' ? 'Custom' : 'Free'}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="text-4xl font-bold text-gray-900 dark:text-white">
                          ${isYearly ? Math.round(tier.price.yearly / 12) : tier.price.monthly}
                          <span className="text-lg font-normal text-gray-500 dark:text-gray-400">/mo</span>
                        </div>
                        {isYearly && tier.price.yearly > 0 && (
                          <div className="text-sm text-green-600 dark:text-green-400">
                            Save {getDiscountPercentage(tier)}% annually
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {tier.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start space-x-3">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-600 dark:text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => handleSubscribe(tier)}
                    disabled={isLoading === tier.id}
                    className={`w-full ${
                      tier.popular
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'
                        : tier.id === 'freemium'
                        ? 'bg-gray-600 hover:bg-gray-700'
                        : 'bg-gray-800 hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600'
                    } text-white`}
                  >
                    {isLoading === tier.id ? 'Processing...' : tier.buttonText}
                  </Button>

                  {tier.id === 'personal' && (
                    <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                      14-day free trial • No credit card required
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Add-ons Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-16"
        >
          <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center text-gray-900 dark:text-white">
                Add-ons & Extras
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 rounded-lg bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
                  <MessageSquare className="w-8 h-8 text-blue-500 mx-auto mb-3" />
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Extra AI Messages</h3>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">$5</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">+1,000 messages</p>
                </div>
                <div className="text-center p-6 rounded-lg bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20">
                  <Users className="w-8 h-8 text-green-500 mx-auto mb-3" />
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Additional Team Seat</h3>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">$5</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">per month each</p>
                </div>
                <div className="text-center p-6 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
                  <Shield className="w-8 h-8 text-purple-500 mx-auto mb-3" />
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Custom Integrations</h3>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Quote</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Tailored solutions</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Feature Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                  Compare Features
                </CardTitle>
                <Button
                  variant="outline"
                  onClick={() => setShowComparison(!showComparison)}
                  className="border-purple-200 hover:bg-purple-50 dark:border-purple-700 dark:hover:bg-purple-900/20"
                >
                  {showComparison ? 'Hide' : 'Show'} Comparison
                </Button>
              </div>
            </CardHeader>
            {showComparison && (
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Feature</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-white">Freemium</th>
                        <th className="text-center py-3 px-4 font-semibold text-purple-600">Personal</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-white">Pro</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-white">Enterprise</th>
                      </tr>
                    </thead>
                    <tbody>
                      {FEATURE_COMPARISON.map((row, index) => (
                        <tr key={index} className="border-b border-gray-100 dark:border-gray-800">
                          <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{row.feature}</td>
                          <td className="py-3 px-4 text-center text-gray-600 dark:text-gray-300">{row.freemium}</td>
                          <td className="py-3 px-4 text-center text-purple-600 font-medium">{row.personal}</td>
                          <td className="py-3 px-4 text-center text-gray-600 dark:text-gray-300">{row.pro}</td>
                          <td className="py-3 px-4 text-center text-gray-600 dark:text-gray-300">{row.enterprise}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            )}
          </Card>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-16 text-center"
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            Frequently Asked Questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm text-left">
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Can I change plans anytime?</h3>
                <p className="text-gray-600 dark:text-gray-300">Yes! You can upgrade or downgrade your plan at any time. Changes are prorated automatically.</p>
              </CardContent>
            </Card>
            <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm text-left">
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">What happens to my data if I cancel?</h3>
                <p className="text-gray-600 dark:text-gray-300">Your data is safely stored for 90 days after cancellation, giving you time to reactivate or export.</p>
              </CardContent>
            </Card>
            <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm text-left">
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Is there a free trial?</h3>
                <p className="text-gray-600 dark:text-gray-300">Yes! Personal plan includes a 14-day free trial with no credit card required.</p>
              </CardContent>
            </Card>
            <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm text-left">
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">How does billing work?</h3>
                <p className="text-gray-600 dark:text-gray-300">We bill monthly or annually. Annual plans save up to 25% and all changes are prorated.</p>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
