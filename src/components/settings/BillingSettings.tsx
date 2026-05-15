import React, { useState, useEffect } from 'react';
import { supabase } from '@/services/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { useLocalization } from '@/hooks/useLocalization';

interface Organization {
  id: string;
  name: string;
  plan: 'free' | 'pro' | 'enterprise';
  trial_ends_at: string | null;
  billing_email: string | null;
  stripe_customer_id: string | null;
}

const PLANS = [
  {
    id: 'free' as const,
    name: 'Free',
    price: '0',
    period: '/mo',
    features: [
      'Up to 3 agents',
      '100 tickets/month',
      'Basic asset management',
      'Knowledge base (read-only)',
      'Email support',
    ],
  },
  {
    id: 'pro' as const,
    name: 'Pro',
    price: '29',
    period: '/agent/mo',
    features: [
      'Unlimited agents',
      'Unlimited tickets',
      'Full asset management',
      'Knowledge base (full access)',
      'AI Assistant',
      'SLA policies',
      'Custom reports',
      'Integrations',
      'Priority support',
    ],
    popular: true,
    priceId: 'price_pro_monthly',
  },
  {
    id: 'enterprise' as const,
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    features: [
      'Everything in Pro',
      'Dedicated infrastructure',
      'Custom integrations',
      'Advanced audit logs',
      'SSO / SAML',
      'Dedicated account manager',
      'SLA guarantee (99.99%)',
      'On-premise deployment option',
    ],
  },
];

const BillingSettings: React.FC = () => {
  const { t } = useLocalization();
  const { user } = useAuth();
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [daysLeft, setDaysLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchOrg = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('organizations')
          .select('*')
          .single();

        if (fetchError) throw fetchError;
        setOrg(data as Organization);

        if (data?.trial_ends_at) {
          const now = new Date();
          const trialEnd = new Date(data.trial_ends_at);
          const diff = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          setDaysLeft(diff);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load organization data.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrg();
  }, [user]);

  const handleUpgrade = async () => {
    if (!org) return;
    setActionLoading(true);
    setError(null);

    try {
      const proPlan = PLANS.find((p) => p.id === 'pro');
      const { data, error: fnError } = await supabase.functions.invoke('create-checkout', {
        body: { priceId: proPlan?.priceId, orgId: org.id },
      });

      if (fnError) throw fnError;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to start checkout.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleManageBilling = async () => {
    if (!org) return;
    setActionLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('create-portal', {
        body: { orgId: org.id },
      });

      if (fnError) throw fnError;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No portal URL returned.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to open billing portal.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  const currentPlan = org?.plan || 'free';
  const isFreePlan = currentPlan === 'free';
  const isPaidPlan = currentPlan === 'pro' || currentPlan === 'enterprise';
  const trialActive = isFreePlan && daysLeft !== null && daysLeft > 0;
  const trialExpired = isFreePlan && daysLeft !== null && daysLeft <= 0;

  return (
    <div>
      <h2 className="text-xl font-semibold mb-1 text-neutral-900 dark:text-white">Billing</h2>
      <p className="text-neutral-500 dark:text-neutral-400 mb-6">
        Manage your subscription plan and billing information.
      </p>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Current Plan Card */}
      <div className="mb-8 p-6 bg-gradient-to-br from-primary-50 to-primary-100/50 dark:from-primary-900/20 dark:to-primary-800/10 border border-primary-200 dark:border-primary-800 rounded-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-primary-600 dark:text-primary-400 uppercase tracking-wider mb-1">
              Current Plan
            </p>
            <h3 className="text-2xl font-bold text-neutral-900 dark:text-white capitalize">
              {currentPlan}
            </h3>
            {org?.billing_email && (
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                Billing email: {org.billing_email}
              </p>
            )}
          </div>
          <div className="flex flex-col sm:items-end gap-2">
            {trialActive && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                Trial: {daysLeft} day{daysLeft !== 1 ? 's' : ''} remaining
              </span>
            )}
            {trialExpired && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                Trial expired
              </span>
            )}
            {isPaidPlan && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                Active
              </span>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          {isFreePlan && (
            <button
              onClick={handleUpgrade}
              disabled={actionLoading}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {actionLoading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : null}
              Upgrade to Pro
            </button>
          )}
          {isPaidPlan && (
            <button
              onClick={handleManageBilling}
              disabled={actionLoading}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-600 text-neutral-900 dark:text-white font-medium rounded-xl border border-neutral-200 dark:border-neutral-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {actionLoading ? (
                <span className="w-4 h-4 border-2 border-neutral-300 border-t-neutral-600 rounded-full animate-spin" />
              ) : null}
              Manage Billing
            </button>
          )}
        </div>
      </div>

      {/* Plan Comparison */}
      <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
        Compare Plans
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {PLANS.map((plan) => {
          const isCurrentPlan = plan.id === currentPlan;
          return (
            <div
              key={plan.id}
              className={`relative p-5 rounded-2xl border-2 transition-all duration-200 ${
                isCurrentPlan
                  ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-900/10 ring-1 ring-primary-500'
                  : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800'
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-primary-600 text-white text-xs font-semibold rounded-full">
                  Most Popular
                </span>
              )}
              <div className="text-center mb-4">
                <h4 className="text-lg font-bold text-neutral-900 dark:text-white">{plan.name}</h4>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-neutral-900 dark:text-white">
                    {plan.price === 'Custom' ? '' : '$'}{plan.price}
                  </span>
                  {plan.period && (
                    <span className="text-sm text-neutral-500 dark:text-neutral-400">
                      {plan.period}
                    </span>
                  )}
                </div>
                {isCurrentPlan && (
                  <span className="inline-block mt-2 text-xs font-semibold text-primary-600 dark:text-primary-400">
                    Your current plan
                  </span>
                )}
              </div>
              <ul className="space-y-2.5">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                    <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <div className="mt-5">
                {plan.id === 'free' && !isCurrentPlan && (
                  <span className="block text-center text-sm text-neutral-400 dark:text-neutral-500">
                    --
                  </span>
                )}
                {plan.id === 'pro' && !isCurrentPlan && isFreePlan && (
                  <button
                    onClick={handleUpgrade}
                    disabled={actionLoading}
                    className="w-full py-2 px-4 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    Upgrade
                  </button>
                )}
                {plan.id === 'enterprise' && !isCurrentPlan && (
                  <a
                    href="mailto:legal@ithubcenter.com?subject=Enterprise%20Plan%20Inquiry"
                    className="block w-full py-2 px-4 text-center bg-neutral-900 dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-100 text-white dark:text-neutral-900 font-medium rounded-xl transition-colors duration-200 text-sm"
                  >
                    Contact Sales
                  </a>
                )}
                {isCurrentPlan && isPaidPlan && (
                  <button
                    onClick={handleManageBilling}
                    disabled={actionLoading}
                    className="w-full py-2 px-4 bg-white dark:bg-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-200 font-medium rounded-xl border border-neutral-200 dark:border-neutral-600 transition-colors duration-200 disabled:opacity-50 text-sm"
                  >
                    Manage
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BillingSettings;
