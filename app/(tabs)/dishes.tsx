/**
 * 「菜谱库」—— 菜品列表 / 检索页
 *
 * Apple HIG 极简大字设计原则：
 * 1. 沉浸式标题：使用 insets.top 并呈现超大加粗标题
 * 2. 搜索栏与分类：苹果风圆角搜索框 (rounded-xl)
 * 3. 悬浮 FAB：使用绝对定位，计算 `bottom: insets.bottom + 68` 完美悬停在 BlurView TabBar 之上
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  Image,
  TextInput,
  Alert,
  Platform,
  ScrollView,
  Modal,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Search,
  X,
  Trash2,
  BookOpen,
  Plus,
  Share,
} from 'lucide-react-native';

import { useDishStore } from '@/store/useDishStore';
import { DISH_CATEGORIES, type Dish } from '@/database/types';
import { exportDishes } from '@/utils/syncManager';
import { GlobalBackground } from '@/components/GlobalBackground';

export default function DishesScreen() {
  const insets = useSafeAreaInsets();
  const {
    dishes,
    activeCategory,
    isLoading,
    loadDishes,
    removeDish,
    search,
    setCategory,
  } = useDishStore();

  const [localSearch, setLocalSearch] = useState('');
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadDishes();
    }, [loadDishes])
  );

  const handleSearchChange = useCallback(
    (text: string) => {
      setLocalSearch(text);
      search(text);
    },
    [search]
  );

  const handleDelete = useCallback(
    (dish: Dish) => {
      Alert.alert('删除菜品', `确定要从菜谱库中移除「${dish.name}」吗？`, [
        { text: '取消', style: 'cancel' },
        {
          text: '确定删除',
          style: 'destructive',
          onPress: () => removeDish(dish.id!),
        },
      ]);
    },
    [removeDish]
  );

  const handleShare = useCallback(
    (dish: Dish) => {
      exportDishes([dish]);
    },
    []
  );

  // 渲染单个菜品卡片
  const renderItem = useCallback(
    ({ item }: { item: Dish }) => (
      <Pressable
        onPress={() => setSelectedDish(item)}
        className="w-full flex-row bg-white dark:bg-[#1C1C1E] rounded-[24px] overflow-hidden mb-4 border border-black/[0.04] dark:border-white/[0.06] active:scale-[0.98] transition-transform"
        style={{
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.03,
          shadowRadius: 12,
          elevation: 1,
        }}
      >
        {/* 左侧照片 */}
        <View className="w-[120px] h-[120px] bg-neutral-100 dark:bg-neutral-800">
          {item.imageUri ? (
            <Image source={{ uri: item.imageUri }} className="w-full h-full" resizeMode="cover" />
          ) : (
            <View className="flex-1 items-center justify-center">
              <BookOpen size={24} color="#C7C7CC" />
            </View>
          )}
        </View>

        {/* 右侧信息 */}
        <View className="flex-1 p-4 justify-between">
          <View>
            <View className="flex-row justify-between items-start mb-1.5">
              <Text className="flex-1 text-[19px] font-black text-neutral-900 dark:text-white mr-2 tracking-tight" numberOfLines={1}>
                {item.name}
              </Text>
              {item.price !== null && (
                <Text className="text-[15px] font-extrabold text-[#FF6B35]">
                  ¥{item.price}
                </Text>
              )}
            </View>
            <Text className="text-[13px] font-medium text-neutral-500 mb-2">
              {item.category}
            </Text>
            {item.tags.length > 0 && (
              <View className="flex-row flex-wrap gap-1.5 h-[24px] overflow-hidden">
                {item.tags.slice(0, 3).map((tag, idx) => (
                  <View key={idx} className="bg-[#F2F2F7] dark:bg-[#2C2C2E] px-2 py-0.5 rounded-md">
                    <Text className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
                      {tag}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* 底部操作区 */}
          <View className="flex-row justify-end mt-2 gap-2">
            <Pressable
              onPress={() => handleShare(item)}
              className="w-8 h-8 items-center justify-center rounded-full active:bg-neutral-100 dark:active:bg-neutral-800"
              hitSlop={8}
            >
              <Share size={16} color="#007AFF" strokeWidth={2} />
            </Pressable>
            <Pressable
              onPress={() => handleDelete(item)}
              className="w-8 h-8 items-center justify-center rounded-full active:bg-neutral-100 dark:active:bg-neutral-800"
              hitSlop={8}
            >
              <Trash2 size={16} color="#FF3B30" strokeWidth={2} />
            </Pressable>
          </View>
        </View>
      </Pressable>
    ),
    [handleDelete, handleShare]
  );

  return (
    <View className="flex-1 bg-[#F2F2F7] dark:bg-[#000000]">
      <GlobalBackground />
      {/* 沉浸式顶部区域 (Header) */}
      <View
        style={{
          paddingTop: insets.top + 20,
          paddingHorizontal: 20,
          paddingBottom: 16,
        }}
      >
        <Text className="text-[34px] font-extrabold text-neutral-900 dark:text-white tracking-tight mb-5">
          菜谱库
        </Text>

        {/* 苹果风搜索框 */}
        <View className="flex-row items-center bg-black/[0.05] dark:bg-white/[0.08] rounded-xl px-3 py-2.5 mb-4">
          <Search size={18} color="#8E8E93" strokeWidth={2.2} />
          <TextInput
            className="flex-1 ml-2 text-[17px] text-neutral-900 dark:text-white p-0"
            placeholder="搜索菜名、标签或食材"
            placeholderTextColor="#8E8E93"
            value={localSearch}
            onChangeText={handleSearchChange}
            autoCorrect={false}
          />
          {localSearch.length > 0 && (
            <Pressable onPress={() => handleSearchChange('')} hitSlop={8}>
              <View className="bg-neutral-300 dark:bg-neutral-600 rounded-full p-1">
                <X size={12} color="#FFFFFF" strokeWidth={3} />
              </View>
            </Pressable>
          )}
        </View>

        {/* 分类过滤器 */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          <Pressable
            onPress={() => setCategory(null)}
            className={`px-4 py-2 rounded-full border ${
              activeCategory === null
                ? 'bg-[#FF6B35] border-[#FF6B35]'
                : 'bg-white dark:bg-[#1C1C1E] border-black/[0.04] dark:border-white/[0.06]'
            }`}
          >
            <Text
              className={`text-[13px] font-bold ${
                activeCategory === null ? 'text-white' : 'text-neutral-600 dark:text-neutral-400'
              }`}
            >
              全部
            </Text>
          </Pressable>
          {DISH_CATEGORIES.map((cat) => {
            const isSelected = activeCategory === cat;
            return (
              <Pressable
                key={cat}
                onPress={() => setCategory(cat)}
                className={`px-4 py-2 rounded-full border ${
                  isSelected
                    ? 'bg-[#FF6B35] border-[#FF6B35]'
                    : 'bg-white dark:bg-[#1C1C1E] border-black/[0.04] dark:border-white/[0.06]'
                }`}
              >
                <Text
                  className={`text-[13px] font-bold ${
                    isSelected ? 'text-white' : 'text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  {cat}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* 列表区 */}
      <FlatList
        data={dishes}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        renderItem={renderItem}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 120, // 为底部 TabBar 与悬浮按钮留出足够空间
        }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !isLoading ? (
            <View className="items-center justify-center mt-20 opacity-50">
              <BookOpen size={48} color="#8E8E93" strokeWidth={1} />
              <Text className="text-[15px] font-medium text-neutral-500 mt-4">
                {localSearch ? '没有找到相关菜品' : '还没有添加任何菜品'}
              </Text>
            </View>
          ) : null
        }
      />

      {/* 悬浮添加按钮 (FAB) - 精确悬停于 BlurView TabBar 之上 */}
      <Pressable
        onPress={() => router.push('/add-dish')}
        className="absolute right-6 rounded-[22px] bg-[#FF6B35] w-14 h-14 items-center justify-center active:scale-[0.95]"
        style={{
          bottom: Math.max(insets.bottom, Platform.OS === 'android' ? 16 : 12) + 68,
          shadowColor: '#FF6B35',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.3,
          shadowRadius: 16,
          elevation: 5,
        }}
      >
        <Plus size={24} color="#FFFFFF" strokeWidth={3} />
      </Pressable>

      {/* 菜品详情悬浮窗 */}
      <Modal
        visible={!!selectedDish}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedDish(null)}
      >
        <View className="flex-1 bg-black/60 justify-center items-center px-4">
          <View className="w-full max-h-[85%] bg-[#F2F2F7] dark:bg-[#1C1C1E] rounded-[32px] overflow-hidden">
            {/* 顶部图片 */}
            <View className="w-full h-56 bg-neutral-200 dark:bg-neutral-800">
              {selectedDish?.imageUri ? (
                <Image source={{ uri: selectedDish.imageUri }} className="w-full h-full" resizeMode="cover" />
              ) : (
                <View className="flex-1 items-center justify-center">
                  <BookOpen size={48} color="#C7C7CC" />
                </View>
              )}
              {/* 关闭按钮 (右上角) */}
              <Pressable
                onPress={() => setSelectedDish(null)}
                className="absolute top-4 right-4 w-10 h-10 bg-black/50 rounded-full items-center justify-center active:scale-95"
              >
                <X size={20} color="#FFFFFF" strokeWidth={2.5} />
              </Pressable>
            </View>

            {/* 内容区 */}
            <ScrollView className="p-6" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              <Text className="text-[28px] font-black text-neutral-900 dark:text-white tracking-tight mb-2">
                {selectedDish?.name}
              </Text>
              
              <Text className="text-[15px] font-bold text-[#FF6B35] mb-6">
                {selectedDish?.category}
              </Text>

              {/* 食材清单 */}
              {selectedDish?.ingredients && selectedDish.ingredients.length > 0 && (
                <View className="mb-6">
                  <Text className="text-[17px] font-bold text-neutral-900 dark:text-white mb-3">食材清单</Text>
                  {selectedDish.ingredients.map((ing, idx) => (
                    <View key={idx} className="flex-row justify-between mb-2 pb-2 border-b border-black/5 dark:border-white/5">
                      <Text className="text-[15px] text-neutral-700 dark:text-neutral-300 font-medium">{ing.name}</Text>
                      <Text className="text-[15px] text-neutral-500 dark:text-neutral-400">{ing.amount}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* 烹饪步骤 */}
              {selectedDish?.steps ? (
                <View className="mb-2">
                  <Text className="text-[17px] font-bold text-neutral-900 dark:text-white mb-3">烹饪步骤</Text>
                  <Text className="text-[15px] text-neutral-700 dark:text-neutral-300 leading-[24px]">
                    {selectedDish.steps}
                  </Text>
                </View>
              ) : null}
            </ScrollView>

            {/* 底部编辑按钮 */}
            <View className="p-4 border-t border-black/[0.05] dark:border-white/[0.05] flex-row justify-end">
              <Pressable
                onPress={() => {
                  const id = selectedDish?.id;
                  setSelectedDish(null);
                  if (id) router.push(`/edit-dish?id=${id}`);
                }}
                className="px-6 h-[44px] bg-neutral-900 dark:bg-white rounded-[14px] items-center justify-center flex-row active:scale-[0.98]"
              >
                <Text className="text-[17px] font-bold text-white dark:text-neutral-900">编辑菜谱</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
