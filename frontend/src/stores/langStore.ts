import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Language = 'ID' | 'EN';

interface LangState {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
}

export const useLangStore = create<LangState>()(
  persist(
    (set, get) => ({
      lang: 'ID',
      setLang: (lang) => set({ lang }),
      toggleLang: () => set({ lang: get().lang === 'ID' ? 'EN' : 'ID' }),
    }),
    {
      name: 'app-language',
    }
  )
);
