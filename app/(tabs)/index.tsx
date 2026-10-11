import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Image,
  Modal,
  Alert,
} from 'react-native';
import { Tabs, router, useFocusEffect } from 'expo-router';
import { X, CalendarPlus } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useDishStore } from '@/store/useDishStore';
import { useLogStore } from '@/store/useLogStore';
import type { Dish, MealType } from '@/database/types';
import { GlobalBackground } from '@/components/GlobalBackground';

const MEAL_TYPES: MealType[] = ['早餐', '饮品', '肉类', '素类', '汤类', '其它'];

export default function TodayScreen() {
  const insets = useSafeAreaInsets();

  const { pickRandomByMealType, totalCount, refreshCount } = useDishStore();
  const { addLog } = useLogStore();

  const [drawnDishes, setDrawnDishes] = useState<Record<string, Dish>>({});
  const [selectedItem, setSelectedItem] = useState<{ dish: Dish; mealType: string } | null>(null);

  useFocusEffect(
    useCallback(() => {
      refreshCount();
    }, [refreshCount])
  );

  const handleDraw = (mealType: MealType) => {
    if (totalCount === 0) {
      router.push('/add-dish');
      return;
    }
    const dishes = pickRandomByMealType(mealType, 1);
    if (dishes.length > 0) {
      setDrawnDishes((prev) => ({ ...prev, [mealType]: dishes[0] }));
    } else {
      Alert.alert('提示', '菜谱库中没有任何菜品');
    }
  };

  const handleAddToMenu = (isTomorrow: boolean) => {
    if (!selectedItem) return;
    
    const targetDate = new Date();
    if (isTomorrow) {
      targetDate.setDate(targetDate.getDate() + 1);
    }
    const dateString = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`;
    
    addLog({
      dateString,
      dishId: selectedItem.dish.id,
      mealType: selectedItem.mealType,
    });
    
    const targetName = isTomorrow ? '明日' : '今日';
    setSelectedItem(null);
    Alert.alert('已添加', `【${selectedItem.dish.name}】已成功加入${targetName}菜单！`);
  };

  return (
    <View className="flex-1 bg-[#F2F2F7] dark:bg-[#000000]">
      <GlobalBackground />
      <Tabs.Screen options={{ headerTitle: 'Fooder', tabBarLabel: '抽签' }} />
      
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: insets.top + 20,
          paddingBottom: 120,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* 顶部标题区 */}
        <View className="mb-6">
          <Text className="text-[34px] font-extrabold text-neutral-900 dark:text-white tracking-tight">
            今天吃什么
          </Text>
          <Text className="text-[15px] font-medium text-neutral-500 dark:text-neutral-400 mt-2">
            点击任意区域抽取你的专属灵感
          </Text>
        </View>

        {/* 6个独立抽签区域：2列3行 */}
        <View className="flex-row flex-wrap justify-between">
          {MEAL_TYPES.map((meal) => {
            const dish = drawnDishes[meal];
            return (
              <Pressable
                key={meal}
                onPress={() => {
                  if (dish) {
                    setSelectedItem({ dish, mealType: meal });
                  } else {
                    handleDraw(meal);
                  }
                }}
                className="w-[48%] h-36 rounded-[24px] mb-4 overflow-hidden bg-white dark:bg-[#1C1C1E] border border-black/[0.04] dark:border-white/[0.06] justify-center items-center active:scale-[0.98]"
                style={{
                  shadowColor: '#000000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.05,
                  shadowRadius: 12,
                  elevation: 2,
                }}
              >
                {dish ? (
                  <>
                    {dish.imageUri ? (
                      <Image source={{ uri: dish.imageUri }} className="absolute w-full h-full" resizeMode="cover" />
                    ) : (
                      <View className="absolute w-full h-full bg-neutral-200 dark:bg-neutral-800" />
                    )}
                    {/* 半透明遮罩让文字更清晰 */}
                    <View className="absolute w-full h-full bg-black/40" />
                    <View className="px-3">
                      <Text className="text-white font-extrabold text-[20px] text-center" numberOfLines={2}>
                        {dish.name}
                      </Text>
                      <Text className="text-white/80 text-[12px] text-center mt-1 font-bold">
                        {meal}
                      </Text>
                    </View>
                  </>
                ) : (
                  <>
                    <Text className="text-[20px] font-extrabold text-neutral-900 dark:text-white">
                      {meal}
                    </Text>
                    <Text className="text-[13px] text-neutral-400 dark:text-neutral-500 mt-1">
                      点击抽签
                    </Text>
                  </>
                )}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* 菜品详情悬浮卡片 Modal */}
      <Modal
        visible={!!selectedItem}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedItem(null)}
      >
        <View className="flex-1 bg-black/40 justify-center items-center px-5">
          <View className="w-full bg-[#F2F2F7] dark:bg-[#000000] rounded-[32px] overflow-hidden max-h-[85%] border border-white/10">
            {/* 卡片顶部图片 */}
            <View className="w-full h-56 relative bg-neutral-200 dark:bg-neutral-800">
              {selectedItem?.dish.imageUri && (
                <Image
                  source={{ uri: selectedItem.dish.imageUri }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              )}
              {/* 关闭按钮 */}
              <Pressable
                onPress={() => setSelectedItem(null)}
                className="absolute top-4 right-4 w-10 h-10 bg-black/50 rounded-full items-center justify-center active:scale-95 z-10"
              >
                <X size={20} color="#FFFFFF" strokeWidth={2.5} />
              </Pressable>
            </View>

            {/* 内容区 */}
            <ScrollView className="p-6" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              <Text className="text-[28px] font-black text-neutral-900 dark:text-white tracking-tight mb-2">
                {selectedItem?.dish.name}
              </Text>
              
              <Text className="text-[15px] font-bold text-[#FF6B35] mb-6">
                {selectedItem?.dish.category} · {selectedItem?.mealType}
              </Text>

              {/* 食材清单 */}
              {selectedItem?.dish.ingredients && selectedItem.dish.ingredients.length > 0 && (
                <View className="mb-6">
                  <Text className="text-[17px] font-bold text-neutral-900 dark:text-white mb-3">食材清单</Text>
                  {selectedItem.dish.ingredients.map((ing, idx) => (
                    <View key={idx} className="flex-row justify-between mb-2 pb-2 border-b border-black/5 dark:border-white/5">
                      <Text className="text-[15px] text-neutral-700 dark:text-neutral-300 font-medium">{ing.name}</Text>
                      <Text className="text-[15px] text-neutral-500 dark:text-neutral-400">{ing.amount}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* 烹饪步骤 */}
              {selectedItem?.dish.steps ? (
                <View className="mb-2">
                  <Text className="text-[17px] font-bold text-neutral-900 dark:text-white mb-3">烹饪步骤</Text>
                  <Text className="text-[15px] text-neutral-700 dark:text-neutral-300 leading-[24px]">
                    {selectedItem.dish.steps}
                  </Text>
                </View>
              ) : null}
            </ScrollView>

            {/* 底部功能栏 */}
            <View className="p-4 border-t border-black/[0.05] dark:border-white/[0.05]">
              <View className="flex-row items-center gap-2.5">
                <Pressable
                  onPress={() => handleAddToMenu(false)}
                  className="flex-1 h-[52px] bg-[#FF6B35] rounded-[16px] items-center justify-center flex-row active:scale-[0.98] px-2"
                >
                  <CalendarPlus size={18} color="#FFFFFF" strokeWidth={2.5} />
                  <Text numberOfLines={1} adjustsFontSizeToFit className="text-[15px] font-bold text-white ml-1.5">
                    添加到今日菜单
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => handleAddToMenu(true)}
                  className="flex-1 h-[52px] bg-[#FF8542] rounded-[16px] items-center justify-center flex-row active:scale-[0.98] px-2"
                >
                  <CalendarPlus size={18} color="#FFFFFF" strokeWidth={2.5} />
                  <Text numberOfLines={1} adjustsFontSizeToFit className="text-[15px] font-bold text-white ml-1.5">
                    添加到明日菜单
                  </Text>
                </Pressable>
              </View>
              <Pressable
                onPress={() => {
                  if (selectedItem) {
                    handleDraw(selectedItem.mealType as MealType);
                    setSelectedItem(null);
                  }
                }}
                className="w-full h-[44px] mt-2 items-center justify-center active:opacity-70"
              >
                <Text className="text-[15px] font-medium text-neutral-500">重新抽取此项</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
