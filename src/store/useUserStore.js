import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useUserStore = create(
  persist(
    (set) => ({
      name: '',
      language: 'uk',
      onboardingComplete: false,
      onboardingStep: 0,
      createdAt: null,
      preferences: {
        weekStartDay: 'monday',
      },

      setName: (name) => set({ name }),
      setLanguage: (language) => set({ language }),
      setOnboardingStep: (step) => set({ onboardingStep: step }),

      completeOnboarding: () =>
        set({
          onboardingComplete: true,
          onboardingStep: 5,
          createdAt: Date.now(),
        }),

      resetOnboarding: () =>
        set({
          onboardingComplete: false,
          onboardingStep: 0,
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
