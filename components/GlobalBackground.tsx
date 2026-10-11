import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useColorScheme } from '@/components/useColorScheme';

interface GlobalBackgroundProps {
  /** 可选微调遮罩透明度 (0 ~ 1) */
  customMaskOpacity?: number;
  /** 可选覆盖虚化强度 (0 ~ 100) */
  customBlurIntensity?: number;
}

export function GlobalBackground({
  customMaskOpacity,
  customBlurIntensity,
}: GlobalBackgroundProps) {
  const { customBgUri, bgBlurIntensity, bgMaskOpacity } = useSettingsStore();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  if (!customBgUri) {
    return null;
  }

  const effectiveOpacity = customMaskOpacity ?? bgMaskOpacity;
  const effectiveBlur = customBlurIntensity ?? bgBlurIntensity;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* 底层原图壁纸 */}
      <Image
        source={{ uri: customBgUri }}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />

      {/* 半透明遮罩层：根据深浅模式自动叠加黑/白色彩，保障上层文字与卡片最高清晰度 */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: isDark
              ? `rgba(0, 0, 0, ${effectiveOpacity})`
              : `rgba(255, 255, 255, ${effectiveOpacity})`,
          },
        ]}
      />

      {/* 柔和高斯虚化层：打造 iOS 原生级磨砂景深 */}
      {effectiveBlur > 0 && (
        <BlurView
          intensity={effectiveBlur}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
      )}
    </View>
  );
}
