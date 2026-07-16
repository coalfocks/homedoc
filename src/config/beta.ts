import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra ?? {};

export const isFreeBeta =
  process.env.EXPO_PUBLIC_HOMEDOC_FREE_BETA !== 'false' &&
  extra.freeBeta !== false;

export const betaFeedbackEmail =
  (typeof extra.betaFeedbackEmail === 'string' && extra.betaFeedbackEmail) ||
  'cfox@skriber.com';

export const betaFeedbackSubject = 'HomeDoc beta feedback';
