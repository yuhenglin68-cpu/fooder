import { create } from 'zustand';
import { Appearance } from 'react-native';
import { colorScheme as nwColorScheme } from 'nativewind';
import { getSetting, setSetting } from '@/database';
import { deleteImageFromSandbox } from '@/utils/fileManager';

export type ThemeMode = 'light' | 'dark' | 'auto';

interface SettingsState {
  themeMode: ThemeMode;
  customBgUri: string | null;
  bgBlurIntensity: number;
  bgMaskOpacity: number;
  isLoaded: boolean;

  loadSettings: () => void;
  setThemeMode: (mode: ThemeMode) => void;
  setCustomBackground: (uri: string | null) => void;
  setBgBlurIntensity: (intensity: number) => void;
  setBgMaskOpacity: (opacity: number) => void;
}

/** 同步应用外观主题至 NativeWind 与系统 Appearance */
export function applyThemeMode(mode: ThemeMode) {
  try {
    if (mode === 'light') {
      nwColorScheme.set('light');
      Appearance.setColorScheme('light');
    } else if (mode === 'dark') {
      nwColorScheme.set('dark');
      Appearance.setColorScheme('dark');
    } else {
      nwColorScheme.set('system');
      Appearance.setColorScheme('unspecified');
    }
  } catch (error) {
    console.warn('[useSettingsStore] applyThemeMode failed:', error);
  }
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  themeMode: 'auto',
  customBgUri: null,
  bgBlurIntensity: 25,
  bgMaskOpacity: 0.35,
  isLoaded: false,

  loadSettings: () => {
    try {
      const savedTheme = (getSetting('theme_mode', 'auto') as ThemeMode) || 'auto';
      const savedBgUri = getSetting('custom_bg_uri', '') || null;
      const savedBlur = parseInt(getSetting('bg_blur_intensity', '25'), 10);
      const savedOpacity = parseFloat(getSetting('bg_mask_opacity', '0.35'));

      applyThemeMode(savedTheme);

      set({
        themeMode: savedTheme,
        customBgUri: savedBgUri,
        bgBlurIntensity: isNaN(savedBlur) ? 25 : savedBlur,
        bgMaskOpacity: isNaN(savedOpacity) ? 0.35 : savedOpacity,
        isLoaded: true,
      });
    } catch (e) {
      console.error('[useSettingsStore] 加载设置失败:', e);
      set({ isLoaded: true });
    }
  },

  setThemeMode: (mode: ThemeMode) => {
    try {
      setSetting('theme_mode', mode);
      applyThemeMode(mode);
      set({ themeMode: mode });
    } catch (e) {
      console.error('[useSettingsStore] 保存主题模式失败:', e);
    }
  },

  setCustomBackground: (newUri: string | null) => {
    try {
      const currentUri = get().customBgUri;
      // 如果之前有自定义背景且更换/清除，删除旧的沙盒文件以释放存储空间
      if (currentUri && currentUri !== newUri) {
        deleteImageFromSandbox(currentUri);
      }

      setSetting('custom_bg_uri', newUri ?? '');
      set({ customBgUri: newUri });
    } catch (e) {
      console.error('[useSettingsStore] 保存背景图片失败:', e);
    }
  },

  setBgBlurIntensity: (intensity: number) => {
    try {
      setSetting('bg_blur_intensity', String(intensity));
      set({ bgBlurIntensity: intensity });
    } catch (e) {
      console.error('[useSettingsStore] 保存背景虚化参数失败:', e);
    }
  },

  setBgMaskOpacity: (opacity: number) => {
    try {
      setSetting('bg_mask_opacity', String(opacity));
      set({ bgMaskOpacity: opacity });
    } catch (e) {
      console.error('[useSettingsStore] 保存背景遮罩参数失败:', e);
    }
  },
}));
