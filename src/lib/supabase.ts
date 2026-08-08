import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createLocalSupabaseClient } from './localdb';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// Mode démo si Supabase n'est pas configuré (pas d'URL/clé réelles)
export const isDemoMode =
  !supabaseUrl ||
  !supabaseAnonKey ||
  supabaseUrl.includes('your-project') ||
  supabaseAnonKey.includes('your-');

// Client Supabase réel, ou backend local (localStorage) en mode démo
export const supabase: SupabaseClient = isDemoMode
  ? (createLocalSupabaseClient() as unknown as SupabaseClient)
  : createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });

// Types
export type User = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  plan: 'starter' | 'pro' | 'business';
  pins_created_this_month: number;
  pinterest_accounts_connected: number;
  created_at: string;
};

export type Pin = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  image_url: string;
  link: string | null;
  board_id: string | null;
  board_name: string | null;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  scheduled_at: string | null;
  published_at: string | null;
  pinterest_pin_id: string | null;
  hashtags: string[];
  alt_text: string | null;
  retry_count: number;
  error_message: string | null;
  created_at: string;
  // Métriques de performance (renseignées après publication)
  impressions?: number;
  saves?: number;
  clicks?: number;
};

export type PinterestAccount = {
  id: string;
  user_id: string;
  pinterest_user_id: string;
  username: string;
  access_token: string;
  refresh_token: string;
  token_expires_at: string;
  boards: PinterestBoard[];
  created_at: string;
};

export type PinterestBoard = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  pin_count: number;
};

// Auth helpers
export async function signUp(email: string, password: string, fullName: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });
  
  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) throw error;
  return data as User;
}

// Pin operations
export async function createPin(pin: Omit<Pin, 'id' | 'created_at' | 'user_id'>, userId: string) {
  const { data, error } = await supabase
    .from('pins')
    .insert([{ ...pin, user_id: userId }])
    .select()
    .single();
  
  if (error) throw error;
  return data as Pin;
}

export async function getUserPins(userId: string, status?: Pin['status']) {
  let query = supabase
    .from('pins')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (status) {
    query = query.eq('status', status);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data as Pin[];
}

export async function updatePin(pinId: string, updates: Partial<Pin>) {
  const { data, error } = await supabase
    .from('pins')
    .update(updates)
    .eq('id', pinId)
    .select()
    .single();
  
  if (error) throw error;
  return data as Pin;
}

export async function deletePin(pinId: string) {
  const { error } = await supabase
    .from('pins')
    .delete()
    .eq('id', pinId);
  
  if (error) throw error;
}

// Pinterest account operations
export async function connectPinterestAccount(account: Omit<PinterestAccount, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('pinterest_accounts')
    .insert([account])
    .select()
    .single();
  
  if (error) throw error;
  return data as PinterestAccount;
}

export async function getUserPinterestAccounts(userId: string) {
  const { data, error } = await supabase
    .from('pinterest_accounts')
    .select('*')
    .eq('user_id', userId);
  
  if (error) throw error;
  return data as PinterestAccount[];
}

export async function updatePinterestAccount(accountId: string, updates: Partial<PinterestAccount>) {
  const { data, error } = await supabase
    .from('pinterest_accounts')
    .update(updates)
    .eq('id', accountId)
    .select()
    .single();
  
  if (error) throw error;
  return data as PinterestAccount;
}

// Subscription operations
export async function getUserSubscription(userId: string) {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

// Analytics
export async function getUserAnalytics(userId: string, startDate: string, endDate: string) {
  const { data, error } = await supabase
    .from('pin_analytics')
    .select('*')
    .eq('user_id', userId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false });
  
  if (error) throw error;
  return data;
}
