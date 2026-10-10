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
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Search,
  X,
  Trash2,
  BookOpen,
  Plus,
} from 'lucide-react-native';

import { useDishStore } from '@/store/useDishStore';
import { DISH_CATEGORIES, type Dish, type DishCategory } from '@/database/types';

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

  // 渲染单个菜品卡片
  const renderItem = useCallback(
    ({ item }: { item: Dish }) => (
      <View
        className="w-full flex-row bg-white dark:bg-[#1C1C1E] rounded-[24px] overflow-hidden mb-4 border border-black/[0.04] dark:border-white/[0.06]"
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
          <View className="flex-row justify-end mt-2">
            <Pressable
              onPress={() => handleDelete(item)}
              className="w-8 h-8 items-center justify-center rounded-full active:bg-neutral-100 dark:active:bg-neutral-800"
              hitSlop={8}
            >
              <Trash2 size={16} color="#FF3B30" strokeWidth={2} />
            </Pressable>
          </View>
        </View>
      </View>
    ),
    [handleDelete]
  );

  return (
    <View className="flex-1 bg-[#F2F2F7] dark:bg-[#000000]">
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
            onPress={() => setCategory('全部')}
            className={`px-4 py-2 rounded-full border ${
              activeCategory === '全部'
                ? 'bg-[#FF6B35] border-[#FF6B35]'
                : 'bg-white dark:bg-[#1C1C1E] border-black/[0.04] dark:border-white/[0.06]'
            }`}
          >
            <Text
              className={`text-[13px] font-bold ${
                activeCategory === '全部' ? 'text-white' : 'text-neutral-600 dark:text-neutral-400'
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
    </View>
  );
}
