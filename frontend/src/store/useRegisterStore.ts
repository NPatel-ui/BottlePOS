import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface POSRegister {
  id: string;
  name: string;
  pin: string;
  location?: string;
  deviceType?: string;
  openingFloat?: number;
  status: 'active' | 'maintenance';
  createdAt: string;
}

export interface AddRegisterInput {
  name: string;
  pin: string;
  id?: string;
  location?: string;
  deviceType?: string;
  openingFloat?: number;
}

interface RegisterState {
  registers: POSRegister[];
  unlockedRegisterId: string | null;
  addRegister: (input: AddRegisterInput | string, pin?: string) => POSRegister;
  removeRegister: (id: string) => void;
  unlockRegister: (id: string, pin: string) => boolean;
  lockRegister: () => void;
  fetchRegistersFromSupabase: () => Promise<void>;
}

export const useRegisterStore = create<RegisterState>()(
  persist(
    (set, get) => ({
      registers: [],
      unlockedRegisterId: null,

      addRegister: (input: AddRegisterInput | string, pinArg?: string) => {
        let newRegister: POSRegister;
        if (typeof input === 'string') {
          newRegister = {
            id: `REG-${Math.floor(100 + Math.random() * 900)}`,
            name: input,
            pin: pinArg || '1234',
            location: 'Main Counter',
            deviceType: 'Touchscreen Terminal',
            openingFloat: 200,
            status: 'active',
            createdAt: new Date().toISOString(),
          };
        } else {
          newRegister = {
            id: input.id && input.id.trim() ? input.id.trim() : `REG-${Math.floor(100 + Math.random() * 900)}`,
            name: input.name.trim(),
            pin: input.pin,
            location: input.location || 'Main Counter',
            deviceType: input.deviceType || 'Touchscreen Terminal',
            openingFloat: input.openingFloat ?? 200,
            status: 'active',
            createdAt: new Date().toISOString(),
          };
        }

        set((state) => ({
          registers: [...state.registers, newRegister],
          unlockedRegisterId: null,
        }));

        // Async sync to Supabase if credentials are provided
        if (isSupabaseConfigured() && supabase) {
          supabase
            .from('pos_registers')
            .upsert({
              id: newRegister.id,
              organization_id: 'org_default',
              store_id: 'store_default',
              name: newRegister.name,
              pin: newRegister.pin,
              location: newRegister.location,
              device_type: newRegister.deviceType,
              opening_float: newRegister.openingFloat,
              status: newRegister.status,
            })
            .then(({ error }) => {
              if (error) {
                console.warn('Could not sync register to Supabase:', error.message);
              }
            });
        }

        return newRegister;
      },

      removeRegister: (id: string) => {
        set((state) => ({
          registers: state.registers.filter((r) => r.id !== id),
          unlockedRegisterId: state.unlockedRegisterId === id ? null : state.unlockedRegisterId,
        }));

        if (isSupabaseConfigured() && supabase) {
          supabase.from('pos_registers').delete().eq('id', id).then();
        }
      },

      unlockRegister: (id: string, pin: string) => {
        const register = get().registers.find((r) => r.id === id);
        if (register && register.pin === pin) {
          set({ unlockedRegisterId: id });
          return true;
        }
        return false;
      },

      lockRegister: () => {
        set({ unlockedRegisterId: null });
      },

      fetchRegistersFromSupabase: async () => {
        if (!isSupabaseConfigured() || !supabase) return;
        try {
          const { data, error } = await supabase.from('pos_registers').select('*');
          if (error) {
            console.warn('Could not fetch registers from Supabase:', error.message);
            return;
          }
          if (data && data.length > 0) {
            const mapped: POSRegister[] = data.map((r: any) => ({
              id: r.id,
              name: r.name,
              pin: r.pin,
              location: r.location,
              deviceType: r.device_type,
              openingFloat: Number(r.opening_float || 200),
              status: r.status,
              createdAt: r.created_at,
            }));
            set({ registers: mapped });
          }
        } catch (e) {
          console.warn('Supabase fetch failed:', e);
        }
      },
    }),
    {
      name: 'bottlepos_registers_storage',
      partialize: (state) => ({ registers: state.registers }),
    }
  )
);
