/**
 * 「设置」页面
 *
 * 设计特性：
 * 1. 外观与个性化模块：页面外观 (浅色/深色/Auto) 与自定义壁纸合并扁平化设计，延续 Apple HIG Inset Grouped 纯净风格
 * 2. 数据管理模块：新增「本地存储占用实时面板」，支持实时统计菜谱照片、壁纸及数据库字节大小并可视化展示
 * 3. 完备的「隐私政策」与「关于 Fooder」内容弹层
 */

import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  Pressable, 
  Alert, 
  Image, 
  Modal 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { 
  UploadCloud, 
  DownloadCloud, 
  ShieldCheck, 
  Info, 
  ChevronRight, 
  Trash2, 
  Sun, 
  Moon, 
  Smartphone, 
  Image as ImageIcon, 
  RotateCcw, 
  HardDrive, 
  RefreshCw, 
  X, 
  Palette, 
  SlidersHorizontal,
  Check,
  Lock,
  WifiOff,
  FolderLock
} from 'lucide-react-native';

import { useColorScheme } from '@/components/useColorScheme';
import { clearDatabase } from '@/database';
import { useDishStore } from '@/store/useDishStore';
import { useSettingsStore, type ThemeMode } from '@/store/useSettingsStore';
import { 
  saveBackgroundImageToSandbox, 
  getAppStorageDetails, 
  type StorageDetails 
} from '@/utils/fileManager';
import { exportDishes, pickAndImportDishes } from '@/utils/syncManager';
import { GlobalBackground } from '@/components/GlobalBackground';

const SettingsItem = ({ 
  icon, 
  iconBg, 
  title, 
  onPress, 
  isLast = false, 
  isDestructive = false,
  rightContent
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  onPress: () => void;
  isLast?: boolean;
  isDestructive?: boolean;
  rightContent?: React.ReactNode;
}) => (
  <Pressable
    onPress={onPress}
    className={`flex-row items-center px-4 py-3.5 bg-white dark:bg-[#1C1C1E] active:bg-neutral-100 dark:active:bg-[#2C2C2E] ${
      !isLast ? 'border-b border-black/[0.04] dark:border-white/[0.06]' : ''
    }`}
  >
    <View className={`w-[30px] h-[30px] rounded-lg items-center justify-center mr-3.5 ${iconBg}`}>
      {icon}
    </View>
    <View className="flex-1 flex-row items-center justify-between">
      <Text className={`text-[17px] font-medium ${isDestructive ? 'text-red-500' : 'text-neutral-900 dark:text-white'}`}>
        {title}
      </Text>
      {rightContent ? (
        rightContent
      ) : (
        <ChevronRight size={18} color="#C7C7CC" />
      )}
    </View>
  </Pressable>
);

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const { loadDishes, dishes } = useDishStore();
  const { 
    themeMode, 
    setThemeMode, 
    customBgUri, 
    setCustomBackground, 
    bgBlurIntensity, 
    setBgBlurIntensity, 
    bgMaskOpacity, 
    setBgMaskOpacity 
  } = useSettingsStore();

  const hasCustomBg = !!customBgUri;

  // 存储占用状态
  const [storageDetails, setStorageDetails] = useState<StorageDetails>({
    dishImagesBytes: 0,
    dishImagesCount: 0,
    bgImagesBytes: 0,
    bgImagesCount: 0,
    databaseBytes: 0,
    totalBytes: 0,
    dishImagesFormatted: '0 B',
    bgImagesFormatted: '0 B',
    databaseFormatted: '0 B',
    totalFormatted: '0 B',
  });
  const [isRefreshingStorage, setIsRefreshingStorage] = useState(false);

  // 弹窗状态
  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);
  const [aboutModalVisible, setAboutModalVisible] = useState(false);
  const [effectModalVisible, setEffectModalVisible] = useState(false);

  // ─── 存储占用计算 ──────────────────────────────────────────
  const refreshStorage = useCallback(() => {
    setIsRefreshingStorage(true);
    try {
      const stats = getAppStorageDetails();
      setStorageDetails(stats);
    } catch (e) {
      console.warn('[Settings] 统计存储占用失败:', e);
    } finally {
      setTimeout(() => setIsRefreshingStorage(false), 300);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshStorage();
    }, [refreshStorage])
  );


  // ─── 外观主题选项 ───────────────────────────────────────────
  const themeOptions: { mode: ThemeMode; label: string; icon: typeof Sun }[] = [
    { mode: 'light', label: '浅色', icon: Sun },
    { mode: 'dark', label: '深色', icon: Moon },
    { mode: 'auto', label: 'Auto', icon: Smartphone },
  ];

  // ─── 背景图片操作 ───────────────────────────────────────────
  const handlePickBackground = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('权限提示', '需要相册访问权限以挑选全局壁纸图片');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.9,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const pickedAsset = result.assets[0];
        const savedUri = await saveBackgroundImageToSandbox(pickedAsset.uri);
        setCustomBackground(savedUri);
        refreshStorage();
        Alert.alert('成功', '全局背景图片已更新生效！');
      }
    } catch (e) {
      console.error('[Settings] 选择背景图失败:', e);
      Alert.alert('错误', '读取相册照片失败');
    }
  };

  const handleClearBackground = () => {
    Alert.alert(
      '恢复默认背景',
      '确定要移除自定义壁纸并恢复为默认纯色背景吗？',
      [
        { text: '取消', style: 'cancel' },
        { 
          text: '确认恢复', 
          style: 'destructive',
          onPress: () => {
            setCustomBackground(null);
            refreshStorage();
          }
        }
      ]
    );
  };

  // ─── 数据导入导出与清除 ─────────────────────────────────────
  const handleExport = async () => {
    if (dishes.length === 0) {
      Alert.alert('提示', '当前菜谱库为空，没有可以导出的数据。');
      return;
    }
    await exportDishes(dishes);
  };

  const handleImport = async () => {
    await pickAndImportDishes();
    await loadDishes();
    refreshStorage();
  };

  const handleClearAll = () => {
    Alert.alert(
      '危险操作',
      '确认清空所有菜谱数据吗？此操作无法撤销。',
      [
        { text: '取消', style: 'cancel' },
        { 
          text: '确认清空', 
          style: 'destructive',
          onPress: async () => {
            try {
              await clearDatabase();
              await loadDishes();
              refreshStorage();
              Alert.alert('成功', '菜谱数据已清空');
            } catch {
              Alert.alert('错误', '清空失败');
            }
          }
        }
      ]
    );
  };

  // 存储占用百分比计算
  const totalBytes = Math.max(storageDetails.totalBytes, 1);
  const dishPercent = Math.min(100, Math.round((storageDetails.dishImagesBytes / totalBytes) * 100));
  const bgPercent = Math.min(100, Math.round((storageDetails.bgImagesBytes / totalBytes) * 100));
  const dbPercent = Math.max(0, 100 - dishPercent - bgPercent);

  return (
    <View className={`flex-1 ${hasCustomBg ? 'bg-transparent' : 'bg-[#F2F2F7] dark:bg-[#000000]'}`}>
      <GlobalBackground />

      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ 
          paddingTop: insets.top + 20, 
          paddingHorizontal: 20,
          paddingBottom: 120 
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-[34px] font-extrabold text-neutral-900 dark:text-white mb-6">
          设置
        </Text>

        {/* ─── 模块 1：外观与个性化 (扁平化合并模块) ──────────── */}
        <View className="mb-7">
          <Text className="text-[13px] font-bold text-neutral-500 uppercase tracking-wider mb-2.5 ml-4">
            外观与个性化
          </Text>

          <View className="rounded-[22px] overflow-hidden border border-black/[0.02] dark:border-white/[0.04] bg-white dark:bg-[#1C1C1E] shadow-sm">
            {/* 行 1：页面外观切换 (扁平化三段控制器) */}
            <View className="flex-row items-center px-4 py-3 border-b border-black/[0.04] dark:border-white/[0.06]">
              <View className="w-[30px] h-[30px] rounded-lg items-center justify-center mr-3.5 bg-orange-500">
                <Palette size={16} color="#FFF" />
              </View>
              <View className="flex-1 flex-row items-center justify-between">
                <Text className="text-[17px] font-medium text-neutral-900 dark:text-white">
                  页面外观
                </Text>
                
                {/* 扁平化胶囊三段按钮 */}
                <View className="flex-row bg-neutral-100 dark:bg-neutral-800/80 p-1 rounded-xl">
                  {themeOptions.map((opt) => {
                    const isSelected = themeMode === opt.mode;
                    const IconComp = opt.icon;
                    return (
                      <Pressable
                        key={opt.mode}
                        onPress={() => setThemeMode(opt.mode)}
                        className="flex-row items-center px-2.5 py-1.5 rounded-lg"
                        style={{
                          backgroundColor: isSelected
                            ? (isDark ? '#2C2C2E' : '#FFFFFF')
                            : 'transparent',
                          opacity: isSelected ? 1 : 0.75,
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: isSelected ? 0.08 : 0,
                          shadowRadius: 2,
                          elevation: isSelected ? 1 : 0,
                        }}
                      >
                        <IconComp 
                          size={13} 
                          color={isSelected ? '#FF6B35' : (isDark ? '#A1A1AA' : '#71717A')} 
                          strokeWidth={isSelected ? 2.5 : 2}
                        />
                        <Text 
                          className="text-[12px] ml-1.5"
                          style={{
                            fontWeight: isSelected ? '700' : '500',
                            color: isSelected ? '#FF6B35' : (isDark ? '#A1A1AA' : '#71717A'),
                          }}
                        >
                          {opt.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* 行 2：全局自定义背景壁纸 */}
            <SettingsItem
              title="全局自定义壁纸"
              icon={<ImageIcon size={16} color="#FFF" />}
              iconBg="bg-pink-500"
              onPress={handlePickBackground}
              isLast={!hasCustomBg}
              rightContent={
                <View className="flex-row items-center">
                  {hasCustomBg ? (
                    <View className="flex-row items-center">
                      <Image 
                        source={{ uri: customBgUri }} 
                        className="w-6 h-6 rounded-md mr-2 border border-black/10 dark:border-white/10" 
                      />
                      <Text className="text-[14px] text-neutral-500 dark:text-neutral-400 mr-1">
                        更换相册照片
                      </Text>
                    </View>
                  ) : (
                    <Text className="text-[14px] text-neutral-400 dark:text-neutral-500 mr-1">
                      从相册选择
                    </Text>
                  )}
                  <ChevronRight size={18} color="#C7C7CC" />
                </View>
              }
            />

            {/* 行 3 (壁纸已启用时)：磨砂与遮罩微调 */}
            {hasCustomBg && (
              <SettingsItem
                title="壁纸磨砂与遮罩"
                icon={<SlidersHorizontal size={16} color="#FFF" />}
                iconBg="bg-purple-500"
                onPress={() => setEffectModalVisible(true)}
                rightContent={
                  <View className="flex-row items-center">
                    <Text className="text-[14px] text-neutral-500 dark:text-neutral-400 mr-1">
                      虚化 {bgBlurIntensity} · 遮罩 {Math.round(bgMaskOpacity * 100)}%
                    </Text>
                    <ChevronRight size={18} color="#C7C7CC" />
                  </View>
                }
              />
            )}

            {/* 行 4 (壁纸已启用时)：恢复默认背景 */}
            {hasCustomBg && (
              <SettingsItem
                title="恢复系统默认背景"
                icon={<RotateCcw size={16} color="#FFF" />}
                iconBg="bg-neutral-400 dark:bg-neutral-600"
                onPress={handleClearBackground}
                isLast
                isDestructive
              />
            )}
          </View>
          <Text className="text-[12px] text-neutral-400 mt-2 ml-4 mr-2">
            外观与自选壁纸将在抽签、菜谱库、日志与新建等所有页面全局生效。
          </Text>
        </View>

        {/* ─── 模块 2：数据管理与本地存储占用面板 ───────────── */}
        <View className="mb-7">
          <Text className="text-[13px] font-bold text-neutral-500 uppercase tracking-wider mb-2.5 ml-4">
            数据管理
          </Text>

          {/* 实时存储占用计算面板 */}
          <View className="bg-white dark:bg-[#1C1C1E] rounded-[22px] p-4 border border-black/[0.02] dark:border-white/[0.04] mb-3 shadow-sm">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <View className="w-[30px] h-[30px] rounded-lg bg-blue-500 items-center justify-center mr-3">
                  <HardDrive size={16} color="#FFF" />
                </View>
                <Text className="text-[16px] font-bold text-neutral-900 dark:text-white">
                  本地存储占用
                </Text>
              </View>
              <View className="flex-row items-center">
                <Text className="text-[17px] font-black text-[#FF6B35] mr-2.5 tracking-tight">
                  {storageDetails.totalFormatted}
                </Text>
                <Pressable
                  onPress={refreshStorage}
                  hitSlop={10}
                  className="p-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 active:opacity-70"
                  style={{ opacity: isRefreshingStorage ? 0.5 : 1 }}
                >
                  <RefreshCw size={13} color={isDark ? '#A1A1AA' : '#71717A'} />
                </Pressable>
              </View>
            </View>

            {/* 可视化彩色进度分段条 */}
            <View className="w-full h-2.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden flex-row mb-3.5">
              <View 
                style={{ width: `${dishPercent}%` }} 
                className="h-full bg-[#FF6B35]" 
              />
              <View 
                style={{ width: `${bgPercent}%` }} 
                className="h-full bg-pink-500" 
              />
              <View 
                style={{ width: `${dbPercent}%` }} 
                className="h-full bg-blue-500" 
              />
            </View>

            {/* 三项细分统计指标 */}
            <View className="flex-row justify-between pt-2.5 border-t border-black/[0.04] dark:border-white/[0.06]">
              {/* 菜谱照片 */}
              <View className="flex-1 items-center border-r border-black/[0.04] dark:border-white/[0.06] pr-2">
                <View className="flex-row items-center mb-0.5">
                  <View className="w-2 h-2 rounded-full bg-[#FF6B35] mr-1.5" />
                  <Text className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">菜谱照片</Text>
                </View>
                <Text className="text-[13px] font-bold text-neutral-900 dark:text-white">
                  {storageDetails.dishImagesFormatted}
                </Text>
                <Text className="text-[10px] text-neutral-400 mt-0.5">
                  {storageDetails.dishImagesCount} 张文件
                </Text>
              </View>

              {/* 全局壁纸 */}
              <View className="flex-1 items-center border-r border-black/[0.04] dark:border-white/[0.06] px-2">
                <View className="flex-row items-center mb-0.5">
                  <View className="w-2 h-2 rounded-full bg-pink-500 mr-1.5" />
                  <Text className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">全局壁纸</Text>
                </View>
                <Text className="text-[13px] font-bold text-neutral-900 dark:text-white">
                  {storageDetails.bgImagesFormatted}
                </Text>
                <Text className="text-[10px] text-neutral-400 mt-0.5">
                  {hasCustomBg ? '1 张生效中' : '系统默认'}
                </Text>
              </View>

              {/* 数据库与日志 */}
              <View className="flex-1 items-center pl-2">
                <View className="flex-row items-center mb-0.5">
                  <View className="w-2 h-2 rounded-full bg-blue-500 mr-1.5" />
                  <Text className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">数据与日志</Text>
                </View>
                <Text className="text-[13px] font-bold text-neutral-900 dark:text-white">
                  {storageDetails.databaseFormatted}
                </Text>
                <Text className="text-[10px] text-neutral-400 mt-0.5">
                  {dishes.length} 道菜谱
                </Text>
              </View>
            </View>
          </View>

          {/* 数据管理列表操作项 */}
          <View className="rounded-[22px] overflow-hidden border border-black/[0.02] dark:border-white/[0.04] shadow-sm">
            <SettingsItem 
              title="一键导出全库" 
              icon={<UploadCloud size={16} color="#FFF" />} 
              iconBg="bg-blue-500" 
              onPress={handleExport} 
            />
            <SettingsItem 
              title="手动导入菜谱包 (Expo测试用)" 
              icon={<DownloadCloud size={16} color="#FFF" />} 
              iconBg="bg-green-500" 
              onPress={handleImport} 
            />
            <SettingsItem 
              title="清空本地数据" 
              icon={<Trash2 size={16} color="#FFF" />} 
              iconBg="bg-red-500" 
              onPress={handleClearAll} 
              isLast
              isDestructive
            />
          </View>
          <Text className="text-[12px] text-neutral-400 mt-2 ml-4 mr-2">
            离线数据包可通过微信、隔空投送等方式分享给家人，实现双端免同步云数据合并。
          </Text>
        </View>

        {/* ─── 模块 3：关于与协议 ───────────────────────────── */}
        <View className="mb-8">
          <Text className="text-[13px] font-bold text-neutral-500 uppercase tracking-wider mb-2.5 ml-4">
            关于
          </Text>
          <View className="rounded-[22px] overflow-hidden border border-black/[0.02] dark:border-white/[0.04] shadow-sm">
            <SettingsItem 
              title="隐私政策" 
              icon={<ShieldCheck size={16} color="#FFF" />} 
              iconBg="bg-indigo-500" 
              onPress={() => setPrivacyModalVisible(true)} 
            />
            <SettingsItem 
              title="关于 Fooder" 
              icon={<Info size={16} color="#FFF" />} 
              iconBg="bg-gray-500" 
              onPress={() => setAboutModalVisible(true)} 
              isLast
            />
          </View>
        </View>
        
        {/* 底部信息 */}
        <View className="items-center mt-4 opacity-50">
          <Text className="text-xs text-neutral-500 dark:text-neutral-400 font-bold tracking-widest">FOODER</Text>
          <Text className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-1">版本 1.0.0 · 纯本地版</Text>
        </View>
      </ScrollView>

      {/* ─── 弹窗 1：壁纸磨砂虚化与遮罩微调弹窗 ────────────── */}
      <Modal
        visible={effectModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEffectModalVisible(false)}
      >
        <View className="flex-1 bg-[#F2F2F7] dark:bg-[#000000] p-6">
          <View className="flex-row items-center justify-between pb-4 border-b border-black/[0.05] dark:border-white/[0.08]">
            <Text className="text-[20px] font-extrabold text-neutral-900 dark:text-white">
              壁纸效果调节
            </Text>
            <Pressable 
              onPress={() => setEffectModalVisible(false)}
              className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-800 items-center justify-center"
            >
              <X size={18} color={isDark ? '#FFF' : '#000'} />
            </Pressable>
          </View>

          <ScrollView className="flex-1 pt-5" showsVerticalScrollIndicator={false}>
            {/* 缩略实时预览框 */}
            {hasCustomBg && (
              <View className="relative w-full h-40 rounded-2xl overflow-hidden mb-6 border border-black/[0.06] dark:border-white/[0.08]">
                <Image source={{ uri: customBgUri }} className="w-full h-full" resizeMode="cover" />
                <View 
                  className="absolute inset-0"
                  style={{
                    backgroundColor: isDark 
                      ? `rgba(0,0,0,${bgMaskOpacity})` 
                      : `rgba(255,255,255,${bgMaskOpacity})`
                  }}
                />
                <View className="absolute bottom-3 left-3 bg-black/60 px-3 py-1 rounded-full">
                  <Text className="text-xs text-white font-semibold">
                    实时效果预览 · 虚化 {bgBlurIntensity} · 遮罩 {Math.round(bgMaskOpacity * 100)}%
                  </Text>
                </View>
              </View>
            )}

            {/* 虚化强度 */}
            <View className="bg-white dark:bg-[#1C1C1E] p-4 rounded-2xl mb-4 border border-black/[0.04] dark:border-white/[0.06]">
              <Text className="text-[14px] font-bold text-neutral-900 dark:text-white mb-2.5">
                高斯磨砂虚化强度
              </Text>
              <View className="flex-row gap-2">
                {[
                  { label: '清晰 (0)', value: 0 },
                  { label: '柔和 (15)', value: 15 },
                  { label: '标准 (25)', value: 25 },
                  { label: '深度 (45)', value: 45 },
                ].map((item) => (
                  <Pressable
                    key={item.value}
                    onPress={() => setBgBlurIntensity(item.value)}
                    className={`flex-1 py-2.5 rounded-xl items-center border ${
                      bgBlurIntensity === item.value
                        ? 'bg-orange-50 dark:bg-orange-950/40 border-[#FF6B35]'
                        : 'bg-neutral-50 dark:bg-neutral-800 border-neutral-200/50 dark:border-neutral-700/60'
                    }`}
                  >
                    <Text className={`text-[12px] font-bold ${
                      bgBlurIntensity === item.value ? 'text-[#FF6B35]' : 'text-neutral-700 dark:text-neutral-300'
                    }`}>
                      {item.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* 遮罩深度 */}
            <View className="bg-white dark:bg-[#1C1C1E] p-4 rounded-2xl mb-6 border border-black/[0.04] dark:border-white/[0.06]">
              <Text className="text-[14px] font-bold text-neutral-900 dark:text-white mb-2.5">
                文字对比度遮罩
              </Text>
              <View className="flex-row gap-2">
                {[
                  { label: '通透 (20%)', value: 0.2 },
                  { label: '平衡 (35%)', value: 0.35 },
                  { label: '沉浸 (55%)', value: 0.55 },
                ].map((item) => (
                  <Pressable
                    key={item.value}
                    onPress={() => setBgMaskOpacity(item.value)}
                    className={`flex-1 py-2.5 rounded-xl items-center border ${
                      Math.abs(bgMaskOpacity - item.value) < 0.05
                        ? 'bg-orange-50 dark:bg-orange-950/40 border-[#FF6B35]'
                        : 'bg-neutral-50 dark:bg-neutral-800 border-neutral-200/50 dark:border-neutral-700/60'
                    }`}
                  >
                    <Text className={`text-[12px] font-bold ${
                      Math.abs(bgMaskOpacity - item.value) < 0.05 ? 'text-[#FF6B35]' : 'text-neutral-700 dark:text-neutral-300'
                    }`}>
                      {item.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <Pressable
              onPress={() => setEffectModalVisible(false)}
              className="w-full bg-[#FF6B35] py-3.5 rounded-2xl items-center justify-center active:scale-[0.99]"
            >
              <Text className="text-white font-bold text-[16px]">完成</Text>
            </Pressable>
          </ScrollView>
        </View>
      </Modal>

      {/* ─── 弹窗 2：隐私政策与数据安全弹窗 ────────────────── */}
      <Modal
        visible={privacyModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setPrivacyModalVisible(false)}
      >
        <View className="flex-1 bg-[#F2F2F7] dark:bg-[#000000] p-6">
          <View className="flex-row items-center justify-between pb-4 border-b border-black/[0.05] dark:border-white/[0.08]">
            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-lg bg-indigo-500 items-center justify-center mr-2.5">
                <ShieldCheck size={18} color="#FFF" />
              </View>
              <Text className="text-[20px] font-extrabold text-neutral-900 dark:text-white">
                隐私政策
              </Text>
            </View>
            <Pressable 
              onPress={() => setPrivacyModalVisible(false)}
              className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-800 items-center justify-center"
            >
              <X size={18} color={isDark ? '#FFF' : '#000'} />
            </Pressable>
          </View>

          <ScrollView className="flex-1 pt-4" showsVerticalScrollIndicator={false}>
            {/* 宗旨标语 */}
            <View className="bg-white dark:bg-[#1C1C1E] p-4 rounded-2xl mb-4 border border-black/[0.04] dark:border-white/[0.06]">
              <Text className="text-[16px] font-bold text-neutral-900 dark:text-white mb-1.5">
                Fooder 隐私与数据安全承诺
              </Text>
              <Text className="text-[13px] leading-5 text-neutral-600 dark:text-neutral-400">
                Fooder 秉持「本地优先、零数据上传、绝对尊重用户隐私」的极简理念。我们坚信工具软件应当尊重用户的每一项数据所有权。
              </Text>
            </View>

            {/* 条款细分卡片 */}
            <View className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-4.5 mb-4 border border-black/[0.04] dark:border-white/[0.06]">
              <View className="flex-row items-start mb-4">
                <View className="w-7 h-7 rounded-lg bg-emerald-500/10 items-center justify-center mr-3 mt-0.5">
                  <FolderLock size={15} color="#10B981" />
                </View>
                <View className="flex-1">
                  <Text className="text-[15px] font-bold text-neutral-900 dark:text-white mb-1">
                    1. 数据 100% 本地沙盒存储
                  </Text>
                  <Text className="text-[13px] leading-5 text-neutral-500 dark:text-neutral-400">
                    您添加的每一道菜品、食材配比、烹饪步骤、每日就餐日志、自选照片与自定义壁纸，均存储在手机本地的 SQLite 数据库与沙盒目录中，绝不离开您的手机。
                  </Text>
                </View>
              </View>

              <View className="flex-row items-start mb-4">
                <View className="w-7 h-7 rounded-lg bg-blue-500/10 items-center justify-center mr-3 mt-0.5">
                  <WifiOff size={15} color="#3B82F6" />
                </View>
                <View className="flex-1">
                  <Text className="text-[15px] font-bold text-neutral-900 dark:text-white mb-1">
                    2. 零网络上报与行为追踪
                  </Text>
                  <Text className="text-[13px] leading-5 text-neutral-500 dark:text-neutral-400">
                    应用不包含任何第三方数据分析 SDK、广告追踪插件或设备指纹收集组件，不会在后台收集您的偏好或行为记录。
                  </Text>
                </View>
              </View>

              <View className="flex-row items-start mb-4">
                <View className="w-7 h-7 rounded-lg bg-orange-500/10 items-center justify-center mr-3 mt-0.5">
                  <Lock size={15} color="#FF6B35" />
                </View>
                <View className="flex-1">
                  <Text className="text-[15px] font-bold text-neutral-900 dark:text-white mb-1">
                    3. 系统权限最少化原则
                  </Text>
                  <Text className="text-[13px] leading-5 text-neutral-500 dark:text-neutral-400">
                    应用仅在您主动拍摄菜品或挑选壁纸时申请相机与相册权限。所选照片直接保存在本地沙盒，绝无任何网络中转。
                  </Text>
                </View>
              </View>

              <View className="flex-row items-start">
                <View className="w-7 h-7 rounded-lg bg-purple-500/10 items-center justify-center mr-3 mt-0.5">
                  <UploadCloud size={15} color="#8B5CF6" />
                </View>
                <View className="flex-1">
                  <Text className="text-[15px] font-bold text-neutral-900 dark:text-white mb-1">
                    4. 完整的数据自主权
                  </Text>
                  <Text className="text-[13px] leading-5 text-neutral-500 dark:text-neutral-400">
                    您可以随时使用「一键导出全库」将全部菜谱导出为离线数据包与家人共享备份；也可以随时一键清空本地数据彻底抹除所有记录。
                  </Text>
                </View>
              </View>
            </View>

            <Pressable
              onPress={() => setPrivacyModalVisible(false)}
              className="w-full bg-[#FF6B35] py-3.5 rounded-2xl items-center justify-center mb-6 active:scale-[0.99]"
            >
              <Text className="text-white font-bold text-[16px]">我已知晓</Text>
            </Pressable>
          </ScrollView>
        </View>
      </Modal>

      {/* ─── 弹窗 3：关于 Fooder 弹窗 ──────────────────────── */}
      <Modal
        visible={aboutModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setAboutModalVisible(false)}
      >
        <View className="flex-1 bg-[#F2F2F7] dark:bg-[#000000] p-6">
          <View className="flex-row items-center justify-between pb-4 border-b border-black/[0.05] dark:border-white/[0.08]">
            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-lg bg-gray-500 items-center justify-center mr-2.5">
                <Info size={18} color="#FFF" />
              </View>
              <Text className="text-[20px] font-extrabold text-neutral-900 dark:text-white">
                关于 Fooder
              </Text>
            </View>
            <Pressable 
              onPress={() => setAboutModalVisible(false)}
              className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-800 items-center justify-center"
            >
              <X size={18} color={isDark ? '#FFF' : '#000'} />
            </Pressable>
          </View>

          <ScrollView className="flex-1 pt-5" showsVerticalScrollIndicator={false}>
            {/* Logo 与版本标语 */}
            <View className="items-center mb-6">
              <View className="w-20 h-20 rounded-3xl overflow-hidden bg-white border border-black/5 dark:border-white/10 items-center justify-center shadow-md shadow-black/10 mb-3">
                <Image 
                  source={require('@/assets/images/icon.png')} 
                  className="w-20 h-20" 
                  resizeMode="cover"
                />
              </View>
              <Text className="text-[24px] font-black text-neutral-900 dark:text-white tracking-tight">
                Fooder
              </Text>
              <Text className="text-[13px] font-medium text-neutral-400 dark:text-neutral-500 mt-1">
                版本 1.0.0 (Build 2026.10)
              </Text>
              <Text className="text-[13px] font-semibold text-[#FF6B35] mt-1.5">
                今天吃什么？不再纠结的美食决策伴侣
              </Text>
            </View>

            {/* 产品定位卡片 */}
            <View className="bg-white dark:bg-[#1C1C1E] p-4.5 rounded-2xl mb-4 border border-black/[0.04] dark:border-white/[0.06]">
              <Text className="text-[15px] font-bold text-neutral-900 dark:text-white mb-2">
                设计初衷
              </Text>
              <Text className="text-[13px] leading-5 text-neutral-600 dark:text-neutral-400">
                每天最让人纠结的三大难题之首就是「今天吃什么」。Fooder 专为解决餐前选择困难症而生，帮助您收录家常私房好菜、探店心仪美食与健康食谱。
              </Text>
            </View>

            {/* 核心亮点 */}
            <View className="bg-white dark:bg-[#1C1C1E] p-4.5 rounded-2xl mb-4 border border-black/[0.04] dark:border-white/[0.06]">
              <Text className="text-[15px] font-bold text-neutral-900 dark:text-white mb-3">
                核心功能特性
              </Text>
              
              <View className="gap-2.5">
                <View className="flex-row items-center">
                  <Check size={14} color="#FF6B35" strokeWidth={2.5} />
                  <Text className="text-[13px] text-neutral-700 dark:text-neutral-300 ml-2">
                    <Text className="font-bold">6维灵感抽签：</Text>早餐、肉类、素类、汤羹一键随机抽取
                  </Text>
                </View>

                <View className="flex-row items-center">
                  <Check size={14} color="#FF6B35" strokeWidth={2.5} />
                  <Text className="text-[13px] text-neutral-700 dark:text-neutral-300 ml-2">
                    <Text className="font-bold">私人菜谱库：</Text>支持食材清单、步骤、价格与精美图片
                  </Text>
                </View>

                <View className="flex-row items-center">
                  <Check size={14} color="#FF6B35" strokeWidth={2.5} />
                  <Text className="text-[13px] text-neutral-700 dark:text-neutral-300 ml-2">
                    <Text className="font-bold">美味足迹日志：</Text>记录每日吃过的菜品，回味人间烟火
                  </Text>
                </View>

                <View className="flex-row items-center">
                  <Check size={14} color="#FF6B35" strokeWidth={2.5} />
                  <Text className="text-[13px] text-neutral-700 dark:text-neutral-300 ml-2">
                    <Text className="font-bold">外观与壁纸定制：</Text>深浅/Auto模式、自定义全局磨砂背景
                  </Text>
                </View>

                <View className="flex-row items-center">
                  <Check size={14} color="#FF6B35" strokeWidth={2.5} />
                  <Text className="text-[13px] text-neutral-700 dark:text-neutral-300 ml-2">
                    <Text className="font-bold">完全离线免登录：</Text>毫秒级本地响应，安全无任何云端依赖
                  </Text>
                </View>
              </View>
            </View>

            {/* 开源说明 */}
            <View className="bg-white dark:bg-[#1C1C1E] p-4.5 rounded-2xl mb-6 border border-black/[0.04] dark:border-white/[0.06]">
              <Text className="text-[15px] font-bold text-neutral-900 dark:text-white mb-1.5">
                技术栈与致谢
              </Text>
              <Text className="text-[12px] leading-5 text-neutral-500 dark:text-neutral-400">
                本应用基于 Expo SDK 57、React Native 与 SQLite 打造。遵循 MIT 开源协议。祝您每一餐都能吃得开心、吃得丰盛！
              </Text>
            </View>

            <Pressable
              onPress={() => setAboutModalVisible(false)}
              className="w-full bg-[#FF6B35] py-3.5 rounded-2xl items-center justify-center mb-6 active:scale-[0.99]"
            >
              <Text className="text-white font-bold text-[16px]">关闭</Text>
            </Pressable>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
