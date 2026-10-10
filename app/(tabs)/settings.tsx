/**
 * 「设置」页面
 *
 * Apple HIG Inset Grouped List 设计原则：
 * 1. 布局：大圆角独立卡片式列表 (Inset Grouped)
 * 2. 元素组合：左侧纯色圆角方块图标，右侧标题与辅助箭头
 * 3. 颜色：系统背景色 #F2F2F7 (Dark: #000000)，卡片色 #FFFFFF (Dark: #1C1C1E)
 */

import React from 'react';
import { View, Text, ScrollView, Pressable, Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  UploadCloud, 
  DownloadCloud, 
  ShieldCheck, 
  Info,
  ChevronRight,
  Trash2
} from 'lucide-react-native';

import { useColorScheme } from '@/components/useColorScheme';
import { clearDatabase } from '@/database';
import { useDishStore } from '@/store/useDishStore';

import { exportDishes, pickAndImportDishes } from '@/utils/syncManager';

const SettingsItem = ({ 
  icon, 
  iconBg, 
  title, 
  onPress, 
  isLast = false,
  isDestructive = false
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  onPress: () => void;
  isLast?: boolean;
  isDestructive?: boolean;
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
      <ChevronRight size={18} color="#C7C7CC" />
    </View>
  </Pressable>
);

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const { loadDishes, dishes } = useDishStore();

  const handleExport = async () => {
    if (dishes.length === 0) {
      Alert.alert('提示', '当前菜谱库为空，没有可以导出的数据。');
      return;
    }
    await exportDishes(dishes);
  };

  const handleImport = async () => {
    await pickAndImportDishes();
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
              await loadDishes(); // 刷新状态
              Alert.alert('成功', '菜谱数据已清空');
            } catch (error) {
              Alert.alert('错误', '清空失败');
            }
          }
        }
      ]
    );
  };

  return (
    <ScrollView 
      className="flex-1 bg-[#F2F2F7] dark:bg-[#000000]"
      contentContainerStyle={{ 
        paddingTop: insets.top + 20, 
        paddingHorizontal: 20,
        paddingBottom: 100 
      }}
      showsVerticalScrollIndicator={false}
    >
      <Text className="text-[34px] font-extrabold text-neutral-900 dark:text-white mb-6">
        设置
      </Text>

      {/* 数据同步与管理 */}
      <View className="mb-8">
        <Text className="text-[13px] font-bold text-neutral-500 uppercase tracking-wider mb-2 ml-4">
          数据管理
        </Text>
        <View className="rounded-[22px] overflow-hidden border border-black/[0.02] dark:border-white/[0.04]">
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

      {/* 关于 */}
      <View className="mb-8">
        <Text className="text-[13px] font-bold text-neutral-500 uppercase tracking-wider mb-2 ml-4">
          关于
        </Text>
        <View className="rounded-[22px] overflow-hidden border border-black/[0.02] dark:border-white/[0.04]">
          <SettingsItem 
            title="隐私政策" 
            icon={<ShieldCheck size={16} color="#FFF" />} 
            iconBg="bg-indigo-500" 
            onPress={() => {}} 
          />
          <SettingsItem 
            title="关于 Fooder" 
            icon={<Info size={16} color="#FFF" />} 
            iconBg="bg-gray-500" 
            onPress={() => {}} 
            isLast
          />
        </View>
      </View>
      
      {/* 底部信息 */}
      <View className="items-center mt-10 opacity-50">
        <Text className="text-xs text-neutral-500 dark:text-neutral-400 font-bold tracking-widest">FOODER</Text>
        <Text className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-1">版本 1.0.0 · 纯本地版</Text>
      </View>
    </ScrollView>
  );
}
