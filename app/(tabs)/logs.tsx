import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ScrollView, Pressable, Image, Modal, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Calendar, X, Trash2 } from 'lucide-react-native';
import { useFocusEffect } from 'expo-router';
import { useLogStore } from '@/store/useLogStore';
import { DailyLog } from '@/database/types';

export default function LogsScreen() {
  const insets = useSafeAreaInsets();
  const { logs, loadAllLogs, removeLog } = useLogStore();
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [highlightDate, setHighlightDate] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const dateLayouts = useRef<{ [date: string]: number }>({});

  useEffect(() => {
    const unsubscribe = useLogStore.subscribe((state, prevState) => {
      // Just keep track or you can loadAllLogs on focus.
    });
    return unsubscribe;
  }, []);

  // React Navigation useFocusEffect is better to reload data
  useFocusEffect(
    React.useCallback(() => {
      loadAllLogs();
    }, [loadAllLogs])
  );

  // Group logs by date
  const groupedLogs = logs.reduce((acc, log) => {
    if (!acc[log.dateString]) {
      acc[log.dateString] = [];
    }
    acc[log.dateString].push(log);
    return acc;
  }, {} as Record<string, DailyLog[]>);

  // Sort dates descending
  const sortedDates = Object.keys(groupedLogs).sort((a, b) => b.localeCompare(a));

  const handleDateSelect = (date: string) => {
    setSearchModalVisible(false);
    setHighlightDate(date);
    
    // Scroll to the selected date
    const yOffset = dateLayouts.current[date];
    if (yOffset !== undefined && scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: yOffset, animated: true });
    }
    
    // Remove highlight after 2 seconds
    setTimeout(() => {
      setHighlightDate(null);
    }, 2000);
  };

  const handleDeleteLog = (id: string) => {
    Alert.alert('确认删除', '确定要从日志中移除该记录吗？', [
      { text: '取消', style: 'cancel' },
      { 
        text: '删除', 
        style: 'destructive',
        onPress: () => removeLog(id)
      }
    ]);
  };

  return (
    <View className="flex-1 bg-[#F2F2F7] dark:bg-[#000000]">
      <ScrollView
        ref={scrollViewRef}
        className="flex-1"
        contentContainerStyle={{ 
          paddingTop: insets.top + 20, 
          paddingHorizontal: 20,
          paddingBottom: 100 
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-[34px] font-extrabold text-neutral-900 dark:text-white mb-6 tracking-tight">
          菜品日志
        </Text>
        
        {sortedDates.length === 0 ? (
          <View className="items-center justify-center mt-20">
            <Calendar size={48} color="#C7C7CC" />
            <Text className="text-neutral-500 mt-4 text-base">暂无日志记录</Text>
          </View>
        ) : (
          sortedDates.map(date => {
            const isHighlighted = highlightDate === date;
            return (
              <View 
                key={date} 
                className="mb-8"
                onLayout={(e) => {
                  dateLayouts.current[date] = e.nativeEvent.layout.y;
                }}
              >
                <Text 
                  className={`text-[20px] font-bold mb-3 transition-colors ${
                    isHighlighted ? 'text-[#FF6B35]' : 'text-neutral-900 dark:text-white'
                  }`}
                >
                  {date}
                </Text>
                
                {groupedLogs[date].map((log) => (
                  <View 
                    key={log.id} 
                    className={`bg-white dark:bg-[#1C1C1E] rounded-2xl p-4 mb-3 flex-row items-center border ${
                      isHighlighted ? 'border-[#FF6B35]' : 'border-transparent'
                    }`}
                  >
                    <View className="w-16 h-16 rounded-xl bg-neutral-100 dark:bg-neutral-800 overflow-hidden mr-4">
                      {log.dish?.imageUri ? (
                        <Image source={{ uri: log.dish.imageUri }} className="w-full h-full" />
                      ) : (
                        <View className="w-full h-full items-center justify-center bg-neutral-200 dark:bg-neutral-700">
                          <Text className="text-neutral-400 font-bold text-xs">无图</Text>
                        </View>
                      )}
                    </View>
                    <View className="flex-1">
                      <Text className="text-[17px] font-bold text-neutral-900 dark:text-white mb-1">
                        {log.dish?.name || '未知菜品'}
                      </Text>
                      <Text className="text-[13px] text-neutral-500 dark:text-neutral-400">
                        {log.mealType}
                      </Text>
                    </View>
                    <Pressable 
                      onPress={() => handleDeleteLog(log.id)}
                      className="p-2"
                    >
                      <Trash2 size={18} color="#FF3B30" />
                    </Pressable>
                  </View>
                ))}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Floating Action Button */}
      {sortedDates.length > 0 && (
        <Pressable
          onPress={() => setSearchModalVisible(true)}
          className="absolute bottom-6 right-6 w-14 h-14 bg-[#FF6B35] rounded-full items-center justify-center shadow-lg active:scale-95"
          style={{ elevation: 5, shadowColor: '#FF6B35', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } }}
        >
          <Calendar size={24} color="#FFF" />
        </Pressable>
      )}

      {/* 日期查找 Modal */}
      <Modal visible={searchModalVisible} transparent animationType="fade">
        <View className="flex-1 bg-black/40 justify-center items-center px-6">
          <View className="bg-white dark:bg-[#1C1C1E] w-full max-h-[70%] rounded-[24px] overflow-hidden">
            <View className="flex-row items-center justify-between p-5 border-b border-black/[0.05] dark:border-white/[0.05]">
              <Text className="text-[17px] font-bold text-neutral-900 dark:text-white">选择日期</Text>
              <Pressable onPress={() => setSearchModalVisible(false)} className="p-1">
                <X size={20} color="#8E8E93" />
              </Pressable>
            </View>
            <ScrollView className="p-4">
              {sortedDates.map(date => (
                <Pressable
                  key={date}
                  onPress={() => handleDateSelect(date)}
                  className="py-4 border-b border-black/[0.03] dark:border-white/[0.03]"
                >
                  <Text className="text-[16px] text-neutral-800 dark:text-neutral-200 text-center font-medium">
                    {date}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
