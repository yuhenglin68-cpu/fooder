/**
 * 「今天吃啥」—— 随机抽签 / 灵感决策页
 *
 * Apple HIG 极简大字设计原则：
 * 1. 顶部留白：结合 insets.top 提供沉浸式呼吸感
 * 2. 圆角与比例：卡片 rounded-[32px] 创造柔软亲和的点击边界
 * 3. 字体层次：超大加粗标题 (font-extrabold)，次级说明文弱化
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Animated,
  ScrollView,
  Image,
} from 'react-native';
import { router, useFocusEffect, Tabs } from 'expo-router';
import { Dices, ChefHat, RefreshCw, Plus } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useDishStore } from '@/store/useDishStore';
import type { Dish } from '@/database/types';

export default function TodayScreen() {
  const insets = useSafeAreaInsets();
  const { pickRandom, totalCount, refreshCount } = useDishStore();

  const [pickedDish, setPickedDish] = useState<Dish | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const spinValue = useState(new Animated.Value(0))[0];

  useFocusEffect(
    useCallback(() => {
      refreshCount();
    }, [refreshCount])
  );

  const handleAction = useCallback(() => {
    if (totalCount === 0) {
      router.push('/add-dish');
      return;
    }

    setIsSpinning(true);
    spinValue.setValue(0);
    Animated.timing(spinValue, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      const [dish] = pickRandom(1);
      setPickedDish(dish ?? null);
      setIsSpinning(false);
    });
  }, [totalCount, pickRandom, spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '1080deg'],
  });

  return (
    <ScrollView
      className="flex-1 bg-[#F2F2F7] dark:bg-[#000000]"
      contentContainerStyle={{
        flexGrow: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingTop: insets.top,
        paddingBottom: 120, // 避开底部 BlurView
      }}
      showsVerticalScrollIndicator={false}
      bounces={false}
    >
      <Tabs.Screen options={{ headerTitle: 'Fooder', tabBarLabel: '抽签' }} />

      {/* 顶部指示区 */}
      <View className="items-center mb-8 mt-10">
        <View className="w-24 h-24 rounded-[32px] items-center justify-center mb-4 overflow-hidden border border-black/[0.05] dark:border-white/[0.1]">
          <Image source={require('@/assets/images/icon.jpg')} className="w-full h-full" resizeMode="cover" />
        </View>
        <Text className="text-[34px] font-extrabold text-neutral-900 dark:text-white tracking-tight">
          今天吃什么
        </Text>
        <Text className="text-[15px] font-medium text-neutral-500 dark:text-neutral-400 mt-2">
          {totalCount > 0 ? `菜谱库共收录 ${totalCount} 道好菜` : '菜谱库暂无菜品'}
        </Text>
      </View>

      {/* 核心抽签结果卡片 */}
      <View
        className="w-full min-h-[220px] rounded-[32px] p-8 bg-white dark:bg-[#1C1C1E] border border-black/[0.04] dark:border-white/[0.06] items-center justify-center mb-8"
        style={{
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.04,
          shadowRadius: 24,
          elevation: 2,
        }}
      >
        {pickedDish ? (
          <View className="items-center">
            <View className="bg-orange-50 dark:bg-[#2C1A14] px-3.5 py-1.5 rounded-full mb-3">
              <Text className="text-[13px] font-bold text-[#FF6B35]">
                {pickedDish.category}
              </Text>
            </View>
            <Text className="text-[32px] font-black text-neutral-900 dark:text-white text-center tracking-tight mb-3">
              {pickedDish.name}
            </Text>
            {pickedDish.tags.length > 0 && (
              <View className="flex-row flex-wrap justify-center gap-2 mt-2">
                {pickedDish.tags.map((tag, i) => (
                  <View
                    key={i}
                    className="bg-[#F2F2F7] dark:bg-[#2C2C2E] px-3 py-1 rounded-lg"
                  >
                    <Text className="text-[13px] font-medium text-neutral-600 dark:text-neutral-300">
                      {tag}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ) : (
          <View className="items-center opacity-60">
            <Dices size={48} color="#8E8E93" strokeWidth={1.2} />
            <Text className="text-[15px] font-medium text-neutral-500 mt-4 text-center">
              {totalCount > 0 ? '点击下方按钮\n抽取今日灵感' : '快去添加你的第一道拿手菜吧'}
            </Text>
          </View>
        )}
      </View>

      {/* 功能性主按钮 */}
      <Pressable
        onPress={handleAction}
        disabled={isSpinning}
        className="w-full h-16 rounded-[22px] bg-[#FF6B35] flex-row items-center justify-center active:scale-[0.98]"
        style={{
          shadowColor: '#FF6B35',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.3,
          shadowRadius: 16,
          elevation: 4,
        }}
      >
        {totalCount === 0 ? (
          <>
            <Plus size={20} color="#FFFFFF" strokeWidth={2.5} />
            <Text className="text-white font-bold text-[17px] ml-2">去添加菜品</Text>
          </>
        ) : (
          <>
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <RefreshCw size={20} color="#FFFFFF" strokeWidth={2.2} />
            </Animated.View>
            <Text className="text-white font-bold text-[17px] ml-2.5">
              {isSpinning ? '抽取中...' : pickedDish ? '换一个' : '开始抽签'}
            </Text>
          </>
        )}
      </Pressable>
    </ScrollView>
  );
}
