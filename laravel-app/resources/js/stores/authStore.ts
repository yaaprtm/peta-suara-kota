import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';
import { authApi } from '../lib/api';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<User>;
  register: (data: { email: string; password: string; name: string; phone?: string; kelurahanId?: string }) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  setUser: (user: User | null) => void;
  loginAsRole: (role: 'WARGA' | 'PETUGAS' | 'SUPERADMIN') => User;
}

// Akun demo hanya untuk tombol 1-klik di halaman login.
// Token yang dibuat di sini (mock-*) tidak akan diterima backend.
export const DEMO_ACCOUNTS: Record<'WARGA' | 'PETUGAS' | 'SUPERADMIN', User> = {
  WARGA: {
    id: 'user-warga-1',
    name: 'Budi Santoso',
    email: 'warga@surabaya.go.id',
    role: 'WARGA',
    kelurahan: { id: 'kel-gubeng', name: 'Gubeng', kecamatan: 'Gubeng', kota: 'Surabaya' },
  },
  PETUGAS: {
    id: 'user-petugas-1',
    name: 'Bambang Trianto',
    email: 'petugas@surabaya.go.id',
    role: 'PETUGAS',
    kelurahan: { id: 'kel-gubeng', name: 'Gubeng', kecamatan: 'Gubeng', kota: 'Surabaya' },
  },
  SUPERADMIN: {
    id: 'user-admin-1',
    name: 'Rendra Prasetya',
    email: 'superadmin@surabaya.go.id',
    role: 'SUPERADMIN',
    kelurahan: { id: 'kel-genteng', name: 'Genteng', kecamatan: 'Genteng', kota: 'Surabaya' },
  },
};

// Satu-satunya tempat token disimpan: localStorage['accessToken'].
// Zustand persist hanya menyimpan 'user' agar UI tetap tampil setelah reload.
// Saat submit laporan, api.ts membaca localStorage['accessToken'] langsung.

function saveToken(token: string): void {
  localStorage.setItem('accessToken', token);
}

function clearToken(): void {
  localStorage.removeItem('accessToken');
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const data = await authApi.login(email, password) as {
            user: User;
            accessToken: string;
          };
          saveToken(data.accessToken);
          set({ user: data.user, accessToken: data.accessToken, isLoading: false });
          return data.user;
        } catch (err) {
          set({ isLoading: false, error: 'Login gagal' });
          throw err;
        }
      },

      loginAsRole: (role) => {
        const demoUser = DEMO_ACCOUNTS[role];
        const mockToken = `mock-token-${role.toLowerCase()}-${Date.now()}`;
        saveToken(mockToken);
        set({ user: demoUser, accessToken: mockToken, isLoading: false, error: null });
        return demoUser;
      },

      register: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const res = await authApi.register(data) as {
            user: User;
            accessToken: string;
          };
          saveToken(res.accessToken);
          set({ user: res.user, accessToken: res.accessToken, isLoading: false });
        } catch (err) {
          set({ isLoading: false, error: 'Registrasi gagal' });
          throw err;
        }
      },

      logout: async () => {
        const { accessToken } = get();
        try {
          if (accessToken && !accessToken.startsWith('mock-token')) {
            await authApi.logout();
          }
        } catch {
          // Abaikan error logout sisi server
        }
        clearToken();
        set({ user: null, accessToken: null });
      },

      clearError: () => set({ error: null }),
      setUser: (user) => set({ user }),
    }),
    {
      name: 'auth-store',
      // Hanya simpan user ke Zustand persist agar nama tampil setelah reload.
      // Token disimpan di localStorage['accessToken'] secara terpisah via saveToken().
      partialize: (state) => ({ user: state.user }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        // Pulihkan accessToken dari localStorage ke state agar komponen
        // yang membaca store.accessToken tetap konsisten.
        const storedToken = localStorage.getItem('accessToken');
        if (storedToken) {
          state.accessToken = storedToken;
        } else if (state.user) {
          // Ada user tapi tidak ada token — state korup, hapus user
          state.user = null;
          state.accessToken = null;
        }
      },
    }
  )
);
