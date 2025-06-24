import { supabase } from './supabaseClient';

export interface QuoteRequest {
  title: string;
  description: string;
  zip: string;
  images: string[];
}

export interface QuoteResponse {
  businesses: any[];
  smsResults: Record<string, unknown>[];
  callResults: Record<string, unknown>[];
  emailResults: Record<string, unknown>[];
  diyEstimate?: string | null;
}

export const requestQuotes = async (
  payload: QuoteRequest,
): Promise<QuoteResponse> => {
  const { data, error } = await supabase.functions.invoke('request-quotes', {
    body: payload,
  });
  if (error) throw error;
  return data;
};
