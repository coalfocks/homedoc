import { requireNativeModule, type EventSubscription } from 'expo-modules-core';

export type NativeStoreTransactionUpdate = {
  transactionId: string;
  productId: string;
  appAccountToken: string;
};

type HomeDocStoreKitEvents = {
  onTransactionUpdate: (update: NativeStoreTransactionUpdate) => void;
};

export type NativeStoreProduct = {
  productId: string;
  title: string;
  description: string;
  price: number;
  priceString: string;
  currencyCode: string;
  subscriptionPeriod: string | null;
  isAutoRenewable: boolean;
};

export type NativeStorePurchaseResult =
  | { status: 'purchased'; transactionId: string; productId: string }
  | { status: 'pending' }
  | { status: 'cancelled' };

export type HomeDocStoreKitModule = {
  addListener<EventName extends keyof HomeDocStoreKitEvents>(
    eventName: EventName,
    listener: HomeDocStoreKitEvents[EventName],
  ): EventSubscription;
  getProducts(productIDs: string[]): Promise<NativeStoreProduct[]>;
  purchase(
    productID: string,
    appAccountToken: string,
  ): Promise<NativeStorePurchaseResult>;
  getCurrentEntitlements(
    appAccountToken: string,
    productIDs: string[],
  ): Promise<string[]>;
  restorePurchases(
    appAccountToken: string,
    productIDs: string[],
  ): Promise<string[]>;
  finishTransaction(transactionID: string): Promise<boolean>;
};

export default requireNativeModule<HomeDocStoreKitModule>('HomeDocStoreKit');
