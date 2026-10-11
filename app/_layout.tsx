/**
 * 根路由布局
 *
 * 设计原则：启动直达主页，无任何鉴权/登录拦截
 */

import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import '../global.css';

import { setStyle as setNavigationBarStyle } from 'expo-navigation-bar';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useColorScheme } from '@/components/useColorScheme';
import { getDatabase } from '@/database';
import { ensureImageDirectory } from '@/utils/fileManager';
import { useSettingsStore } from '@/store/useSettingsStore';
import { SplashScreenAnimation } from '@/components/SplashScreenAnimation';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before initialization completes.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const hasCustomBg = !!useSettingsStore((s) => s.customBgUri);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    try {
      // 1. 初始化数据库（同步，首次调用时自动建表）
      getDatabase();

      // 2. 确保图片沙盒目录存在（同步）
      ensureImageDirectory();

      // 3. 加载并应用外观设置与自定义背景
      useSettingsStore.getState().loadSettings();
    } catch (e) {
      console.error('[RootLayout] 初始化失败:', e);
    } finally {
      // 4. 隐藏启动屏
      SplashScreen.hideAsync();
    }
  }, []);

  // 同步 Android 虚拟导航键前景色（深浅自适应，纯容错）
  useEffect(() => {
    if (Platform.OS === 'android') {
      try {
        setNavigationBarStyle(isDark ? 'light' : 'dark');
      } catch {}
    }
  }, [isDark]);

  // 自定义导航主题色
  const lightTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: '#FAFAFA',
      card: '#FFFFFF',
      primary: '#FF6B35',
    },
  };

  const darkTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: '#0F0F1A',
      card: '#1A1A2E',
      primary: '#FF8F5E',
    },
  };

  return (
    <SafeAreaProvider>
      <ThemeProvider value={isDark ? darkTheme : lightTheme}>
        <Stack
          screenOptions={{
            contentStyle: {
              backgroundColor: hasCustomBg
                ? 'transparent'
                : isDark
                  ? '#000000'
                  : '#F2F2F7',
            },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="add-dish"
            options={{
              title: '新建菜谱',
              headerBackTitle: '返回',
              presentation: 'card',
              headerStyle: {
                backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
              },
              headerTintColor: isDark ? '#FFFFFF' : '#1A1A2E',
            }}
          />
          <Stack.Screen
            name="edit-dish"
            options={{
              title: '编辑菜谱',
              headerBackTitle: '返回',
              presentation: 'card',
              headerStyle: {
                backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
              },
              headerTintColor: isDark ? '#FFFFFF' : '#1A1A2E',
            }}
          />
        </Stack>
        <StatusBar style={isDark ? 'light' : 'dark'} />
      </ThemeProvider>
      {showSplash && (
        <SplashScreenAnimation onFinish={() => setShowSplash(false)} />
      )}
    </SafeAreaProvider>
  );
}
