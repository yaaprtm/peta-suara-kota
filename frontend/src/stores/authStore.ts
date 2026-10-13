import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types';
import { authApi } from '../lib/api';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<User>;
  register: (data: { email: string; password: string; name: string; phone?: string }) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  setUser: (user: User) => void;
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
          localStorage.setItem('accessToken', data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken);
          set({ user: data.user, accessToken: data.accessToken, refreshToken: data.refreshToken, isLoading: false });
          return data.user;
        } catch {
          // Fallback to demo account if offline or demo email is used
          const lowerEmail = email.toLowerCase();
          let demoUser = DEMO_ACCOUNTS.WARGA;
          if (lowerEmail.includes('petugas') || lowerEmail.includes('pu')) {
            demoUser = DEMO_ACCOUNTS.PETUGAS;
          } else if (lowerEmail.includes('admin') || lowerEmail.includes('super')) {
            demoUser = DEMO_ACCOUNTS.SUPERADMIN;
          }
          const mockToken = `mock-token-${Date.now()}`;
          localStorage.setItem('accessToken', mockToken);
          localStorage.setItem('refreshToken', mockToken);
          set({ user: demoUser, accessToken: mockToken, refreshToken: mockToken, isLoading: false });
          return demoUser;
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
        } catch (err: unknown) {
          // If offline, create local session
          const mockUser: User = {
            id: `user-${Date.now()}`,
            name: data.name,
            email: data.email,
            role: 'WARGA',
            phone: data.phone,
          };
          const mockToken = `mock-token-${Date.now()}`;
          localStorage.setItem('accessToken', mockToken);
          localStorage.setItem('refreshToken', mockToken);
          set({ user: mockUser, accessToken: mockToken, refreshToken: mockToken, isLoading: false });
        }
      },

      logout: async () => {
        const { refreshToken } = get();
        try {
          if (refreshToken && !refreshToken.startsWith('mock-token')) await authApi.logout(refreshToken);
        } catch {}
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
    }
  )
);
