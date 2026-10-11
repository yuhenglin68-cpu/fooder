import { useSettingsStore } from '@/store/useSettingsStore';

export function useColorScheme() {
  const themeMode = useSettingsStore((s) => s.themeMode);
  if (themeMode === 'dark') return 'dark';
  if (themeMode === 'light') return 'light';

  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
}
