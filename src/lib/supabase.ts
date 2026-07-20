import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { AppState, Platform } from 'react-native';
import Constants from 'expo-constants';

// Initialize the Supabase client
const extra = Constants.expoConfig?.extra ?? {};
export const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  (typeof extra.supabaseUrl === 'string' ? extra.supabaseUrl : '');
export const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  (typeof extra.supabaseAnonKey === 'string' ? extra.supabaseAnonKey : '');

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

const secureAuthStorage = {
  getItem: (key: string) => {
    if (Platform.OS === 'web') return AsyncStorage.getItem(key);
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    if (Platform.OS === 'web') return AsyncStorage.setItem(key, value);
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    if (Platform.OS === 'web') return AsyncStorage.removeItem(key);
    return SecureStore.deleteItemAsync(key);
  },
};

export const supabase = createClient(
  supabaseUrl || 'https://missing-project.supabase.co',
  supabaseAnonKey || 'missing-anon-key',
  {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: Platform.OS === 'web',
      persistSession: true,
      storage: secureAuthStorage,
    },
  },
);

if (Platform.OS !== 'web') {
  if (AppState.currentState === 'active') {
    supabase.auth.startAutoRefresh();
  }

  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}

// Types for our database tables
export type Property = {
  id: string;
  name: string;
  nickname?: string;
  address_line_1: string | null;
  address_line_2?: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  user_id: string;
  household_id?: string | null;
  image_url: string;
  created_at: string;
  updated_at: string;
};

export type Area = {
  id: string;
  name: string;
  description: string;
  property_id: string;
  image_url: string;
  created_at: string;
  updated_at: string;
  properties?: {
    id: string;
    name: string;
    user_id?: string;
    household_id?: string | null;
  } | null;
};

export type Note = {
  id: string;
  title: string;
  content: string;
  images: string[];
  area_id: string;
  note_source?: 'owner' | 'contractor';
  contractor_user_id?: string | null;
  contractor_area_access_id?: string | null;
  contractor_name?: string | null;
  contractor_company?: string | null;
  created_at: string;
  updated_at: string;
};

export type ContractorAreaAccess = {
  id: string;
  area_id: string;
  owner_user_id: string;
  contractor_user_id: string;
  contractor_email: string;
  contractor_name?: string | null;
  company_name?: string | null;
  trade?: string | null;
  verification_status: 'unverified' | 'verified' | string;
  status: 'active' | 'revoked' | string;
  created_at: string;
  updated_at: string;
  areas?: Area | null;
};

export type PlanStep = {
  title: string;
  description: string;
  tips?: string;
  estimatedMinutes?: number;
};

export type PlanMaterial = {
  name: string;
  estimatedPrice: number;
  notes?: string;
  purchaseUrl?: string;
};

export type PlanProfessionalHelp = {
  type: string;
  when: string;
  averageCost?: string;
};

export type GeneratedPlan = {
  summary: string;
  difficulty: 'easy' | 'moderate' | 'hard' | 'expert';
  estimatedTime: string;
  estimatedCostRange: { min: number; max: number; currency: string };
  steps: PlanStep[];
  materials: PlanMaterial[];
  tools: string[];
  warnings: string[];
  professionalHelp?: PlanProfessionalHelp[];
  checkpoints: string[];
};

export type PlanChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
};

export type Todo = {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  area_id: string;
  created_at: string;
  updated_at: string;
  plan?: GeneratedPlan | null;
  plan_status?: string | null;
  plan_chat?: PlanChatMessage[] | null;
};
