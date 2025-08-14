import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  CreditCard,
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Settings,
  Download,
  Users,
  MessageSquare
} from 'lucide-react';
import { useSubscription } from '@/modules/payments/hooks/useSubscription'
import { toast } from '@/hooks/use-toast'
import { formatDistanceToNow } from 'date-fns';
import { useFeatureFlags } from '@/state/featureFlags';

export function SubscriptionManager() {
  return <SubscriptionManagerUI />;
}

function SubscriptionManagerUI() {
  const { subscription, usage, isLoading, isOnTrial, trialDaysLeft, cancelSubscription, refetch } = useSubscription();
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const isPro = useFeatureFlags((s) => s.isPro);

  const handleCancelSubscription = async (cancelAtPeriodEnd: boolean) => {
    try {
      setIsCanceling(true);
      await cancelSubscription(cancelAtPeriodEnd);
      toast({
        title: "Subscription Updated",
        description: cancelAtPeriodEnd
          ? "Your subscription will cancel at the end of the current period."
          : "Your subscription has been canceled immediately."
      });
      setShowCancelDialog(false);
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel subscription. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCanceling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">No Active Subscription</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">You're currently on the free plan.</p>
        <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
          Upgrade Now
        </Button>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'trialing': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'past_due': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'canceled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getUsagePercentage = (used: number, limit: number | 'unlimited') => {
    if (limit === 'unlimited') return 0;
    return Math.min((used / limit) * 100, 100);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Subscription Management</h1>
        <Button variant="outline" onClick={refetch}>
          <Settings className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Current Plan */}
      <Card className="bg-white dark:bg-gray-900">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
              Current Plan
            </CardTitle>
            <Badge className={getStatusColor(subscription.status)}>
              {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Plan</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                {subscription.planId}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Billing Cycle</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                {subscription.billingCycle}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Next Billing</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatDistanceToNow(new Date(subscription.currentPeriodEnd), { addSuffix: true })}
              </p>
            </div>
          </div>

          {isOnTrial && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-blue-500" />
                <span className="font-medium text-blue-900 dark:text-blue-100">
                  Free Trial - {trialDaysLeft} days remaining
                </span>
              </div>
            </div>
          )}

          {subscription.cancelAtPeriodEnd && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                <span className="font-medium text-yellow-900 dark:text-yellow-100">
                  Subscription will cancel on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage Statistics */}
      {usage && (
        <Card className="bg-white dark:bg-gray-900">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
              Usage This Month
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">AI Messages</span>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {usage.aiMessagesUsed} / {subscription.planId === 'freemium' ? '500' : subscription.planId === 'personal' ? '1,500' : subscription.planId === 'pro' ? '5,000' : 'Unlimited'}
                  </span>
                </div>
                <Progress 
                  value={getUsagePercentage(usage.aiMessagesUsed, subscription.planId === 'freemium' ? 500 : subscription.planId === 'personal' ? 1500 : subscription.planId === 'pro' ? 5000 : 'unlimited')} 
                  className="h-2"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Settings className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Active Widgets</span>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {usage.widgetsActive} / {subscription.planId === 'freemium' ? '3' : 'Unlimited'}
                  </span>
                </div>
                <Progress 
                  value={getUsagePercentage(usage.widgetsActive, subscription.planId === 'freemium' ? 3 : 'unlimited')} 
                  className="h-2"
                />
              </div>

              {isPro && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-purple-500" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Team Seats</span>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {usage.teamSeatsUsed} / 5
                    </span>
                  </div>
                  <Progress value={getUsagePercentage(usage.teamSeatsUsed, 5)} className="h-2" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card className="bg-white dark:bg-gray-900">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
            Manage Subscription
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="outline" className="justify-start">
              <CreditCard className="w-4 h-4 mr-2" />
              Update Payment Method
            </Button>
            <Button variant="outline" className="justify-start">
              <Download className="w-4 h-4 mr-2" />
              Download Invoices
            </Button>
            <Button variant="outline" className="justify-start">
              <Settings className="w-4 h-4 mr-2" />
              Change Plan
            </Button>
            <Button 
              variant="outline" 
              className="justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
              onClick={() => setShowCancelDialog(true)}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Cancel Subscription
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Cancel Subscription Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="bg-white dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white">
              Cancel Subscription
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-300">
              Are you sure you want to cancel your subscription? You can choose to cancel immediately or at the end of your current billing period.
            </p>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => handleCancelSubscription(true)}
                disabled={isCanceling}
                className="flex-1"
              >
                Cancel at Period End
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleCancelSubscription(false)}
                disabled={isCanceling}
                className="flex-1"
              >
                {isCanceling ? 'Canceling...' : 'Cancel Immediately'}
              </Button>
            </div>
            <Button
              variant="ghost"
              onClick={() => setShowCancelDialog(false)}
              className="w-full"
            >
              Keep Subscription
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
