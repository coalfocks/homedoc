import { useCallback, useRef, useState } from 'react';
import { AppState, Linking, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { isFreeBeta } from '../config/beta';
import {
  getMonthlyPackage,
  manageSubscriptions,
  purchaseMonthly,
  restorePurchases as restoreNativePurchases,
} from '../lib/nativeBilling';

export type Entitlement = {
  plan: 'free' | 'pro';
  status: string;
  provider?: 'free' | 'beta' | 'stripe' | 'app_store';
  current_period_end?: string | null;
  beta_access?: boolean;
};

type EntitlementState = { ownerId: string | undefined; value: Entitlement };
type BillingContext = { userId: string | undefined; generation: number };
type ContextState = BillingContext & { value: boolean };
type BillingUiState = BillingContext & {
  checkoutLoading: boolean;
  error: string | null;
  notice: string | null;
};

const free: Entitlement = { plan: 'free', status: 'free', provider: 'free' };
const initialUi = (context: BillingContext): BillingUiState => ({
  ...context,
  checkoutLoading: false,
  error: null,
  notice: null,
});

export const useBilling = ({ loadOffering = false } = {}) => {
  const { user } = useAuth();
  const userId = user?.id;
  const activeUser = useRef(userId);
  const userGeneration = useRef(0);
  if (activeUser.current !== userId) {
    activeUser.current = userId;
    userGeneration.current += 1;
  }

  const [entitlementState, setEntitlementState] = useState<EntitlementState>({
    ownerId: userId,
    value: free,
  });
  const entitlementRef = useRef(entitlementState);
  const [loadingState, setLoadingState] = useState<ContextState>({
    userId,
    generation: userGeneration.current,
    value: Boolean(userId),
  });
  const [uiState, setUiState] = useState<BillingUiState>(() =>
    initialUi({ userId, generation: userGeneration.current }),
  );
  const [priceState, setPriceState] = useState<{
    userId: string | undefined;
    generation: number;
    value: string | null;
  }>({ userId, generation: userGeneration.current, value: null });
  const billingLock = useRef(false);

  const isCurrentContext = useCallback(
    (context: BillingContext) =>
      activeUser.current === context.userId &&
      userGeneration.current === context.generation,
    [],
  );

  const updateUi = useCallback(
    (
      context: BillingContext,
      patch: Partial<
        Pick<BillingUiState, 'checkoutLoading' | 'error' | 'notice'>
      >,
    ) => {
      if (!isCurrentContext(context)) return;
      setUiState((current) => {
        if (!isCurrentContext(context)) return current;
        const base =
          current.userId === context.userId &&
          current.generation === context.generation
            ? current
            : initialUi(context);
        return { ...base, ...patch };
      });
    },
    [isCurrentContext],
  );

  const refresh = useCallback(async (): Promise<boolean> => {
    const context = { userId, generation: userGeneration.current };
    if (!context.userId) {
      if (isCurrentContext(context)) {
        const next = { ownerId: undefined, value: free };
        entitlementRef.current = next;
        setEntitlementState(next);
        setLoadingState({ ...context, value: false });
      }
      return false;
    }
    if (!isCurrentContext(context)) return false;

    if (isCurrentContext(context)) setLoadingState({ ...context, value: true });
    try {
      const { data, error: queryError } =
        await supabase.rpc('get_billing_access');
      if (queryError) throw queryError;
      if (!isCurrentContext(context)) return false;
      const next = { ownerId: context.userId, value: data ?? free };
      entitlementRef.current = next;
      setEntitlementState(next);
      return true;
    } catch {
      if (isCurrentContext(context) && !isFreeBeta) {
        updateUi(context, {
          error: 'Could not load your plan. Please try again.',
        });
      }
      return false;
    } finally {
      if (isCurrentContext(context))
        setLoadingState({ ...context, value: false });
    }
  }, [isCurrentContext, updateUi, userId]);

  useFocusEffect(
    useCallback(() => {
      const context = { userId, generation: userGeneration.current };
      updateUi(context, { error: null, notice: null });
      void refresh();

      if (
        loadOffering &&
        Platform.OS === 'ios' &&
        !isFreeBeta &&
        context.userId
      ) {
        void getMonthlyPackage(context.userId)
          .then((pkg) => {
            if (!isCurrentContext(context)) return;
            setPriceState({
              ...context,
              value: pkg.product.priceString,
            });
          })
          .catch(() => {
            if (isCurrentContext(context)) {
              updateUi(context, {
                error:
                  'App Store pricing is unavailable. Please try again later.',
              });
            }
          });
      }

      const subscription = AppState.addEventListener('change', (state) => {
        if (state === 'active') void refresh();
      });
      return () => subscription.remove();
    }, [isCurrentContext, loadOffering, refresh, updateUi, userId]),
  );

  const runBilling = useCallback(
    async (operation: (context: BillingContext) => Promise<void>) => {
      if (billingLock.current) return;
      billingLock.current = true;
      const context = { userId, generation: userGeneration.current };
      updateUi(context, { checkoutLoading: true, error: null, notice: null });
      try {
        await operation(context);
      } catch (err) {
        const cancelled =
          (err as { code?: string } | null)?.code === 'purchase_cancelled';
        if (isCurrentContext(context) && !cancelled) {
          updateUi(context, {
            error:
              err instanceof Error
                ? err.message
                : 'Could not complete the purchase. Please try again.',
          });
        }
      } finally {
        if (isCurrentContext(context))
          updateUi(context, { checkoutLoading: false });
        billingLock.current = false;
      }
    },
    [isCurrentContext, updateUi, userId],
  );

  const syncPurchase = useCallback(
    async (context: BillingContext, action: 'purchase' | 'restore') => {
      if (!context.userId || !isCurrentContext(context)) {
        throw new Error(
          'Your account changed. Sign in to the purchasing account and restore purchases.',
        );
      }

      const { error: syncError } = await supabase.functions.invoke(
        'sync-app-store-entitlement',
      );
      if (syncError) {
        throw new Error(
          'Your purchase is saved by Apple, but HomeDoc could not verify it yet. Please restore purchases to retry.',
        );
      }

      const refreshed = await refresh();
      if (!refreshed || !isCurrentContext(context)) {
        throw new Error(
          'Your account changed before HomeDoc could refresh your plan.',
        );
      }

      const updated = entitlementRef.current;
      const hasAppStorePro =
        updated.ownerId === context.userId &&
        updated.value.plan === 'pro' &&
        updated.value.status === 'active' &&
        updated.value.provider === 'app_store';

      if (action === 'restore' && !hasAppStorePro) {
        updateUi(context, {
          notice:
            'No active Apple subscription was found for this HomeDoc account. If you subscribed with another account, sign in to that account and restore again.',
        });
        return;
      }
      if (!hasAppStorePro) {
        throw new Error(
          'Apple completed the purchase, but HomeDoc has not verified the subscription yet. Please restore purchases to retry.',
        );
      }
      updateUi(context, {
        notice:
          action === 'restore'
            ? 'Apple subscription restored and verified.'
            : 'Purchase verified. HomeDoc Pro is active.',
      });
    },
    [isCurrentContext, refresh, updateUi],
  );

  const openCheckout = useCallback(
    () =>
      runBilling(async (context) => {
        if (!context.userId) throw new Error('Sign in before subscribing.');
        if (Platform.OS === 'ios') {
          await purchaseMonthly(context.userId);
          await syncPurchase(context, 'purchase');
          return;
        }
        if (Platform.OS !== 'web') {
          throw new Error('Purchases are not available on this platform yet.');
        }
        const { data, error: functionError } = await supabase.functions.invoke(
          'create-checkout-session',
        );
        if (functionError || !data?.url) {
          throw new Error('Checkout is unavailable. Please try again later.');
        }
        await Linking.openURL(data.url);
      }),
    [runBilling, syncPurchase],
  );

  const restore = useCallback(
    () =>
      runBilling(async (context) => {
        if (!context.userId)
          throw new Error('Sign in before restoring purchases.');
        if (Platform.OS !== 'ios') {
          throw new Error('Restore purchases is available in the iOS app.');
        }
        await restoreNativePurchases(context.userId);
        await syncPurchase(context, 'restore');
      }),
    [runBilling, syncPurchase],
  );

  const openBillingPortal = useCallback(
    () =>
      runBilling(async (context) => {
        if (!context.userId) throw new Error('Sign in to manage billing.');
        if (Platform.OS === 'ios') {
          await manageSubscriptions(context.userId);
          return;
        }
        if (Platform.OS !== 'web') {
          throw new Error(
            'Billing settings are not available on this platform yet.',
          );
        }
        const { data, error: functionError } =
          await supabase.functions.invoke('billing-portal');
        if (functionError || !data?.url) {
          throw new Error(
            'Billing settings are unavailable. Please try again later.',
          );
        }
        await Linking.openURL(data.url);
      }),
    [runBilling],
  );

  const sameUserEntitlement = entitlementState.ownerId === userId;
  const entitlement = sameUserEntitlement ? entitlementState.value : free;
  const sameContext =
    uiState.userId === userId && uiState.generation === userGeneration.current;
  const sameLoadingContext =
    loadingState.userId === userId &&
    loadingState.generation === userGeneration.current;
  const samePriceContext =
    priceState.userId === userId &&
    priceState.generation === userGeneration.current;
  const betaAccess = isFreeBeta || entitlement.provider === 'beta';

  return {
    entitlement,
    isPro:
      betaAccess ||
      (entitlement.plan === 'pro' && entitlement.status === 'active'),
    betaAccess,
    loading: userId ? (sameLoadingContext ? loadingState.value : true) : false,
    checkoutLoading: sameContext && uiState.checkoutLoading,
    price: samePriceContext ? priceState.value : null,
    error: sameContext ? uiState.error : null,
    notice: sameContext ? uiState.notice : null,
    refresh,
    openCheckout,
    restorePurchases: restore,
    openBillingPortal,
  };
};
