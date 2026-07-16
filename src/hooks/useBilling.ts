import { useCallback, useState } from 'react';
import { Linking } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { isFreeBeta } from '../config/beta';

export type Entitlement = {
  plan: 'free' | 'pro';
  status: string;
  current_period_end?: string | null;
  cancel_at_period_end?: boolean | null;
};

const proStatuses = new Set(['active', 'trialing']);

export const useBilling = () => {
  const { user } = useAuth();
  const [entitlement, setEntitlement] = useState<Entitlement>({
    plan: 'free',
    status: 'free',
  });
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setEntitlement({ plan: 'free', status: 'free' });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const { data, error: queryError } = await supabase
        .from('user_entitlements')
        .select('plan, status, current_period_end, cancel_at_period_end')
        .eq('user_id', user.id)
        .maybeSingle();

      if (queryError) {
        throw queryError;
      }

      setEntitlement(
        data
          ? {
              plan: data.plan === 'pro' ? 'pro' : 'free',
              status: data.status ?? 'free',
              current_period_end: data.current_period_end,
              cancel_at_period_end: data.cancel_at_period_end,
            }
          : { plan: 'free', status: 'free' },
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not load billing status right now.',
      );
      setEntitlement({ plan: 'free', status: 'free' });
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const openCheckout = useCallback(async () => {
    try {
      setCheckoutLoading(true);
      setError(null);
      const { data, error: functionError } = await supabase.functions.invoke(
        'create-checkout-session',
      );

      if (functionError) {
        throw functionError;
      }

      if (!data?.url) {
        throw new Error('Checkout did not return a payment link.');
      }

      await Linking.openURL(data.url);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not start checkout right now.',
      );
    } finally {
      setCheckoutLoading(false);
    }
  }, []);

  const openBillingPortal = useCallback(async () => {
    try {
      setCheckoutLoading(true);
      setError(null);
      const { data, error: functionError } =
        await supabase.functions.invoke('billing-portal');

      if (functionError) {
        throw functionError;
      }

      if (!data?.url) {
        throw new Error('Billing portal did not return a link.');
      }

      await Linking.openURL(data.url);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not open billing settings right now.',
      );
    } finally {
      setCheckoutLoading(false);
    }
  }, []);

  const isPro =
    isFreeBeta ||
    (entitlement.plan === 'pro' && proStatuses.has(entitlement.status));

  return {
    entitlement,
    isPro,
    betaAccess: isFreeBeta,
    loading,
    checkoutLoading,
    error,
    refresh,
    openCheckout,
    openBillingPortal,
  };
};
