import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';
import { authApi } from '../lib/api';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<User>;
  register: (data: { email: string; password: string; name: string; phone?: string; kelurahanId?: string }) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  setUser: (user: User | null) => void;
  loginAsRole: (role: 'WARGA' | 'PETUGAS' | 'SUPERADMIN') => User;
}

export const DEMO_ACCOUNTS: Record<'WARGA' | 'PETUGAS' | 'SUPERADMIN', User> = {
  WARGA: {
    id: 'user-warga-1',
    name: 'Budi Santoso',
    email: 'warga@surabaya.go.id',
    role: 'WARGA',
    phone: '081234567890',
    kelurahan: { id: 'kel-gubeng', name: 'Gubeng', kecamatan: 'Gubeng', kota: 'Surabaya' },
  },
  PETUGAS: {
    id: 'user-petugas-1',
    name: 'Bambang Trianto (Petugas Command Center)',
    email: 'petugas@surabaya.go.id',
    role: 'PETUGAS',
    phone: '081234567891',
    kelurahan: { id: 'kel-gubeng', name: 'Gubeng', kecamatan: 'Gubeng', kota: 'Surabaya' },
  },
  SUPERADMIN: {
    id: 'user-admin-1',
    name: 'Rendra Prasetya (Superadmin Pemkot)',
    email: 'superadmin@surabaya.go.id',
    role: 'SUPERADMIN',
    phone: '081234567892',
    kelurahan: { id: 'kel-genteng', name: 'Genteng', kecamatan: 'Genteng', kota: 'Surabaya' },
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const data = await authApi.login(email, password) as {
            user: User;
            accessToken: string;
            refreshToken: string;
          };
          // Simpan token di SEMUA tempat secara eksplisit
          localStorage.setItem('accessToken', data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken);
          set({ user: data.user, accessToken: data.accessToken, refreshToken: data.refreshToken, isLoading: false });
          return data.user;
        } catch (err) {
          set({ isLoading: false, error: 'Login gagal' });
          throw err;
        }
      },

      loginAsRole: (role) => {
        const demoUser = DEMO_ACCOUNTS[role];
        const mockToken = `mock-token-${role.toLowerCase()}-${Date.now()}`;
        localStorage.setItem('accessToken', mockToken);
        localStorage.setItem('refreshToken', mockToken);
        set({ user: demoUser, accessToken: mockToken, refreshToken: mockToken, isLoading: false, error: null });
        return demoUser;
      },

      register: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const res = await authApi.register(data) as {
            user: User;
            accessToken: string;
            refreshToken: string;
          };
          localStorage.setItem('accessToken', res.accessToken);
          localStorage.setItem('refreshToken', res.refreshToken);
          set({ user: res.user, accessToken: res.accessToken, refreshToken: res.refreshToken, isLoading: false });
        } catch (err) {
          set({ isLoading: false, error: 'Registrasi gagal' });
          throw err;
        }
      },

      logout: async () => {
        const { accessToken } = get();
        try {
          // FIX: gunakan accessToken (bukan refreshToken) sebagai Bearer untuk logout
          // karena AuthenticateWithToken middleware membaca Bearer token, bukan refreshToken
          if (accessToken && !accessToken.startsWith('mock-token')) await authApi.logout(accessToken);
        } catch {
          // Abaikan error logout — tetap hapus token lokal
        }
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        set({ user: null, accessToken: null, refreshToken: null });
      },

      clearError: () => set({ error: null }),
      setUser: (user) => set({ user }),
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({ user: state.user, accessToken: state.accessToken, refreshToken: state.refreshToken }),
      onRehydrateStorage: () => (state) => {
        // Jika ada user tapi tidak ada token — state korup, hapus user
        if (state?.user && !state?.accessToken) {
          state.user = null;
          state.accessToken = null;
          state.refreshToken = null;
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
        // Sinkronkan token dari Zustand persist ke localStorage key terpisah
        // agar request() di api.ts bisa membacanya
        if (state?.accessToken) {
          localStorage.setItem('accessToken', state.accessToken);
        }
      },
    }
  )
);
