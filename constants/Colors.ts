/**
 * fooder 主题色彩系统
 *
 * 设计思路：温暖的食物色调，主色为暖橙，搭配中性色板
 */

/** 品牌色 */
export const brand = {
  /** 主色 — 暖橙 */
  primary: '#FF6B35',
  /** 主色浅色变体 */
  primaryLight: '#FF8F5E',
  /** 主色深色变体 */
  primaryDark: '#E55A2B',
  /** 辅助色 — 松绿 */
  secondary: '#2EC4B6',
  /** 辅助色浅色变体 */
  secondaryLight: '#5CDECE',
  /** 点缀色 — 柠黄 */
  accent: '#FFD166',
} as const;

/** 主题色彩接口 */
export interface ThemeColors {
  text: string;
  textSecondary: string;
  textTertiary: string;
  background: string;
  surface: string;
  surfaceSecondary: string;
  border: string;
  borderLight: string;
  tint: string;
  tabIconDefault: string;
  tabIconSelected: string;
  shadow: string;
  danger: string;
  dangerLight: string;
  success: string;
  successLight: string;
}

/** 浅色主题 */
export const light: ThemeColors = {
  text: '#1A1A2E',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  background: '#FAFAFA',
  surface: '#FFFFFF',
  surfaceSecondary: '#F3F4F6',
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  tint: brand.primary,
  tabIconDefault: '#9CA3AF',
  tabIconSelected: brand.primary,
  shadow: 'rgba(0, 0, 0, 0.08)',
  danger: '#EF4444',
  dangerLight: '#FEE2E2',
  success: '#10B981',
  successLight: '#D1FAE5',
};

/** 深色主题 */
export const dark: ThemeColors = {
  text: '#F9FAFB',
  textSecondary: '#9CA3AF',
  textTertiary: '#6B7280',
  background: '#0F0F1A',
  surface: '#1A1A2E',
  surfaceSecondary: '#252540',
  border: '#2D2D44',
  borderLight: '#1F1F35',
  tint: brand.primaryLight,
  tabIconDefault: '#6B7280',
  tabIconSelected: brand.primaryLight,
  shadow: 'rgba(0, 0, 0, 0.3)',
  danger: '#F87171',
  dangerLight: '#451A1A',
  success: '#34D399',
  successLight: '#1A3D2E',
};

const Colors: Record<'light' | 'dark', ThemeColors> = { light, dark };

export default Colors;
