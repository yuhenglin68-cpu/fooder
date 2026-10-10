/**
 * 底部标签栏布局
 *
 * 核心优化：
 * 1. 深度适配 Android 三大金刚键与全面屏手势栏，结合 useSafeAreaInsets 动态避让遮挡
 * 2. 避免固定 height 导致系统导航键遮挡文字和图标
 * 3. 支持键盘弹出时自动隐藏底部栏 (tabBarHideOnKeyboard)
 * 4. 三个核心标签页：今天吃啥 · 菜谱库 · 设置
 */

import { Tabs } from 'expo-router';
import { BookOpen, Dices, Settings } from 'lucide-react-native';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useThemeColors } from '@/hooks/useThemeColors';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();

  // 动态避开系统虚拟导航键（安卓三大金刚键、手势横条、iOS Home Indicator）
  // 1. 当系统具有虚拟金刚键或手势指示条时（insets.bottom > 0）：
  //    - 安卓三大金刚键高度通常为 48dp，手势横条为 16~24dp，iOS 为 34dp
  //    - 底部 padding 设为 insets.bottom + 呼吸间距（安卓虚拟键 + 6dp，iOS + 2dp）
  // 2. 当无虚拟按键或已由系统排版分离时（insets.bottom === 0）：
  //    - 提供默认舒适的底边距（Android 10dp，iOS 8dp）
  const bottomPadding =
    insets.bottom > 0
      ? insets.bottom + (Platform.OS === 'android' ? 6 : 2)
      : Platform.OS === 'android'
        ? 10
        : 8;

  // 标签栏核心内容区高度（图标 24 + 图标文字间距 4 + 文本 14 + 顶部间距 6 = 约 48dp）
  const contentHeight = 50;
  const tabHeight = contentHeight + bottomPadding;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tint,
        tabBarInactiveTintColor: colors.tabIconDefault,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
          height: tabHeight,
          paddingBottom: bottomPadding,
          paddingTop: 6,
          elevation: 8,
        },
        tabBarItemStyle: {
          height: contentHeight,
        },
        tabBarLabelPosition: 'below-icon',
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '今天吃啥',
          tabBarIcon: ({ color, size }) => (
            <Dices size={size} color={color} strokeWidth={1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="dishes"
        options={{
          title: '菜谱库',
          tabBarIcon: ({ color, size }) => (
            <BookOpen size={size} color={color} strokeWidth={1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: '设置',
          tabBarIcon: ({ color, size }) => (
            <Settings size={size} color={color} strokeWidth={1.8} />
          ),
        }}
      />
    </Tabs>
  );
}
