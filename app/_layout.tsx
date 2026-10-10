/**
 * 根路由布局
 *
 * 设计原则：启动直达主页，无任何鉴权/登录拦截
 */

import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import '../global.css';

import { NavigationBar } from 'expo-navigation-bar';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useColorScheme } from '@/components/useColorScheme';
import { getDatabase } from '@/database';
import { ensureImageDirectory } from '@/utils/fileManager';

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

  useEffect(() => {
    try {
      // 1. 初始化数据库（同步，首次调用时自动建表）
      getDatabase();

      // 2. 确保图片沙盒目录存在（同步）
      ensureImageDirectory();
    } catch (e) {
      console.error('[RootLayout] 初始化失败:', e);
    } finally {
      // 3. 隐藏启动屏
      SplashScreen.hideAsync();
    }
  }, []);

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
      <ThemeProvider value={colorScheme === 'dark' ? darkTheme : lightTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="add-dish"
            options={{
              title: '新建菜品',
              headerBackTitle: '返回',
              presentation: 'card',
            }}
          />
        </Stack>
        <StatusBar style="auto" />
        {Platform.OS === 'android' && <NavigationBar style="auto" />}
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
