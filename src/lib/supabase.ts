import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for our database tables
export type Property = {
  id: string;
  name: string;
  address: string;
  user_id: string;
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
};

export type Note = {
  id: string;
  title: string;
  content: string;
  images: string[];
  area_id: string;
  created_at: string;
  updated_at: string;
}; 