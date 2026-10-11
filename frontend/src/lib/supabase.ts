import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = (): boolean => {
  return Boolean(supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('https://'));
};

export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Listen for real-time changes to POS Registers across terminals.
 */
export const subscribeToRegisters = (onUpdate: (payload: any) => void) => {
  if (!supabase) return () => {};

  const channel = supabase
    .channel('pos-registers-channel')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'pos_registers' },
      (payload) => {
        onUpdate(payload);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

/**
 * Listen for real-time inventory count adjustments across checkout stations.
 */
export const subscribeToInventory = (onUpdate: (payload: any) => void) => {
  if (!supabase) return () => {};

  const channel = supabase
    .channel('inventory-sync-channel')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'inventory' },
      (payload) => {
        onUpdate(payload);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
