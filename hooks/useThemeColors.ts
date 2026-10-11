/**
 * 安全的主题色获取 hook
 *
 * 将 RN 的 useColorScheme 返回值安全收敛为 'light' | 'dark'
 */

import { useColorScheme } from '@/components/useColorScheme';
import Colors, { type ThemeColors } from '@/constants/Colors';

export type ColorScheme = 'light' | 'dark';

/** 获取当前色彩方案（保证仅返回 'light' | 'dark'） */
export function useAppColorScheme(): ColorScheme {
  const scheme = useColorScheme();
  return scheme === 'dark' ? 'dark' : 'light';
}

/** 获取当前主题色彩对象 */
export function useThemeColors(): ThemeColors {
  const scheme = useAppColorScheme();
  return Colors[scheme];
}
