import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useUserStore = create(
  persist(
    (set) => ({
      name: '',
      language: 'uk',
      onboardingComplete: false,
      createdAt: null,
      preferences: {
        weekStartDay: 'monday',
      },

      setName: (name) => set({ name }),
      setLanguage: (language) => set({ language }),

      completeOnboarding: () =>
        set({
          onboardingComplete: true,
          createdAt: Date.now(),
        }),

      updatePreferences: (newPrefs) =>
        set((state) => ({
          preferences: {
            ...state.preferences,
            ...newPrefs,
          },
        })),
    }),
    {
      name: 'mind-diary-user',
    }
  )
);

export default useUserStore;
