import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  Animated,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/components/useColorScheme';

interface SplashScreenAnimationProps {
  onFinish?: () => void;
}

export function SplashScreenAnimation({ onFinish }: SplashScreenAnimationProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [visible, setVisible] = useState(true);
  const [isExited, setIsExited] = useState(false);

  // 动画驱动值（使用 useState 懒初始化以完美适配 React 19 并通过严格渲染检测）
  const [entranceAnim] = useState(() => new Animated.Value(0));
  const [textAnim] = useState(() => new Animated.Value(0));
  const [glowAnim] = useState(() => new Animated.Value(0));
  const [floatAnim] = useState(() => new Animated.Value(0));
  const [exitAnim] = useState(() => new Animated.Value(1));

  // 退出并销毁逻辑
  const triggerExit = useCallback(() => {
    setIsExited((prev) => {
      if (prev) return true;
      Animated.timing(exitAnim, {
        toValue: 0,
        duration: 320,
        useNativeDriver: true,
      }).start(() => {
        setVisible(false);
        onFinish?.();
      });
      return true;
    });
  }, [exitAnim, onFinish]);

  useEffect(() => {
    // 1. 图标弹性出场 (0ms ~ 450ms)
    Animated.spring(entranceAnim, {
      toValue: 1,
      friction: 6.5,
      tension: 45,
      useNativeDriver: true,
    }).start();

    // 2. 品牌字缓慢上浮渐显 (200ms ~ 550ms)
    const textTimer = setTimeout(() => {
      Animated.timing(textAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }).start();
    }, 200);

    // 3. 气韵微动呼吸 (450ms ~ 1100ms)
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -4,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
      ])
    );
    const floatTimer = setTimeout(() => {
      floatLoop.start();
    }, 450);

    // 4. 背景暖光微晕
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // 5. 自动在 1.35s 时触发淡出，总用时控制在 1.67s 左右（严格小于 2s）
    const exitTimer = setTimeout(() => {
      triggerExit();
    }, 1350);

    return () => {
      clearTimeout(textTimer);
      clearTimeout(floatTimer);
      clearTimeout(exitTimer);
      floatLoop.stop();
    };
  }, [entranceAnim, textAnim, floatAnim, glowAnim, triggerExit]);

  if (!visible) return null;

  // 插值计算
  const iconScale = entranceAnim.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [0.72, 1.05, 1],
  });

  const iconTranslateY = entranceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [24, 0],
  });

  const textOpacity = textAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const textTranslateY = textAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [16, 0],
  });

  const glowScale = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 1.1],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [isDark ? 0.2 : 0.45, isDark ? 0.35 : 0.65],
  });

  const screenScale = exitAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1.06, 1],
  });

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        styles.container,
        {
          backgroundColor: isDark ? '#0F0F12' : '#FFFFFF',
          opacity: exitAnim,
          transform: [{ scale: screenScale }],
          zIndex: 99999,
        },
      ]}
      pointerEvents={isExited ? 'none' : 'auto'}
    >
      {/* 允许用户任意点击全屏直接跳过 */}
      <Pressable style={styles.pressArea} onPress={triggerExit}>
        {/* 右上角跳过按钮 */}
        <View style={[styles.skipContainer, { top: Math.max(insets.top, 20) + 8 }]}>
          <View
            style={[
              styles.skipBtn,
              {
                backgroundColor: isDark
                  ? 'rgba(255, 255, 255, 0.12)'
                  : 'rgba(0, 0, 0, 0.05)',
              },
            ]}
          >
            <Text
              style={[
                styles.skipText,
                { color: isDark ? '#A1A1AA' : '#8E8E93' },
              ]}
            >
              跳过
            </Text>
          </View>
        </View>

        {/* 核心居中品牌展示区 */}
        <View style={styles.content}>
          {/* 背后柔和暖光微晕 */}
          <Animated.View
            style={[
              styles.glow,
              {
                backgroundColor: isDark ? '#FF6B35' : '#FF8542',
                opacity: glowOpacity,
                transform: [{ scale: glowScale }],
              },
            ]}
          />

          {/* 锅具与交错箭头图标主体 */}
          <Animated.View
            style={[
              styles.iconWrapper,
              {
                transform: [
                  { scale: iconScale },
                  { translateY: Animated.add(iconTranslateY, floatAnim) },
                ],
              },
            ]}
          >
            <Image
              source={require('@/assets/images/icon.png')}
              style={styles.iconImage}
              resizeMode="contain"
            />
          </Animated.View>

          {/* 品牌名称与副标标语 */}
          <Animated.View
            style={[
              styles.textContainer,
              {
                opacity: textOpacity,
                transform: [{ translateY: textTranslateY }],
              },
            ]}
          >
            <Text
              style={[
                styles.appName,
                { color: isDark ? '#FFFFFF' : '#1C1C1E' },
              ]}
            >
              Fooder
            </Text>
            <View style={styles.sloganRow}>
              <View style={styles.dot} />
              <Text
                style={[
                  styles.appSlogan,
                  { color: isDark ? '#A1A1AA' : '#686873' },
                ]}
              >
                今天吃什么？不再纠结
              </Text>
              <View style={styles.dot} />
            </View>
          </Animated.View>
        </View>

        {/* 底部简约版本标识 */}
        <View style={[styles.footer, { bottom: Math.max(insets.bottom, 16) + 12 }]}>
          <Text style={[styles.footerText, { color: isDark ? '#3F3F46' : '#C7C7CC' }]}>
            美味即刻发生 · 美食决策伴侣
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  pressArea: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipContainer: {
    position: 'absolute',
    right: 20,
    zIndex: 10,
  },
  skipBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  skipText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  iconWrapper: {
    width: 140,
    height: 140,
    borderRadius: 36,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  iconImage: {
    width: 140,
    height: 140,
  },
  textContainer: {
    alignItems: 'center',
    marginTop: 24,
  },
  appName: {
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  sloganRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  dot: {
    width: 3.5,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: '#FF6B35',
    marginHorizontal: 7,
  },
  appSlogan: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  footer: {
    position: 'absolute',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    letterSpacing: 0.8,
    fontWeight: '500',
  },
});
