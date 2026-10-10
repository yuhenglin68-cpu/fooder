/**
 * 「新建菜品」—— 录入表单页
 *
 * Apple HIG 极简大字设计原则：
 * 1. 核心聚焦：顶部照片槽位作为视区第一焦点，大圆角与空间节奏从容
 * 2. 尺度比例：卡片 rounded-[24px]，输入框 rounded-xl，标签药丸 rounded-full
 * 3. 毛玻璃浮层：底部固定停靠栏采用 BlurView 质感浮层，完全避开安卓三大金刚键与 iOS 手势条
 * 4. 阴影层级：近层卡片微边框低漫射，悬浮主按键柔和扩散投影
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';
import {
  Camera,
  Image as ImageIcon,
  X,
  Check,
  RotateCcw,
} from 'lucide-react-native';

import { useDishStore } from '@/store/useDishStore';
import { useColorScheme } from '@/components/useColorScheme';
import { saveImageToSandbox } from '@/utils/fileManager';
import {
  DISH_CATEGORIES,
  type DishCategory,
  type Ingredient,
  type CreateDishInput,
} from '@/database/types';

/** 常用预设标签 */
const PRESET_TAGS = ['家常菜', '快手菜', '下饭菜', '低脂健康', '聚会硬菜'];

export default function AddDishScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const { addNewDish } = useDishStore();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<DishCategory>('热炒');
  const [price, setPrice] = useState('');
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [ingredientsText, setIngredientsText] = useState('');
  const [steps, setSteps] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 选图逻辑
  const handlePickFromLibrary = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('权限受限', '需要相册访问权限以挑选菜品照片');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('[AddDish] 相册选图失败:', error);
      Alert.alert('错误', '读取相册照片失败');
    }
  };

  const handleTakePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('权限受限', '需要相机权限以拍摄菜品照片');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('[AddDish] 相机拍摄失败:', error);
      Alert.alert('错误', '启动相机失败');
    }
  };

  const handleRemoveImage = () => {
    setSelectedImageUri(null);
  };

  // 标签管理
  const handleAddTag = (textToAdd?: string) => {
    const rawTag = (textToAdd ?? tagInput).trim();
    if (!rawTag) return;
    if (tags.includes(rawTag)) {
      if (!textToAdd) setTagInput('');
      return;
    }
    setTags([...tags, rawTag]);
    if (!textToAdd) setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // 食材行解析
  const parseIngredients = (text: string): Ingredient[] => {
    return text
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const match = line.match(/^([^\s:：\-]+)[\s:：\-]+(.*)$/);
        if (match) {
          return { name: match[1].trim(), amount: match[2].trim() };
        }
        return { name: line, amount: '适量' };
      });
  };

  // 提交入库
  const handleSubmit = async () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      Alert.alert('提示', '请填写菜品名称');
      return;
    }

    if (!selectedImageUri) {
      Alert.alert('提示', '请添加菜品照片');
      return;
    }

    setIsSubmitting(true);

    try {
      const permanentImageUri = await saveImageToSandbox(selectedImageUri);
      const parsedIngredients = parseIngredients(ingredientsText);
      const parsedPrice = price.trim() ? parseFloat(price.trim()) : null;

      const input: CreateDishInput = {
        name: trimmedName,
        imageUri: permanentImageUri,
        category,
        tags,
        price: isNaN(Number(parsedPrice)) ? null : parsedPrice,
        ingredients: parsedIngredients,
        steps: steps.trim(),
      };

      addNewDish(input);

      Alert.alert('成功', '菜品已添加至菜谱库', [
        {
          text: '确定',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error('[AddDish] 保存失败:', error);
      Alert.alert('错误', '保存数据异常，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDark = colorScheme === 'dark';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-[#F2F2F7] dark:bg-[#000000]"
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 144,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* 视区焦点：照片大卡片 */}
        <View className="mb-5">
          <Text className="text-[13px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2.5 px-1">
            菜品照片 <Text className="text-red-500">*</Text>
          </Text>

          {selectedImageUri ? (
            <View
              className="relative w-full h-56 rounded-[24px] overflow-hidden bg-white dark:bg-[#1C1C1E] border border-black/[0.04] dark:border-white/[0.06]"
              style={{
                shadowColor: '#000000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.05,
                shadowRadius: 14,
                elevation: 2,
              }}
            >
              <Image
                source={{ uri: selectedImageUri }}
                className="w-full h-full"
                resizeMode="cover"
              />
              {/* 悬浮操作胶囊 */}
              <View className="absolute top-3.5 right-3.5 flex-row gap-2">
                <Pressable
                  onPress={handlePickFromLibrary}
                  className="bg-black/60 px-3 py-1.5 rounded-full flex-row items-center active:opacity-80"
                >
                  <RotateCcw size={12} color="#FFFFFF" strokeWidth={2.2} />
                  <Text className="text-xs text-white ml-1 font-semibold">更换</Text>
                </Pressable>
                <Pressable
                  onPress={handleRemoveImage}
                  className="bg-red-500/80 p-1.5 rounded-full items-center justify-center active:opacity-80"
                >
                  <X size={14} color="#FFFFFF" strokeWidth={2.5} />
                </Pressable>
              </View>
            </View>
          ) : (
            <View
              className="w-full h-48 rounded-[24px] border border-dashed border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#1C1C1E] items-center justify-center p-5"
            >
              <View className="w-14 h-14 rounded-2xl bg-orange-50 dark:bg-orange-950/40 items-center justify-center mb-3">
                <ImageIcon size={26} color="#FF6B35" strokeWidth={1.8} />
              </View>
              <Text className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 mb-3.5">
                添加清晰的菜品照片
              </Text>

              <View className="flex-row gap-3">
                <Pressable
                  onPress={handlePickFromLibrary}
                  className="flex-row items-center bg-[#FF6B35] px-4 py-2 rounded-full active:opacity-90"
                >
                  <ImageIcon size={14} color="#FFFFFF" strokeWidth={2} />
                  <Text className="text-xs font-bold text-white ml-1.5">相册选择</Text>
                </Pressable>
                <Pressable
                  onPress={handleTakePhoto}
                  className="flex-row items-center bg-neutral-100 dark:bg-neutral-800 px-4 py-2 rounded-full active:opacity-90 border border-neutral-200/60 dark:border-neutral-700"
                >
                  <Camera size={14} color={isDark ? '#E5E5EA' : '#1C1C1E'} strokeWidth={2} />
                  <Text className="text-xs font-semibold text-neutral-800 dark:text-neutral-100 ml-1.5">拍摄照片</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>

        {/* 基础属性分组卡片 */}
        <View
          className="bg-white dark:bg-[#1C1C1E] rounded-[24px] p-5 border border-black/[0.04] dark:border-white/[0.06] mb-5"
          style={{
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.03,
            shadowRadius: 10,
            elevation: 1,
          }}
        >
          {/* 名称输入 */}
          <View className="mb-4">
            <Text className="text-[13px] font-bold text-neutral-800 dark:text-neutral-200 mb-2">
              菜品名称 <Text className="text-red-500">*</Text>
            </Text>
            <TextInput
              className="bg-[#F2F2F7] dark:bg-[#2C2C2E] border border-black/[0.04] dark:border-white/[0.06] rounded-xl px-4 py-3 text-base font-semibold text-neutral-900 dark:text-white"
              placeholder="例如：番茄炒蛋"
              placeholderTextColor="#8E8E93"
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* 分类胶囊选择 */}
          <View className="mb-4">
            <Text className="text-[13px] font-bold text-neutral-800 dark:text-neutral-200 mb-2.5">
              分类 <Text className="text-red-500">*</Text>
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {DISH_CATEGORIES.map((cat) => {
                const isSelected = category === cat;
                return (
                  <Pressable
                    key={cat}
                    onPress={() => setCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-full border ${
                      isSelected
                        ? 'bg-[#FF6B35] border-[#FF6B35]'
                        : 'bg-[#F2F2F7] dark:bg-[#2C2C2E] border-transparent'
                    } active:opacity-80`}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        isSelected ? 'text-white' : 'text-neutral-600 dark:text-neutral-300'
                      }`}
                    >
                      {cat}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* 预估成本 */}
          <View>
            <Text className="text-[13px] font-bold text-neutral-800 dark:text-neutral-200 mb-2">
              参考成本
            </Text>
            <View className="flex-row items-center bg-[#F2F2F7] dark:bg-[#2C2C2E] border border-black/[0.04] dark:border-white/[0.06] rounded-xl px-4 py-2.5">
              <Text className="text-base font-bold text-[#FF6B35] mr-2">¥</Text>
              <TextInput
                className="flex-1 text-base font-semibold text-neutral-900 dark:text-white p-0"
                placeholder="0.00"
                placeholderTextColor="#8E8E93"
                keyboardType="decimal-pad"
                value={price}
                onChangeText={setPrice}
              />
            </View>
          </View>
        </View>

        {/* 标签分组卡片 */}
        <View
          className="bg-white dark:bg-[#1C1C1E] rounded-[24px] p-5 border border-black/[0.04] dark:border-white/[0.06] mb-5"
          style={{
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.03,
            shadowRadius: 10,
            elevation: 1,
          }}
        >
          <Text className="text-[13px] font-bold text-neutral-800 dark:text-neutral-200 mb-2.5">
            标签
          </Text>

          {/* 自定义添加 */}
          <View className="flex-row items-center mb-3">
            <TextInput
              className="flex-1 bg-[#F2F2F7] dark:bg-[#2C2C2E] border border-black/[0.04] dark:border-white/[0.06] rounded-xl px-3.5 py-2 text-xs text-neutral-900 dark:text-white"
              placeholder="输入标签"
              placeholderTextColor="#8E8E93"
              value={tagInput}
              onChangeText={setTagInput}
              onSubmitEditing={() => handleAddTag()}
              returnKeyType="done"
            />
            <Pressable
              onPress={() => handleAddTag()}
              className="ml-2 bg-[#FF6B35] px-4 py-2 rounded-xl active:opacity-80"
            >
              <Text className="text-xs font-bold text-white">添加</Text>
            </Pressable>
          </View>

          {/* 预设标签 */}
          <View className="flex-row flex-wrap gap-2 mb-2">
            {PRESET_TAGS.map((preset) => {
              const isAdded = tags.includes(preset);
              return (
                <Pressable
                  key={preset}
                  onPress={() => (isAdded ? handleRemoveTag(preset) : handleAddTag(preset))}
                  className={`px-3 py-1 rounded-full border ${
                    isAdded
                      ? 'bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-900/60'
                      : 'bg-[#F2F2F7] dark:bg-[#2C2C2E] border-transparent'
                  }`}
                >
                  <Text
                    className={`text-xs ${
                      isAdded ? 'font-bold text-[#FF6B35]' : 'text-neutral-600 dark:text-neutral-400 font-medium'
                    }`}
                  >
                    {isAdded ? `✓ ${preset}` : preset}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* 已添加标签 */}
          {tags.length > 0 && (
            <View className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex-row flex-wrap gap-2">
              {tags.map((t) => (
                <Pressable
                  key={t}
                  onPress={() => handleRemoveTag(t)}
                  className="flex-row items-center bg-neutral-100 dark:bg-neutral-800 px-3 py-1 rounded-full"
                >
                  <Text className="text-xs font-medium text-neutral-800 dark:text-neutral-200 mr-1.5">{t}</Text>
                  <X size={12} color="#8E8E93" strokeWidth={2.2} />
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* 食材清单卡片 */}
        <View
          className="bg-white dark:bg-[#1C1C1E] rounded-[24px] p-5 border border-black/[0.04] dark:border-white/[0.06] mb-5"
          style={{
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.03,
            shadowRadius: 10,
            elevation: 1,
          }}
        >
          <Text className="text-[13px] font-bold text-neutral-800 dark:text-neutral-200 mb-2">
            食材清单
          </Text>
          <TextInput
            className="bg-[#F2F2F7] dark:bg-[#2C2C2E] border border-black/[0.04] dark:border-white/[0.06] rounded-xl p-3.5 text-xs text-neutral-900 dark:text-white min-h-[90px]"
            placeholder="每行一项，例如：&#10;鸡蛋 2个&#10;西红柿 1个"
            placeholderTextColor="#8E8E93"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            value={ingredientsText}
            onChangeText={setIngredientsText}
          />
        </View>

        {/* 烹饪步骤卡片 */}
        <View
          className="bg-white dark:bg-[#1C1C1E] rounded-[24px] p-5 border border-black/[0.04] dark:border-white/[0.06] mb-5"
          style={{
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.03,
            shadowRadius: 10,
            elevation: 1,
          }}
        >
          <Text className="text-[13px] font-bold text-neutral-800 dark:text-neutral-200 mb-2">
            烹饪步骤
          </Text>
          <TextInput
            className="bg-[#F2F2F7] dark:bg-[#2C2C2E] border border-black/[0.04] dark:border-white/[0.06] rounded-xl p-3.5 text-xs text-neutral-900 dark:text-white min-h-[100px]"
            placeholder="记录简要烹饪流程..."
            placeholderTextColor="#8E8E93"
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            value={steps}
            onChangeText={setSteps}
          />
        </View>
      </ScrollView>

      {/* 底部毛玻璃安全停靠栏：彻底避开三大金刚导航键与手势指示条 */}
      <View className="absolute bottom-0 left-0 right-0 overflow-hidden border-t border-black/[0.05] dark:border-white/[0.08]">
        <BlurView
          intensity={90}
          tint={isDark ? 'dark' : 'light'}
          style={{
            paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 16 : 12),
            paddingTop: 12,
            paddingHorizontal: 20,
            backgroundColor: isDark ? 'rgba(28,28,30,0.88)' : 'rgba(255,255,255,0.88)',
          }}
        >
          <Pressable
            onPress={handleSubmit}
            disabled={isSubmitting}
            className={`w-full h-14 rounded-2xl items-center justify-center flex-row ${
              isSubmitting ? 'bg-orange-300' : 'bg-[#FF6B35] active:scale-[0.99]'
            }`}
            style={{
              shadowColor: '#FF6B35',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.28,
              shadowRadius: 16,
              elevation: 4,
            }}
          >
            {isSubmitting ? (
              <>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text className="text-white font-extrabold text-base ml-2">正在保存...</Text>
              </>
            ) : (
              <>
                <Check size={19} color="#FFFFFF" strokeWidth={2.5} />
                <Text className="text-white font-extrabold text-base ml-2">保存入库</Text>
              </>
            )}
          </Pressable>
        </BlurView>
      </View>
    </KeyboardAvoidingView>
  );
}
