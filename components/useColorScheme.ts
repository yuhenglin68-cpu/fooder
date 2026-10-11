import { useColorScheme as useColorSchemeCore } from 'react-native';
import { useSettingsStore } from '@/store/useSettingsStore';

export const useColorScheme = () => {
  const coreScheme = useColorSchemeCore();
  const themeMode = useSettingsStore((s) => s.themeMode);

  if (themeMode === 'light') return 'light';
  if (themeMode === 'dark') return 'dark';
  return coreScheme === 'dark' ? 'dark' : 'light';
};
