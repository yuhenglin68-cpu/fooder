import { create } from 'zustand';
import { Appearance, Platform } from 'react-native';
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
  // 1. NativeWind 颜色方案设置 (安全调用)
  try {
    if (nwColorScheme && typeof nwColorScheme.set === 'function') {
      nwColorScheme.set(mode === 'auto' ? 'system' : mode);
    }
  } catch {
    // 忽略内部 media/class flag 冲突，防止打断应用运行
  }

  // 2. Web 环境下在 html 根节点同步注入 / 移除 'dark' class
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    try {
      const root = document.documentElement;
      if (mode === 'dark') {
        root.classList.add('dark');
      } else if (mode === 'light') {
        root.classList.remove('dark');
      } else {
        const isSystemDark =
          typeof window !== 'undefined' &&
          window.matchMedia &&
          window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (isSystemDark) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }
    } catch {}
  }

  // 3. React Native 系统 Appearance (仅在平台原生且方法存在时安全调用)
  if (Platform.OS !== 'web' && typeof Appearance?.setColorScheme === 'function') {
    try {
      if (mode === 'light' || mode === 'dark') {
        Appearance.setColorScheme(mode);
      } else {
        Appearance.setColorScheme('unspecified');
      }
    } catch {
      // 部分 Android 版本或 Expo Go 环境可能不支持动态修改系统级 Appearance，安全捕获
    }
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
