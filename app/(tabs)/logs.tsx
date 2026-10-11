import React, { useState, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  Pressable, 
  Image, 
  Modal, 
  Alert 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  Calendar, 
  X, 
  Trash2, 
  Check, 
  ListChecks, 
  Utensils, 
  BookOpen
} from 'lucide-react-native';
import { useFocusEffect } from 'expo-router';

import { useLogStore } from '@/store/useLogStore';
import { type DailyLog } from '@/database/types';
import { getSetting, setSetting } from '@/database';
import { GlobalBackground } from '@/components/GlobalBackground';

interface DayIngredientItem {
  key: string;
  dishId: string;
  name: string;
  amount: string;
  dishName: string;
}

/** 友好日期格式化工具 */
function getFriendlyDate(dateString: string): { title: string; subtitle: string; isToday: boolean } {
  try {
    const [y, m, d] = dateString.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const today = new Date();
    const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const weekday = weekdays[dateObj.getDay()] || '';

    const isToday = dateString === todayString;
    const isYesterday = (() => {
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const yStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
      return dateString === yStr;
    })();

    let badge = weekday;
    if (isToday) badge = `今天 · ${weekday}`;
    else if (isYesterday) badge = `昨天 · ${weekday}`;

    return {
      title: `${m}月${d}日`,
      subtitle: `${dateString} · ${badge}`,
      isToday,
    };
  } catch {
    return { title: dateString, subtitle: '', isToday: false };
  }
}

export default function LogsScreen() {
  const insets = useSafeAreaInsets();
  const { logs, loadAllLogs, removeLog } = useLogStore();
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [highlightDate, setHighlightDate] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const dateLayouts = useRef<{ [date: string]: number }>({});

  // 记录各日期下食材勾选状态 (持久化同步)
  const [checkedMap, setCheckedMap] = useState<Record<string, Record<string, boolean>>>({});

  // 加载并初始化勾选状态
  const loadCheckedStatusForDates = useCallback((dates: string[]) => {
    const map: Record<string, Record<string, boolean>> = {};
    for (const date of dates) {
      try {
        const raw = getSetting(`checked_ing_${date}`, '{}');
        map[date] = JSON.parse(raw);
      } catch {
        map[date] = {};
      }
    }
    setCheckedMap(map);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAllLogs();
    }, [loadAllLogs])
  );

  // 按日期归类日志
  const groupedLogs = logs.reduce((acc, log) => {
    if (!acc[log.dateString]) {
      acc[log.dateString] = [];
    }
    acc[log.dateString].push(log);
    return acc;
  }, {} as Record<string, DailyLog[]>);

  // 按日期倒序排列
  const sortedDates = Object.keys(groupedLogs).sort((a, b) => b.localeCompare(a));

  // 提取日期变更时同步加载勾选数据
  useFocusEffect(
    useCallback(() => {
      if (sortedDates.length > 0) {
        loadCheckedStatusForDates(sortedDates);
      }
    }, [sortedDates, loadCheckedStatusForDates])
  );

  // 切换单个食材勾选状态
  const handleToggleIngredient = (date: string, itemKey: string) => {
    setCheckedMap((prev) => {
      const currentForDate = prev[date] || {};
      const nextForDate = {
        ...currentForDate,
        [itemKey]: !currentForDate[itemKey],
      };
      setSetting(`checked_ing_${date}`, JSON.stringify(nextForDate));
      return {
        ...prev,
        [date]: nextForDate,
      };
    });
  };

  // 一键切换当天全部食材勾选
  const handleToggleAllIngredients = (date: string, allKeys: string[], shouldCheckAll: boolean) => {
    setCheckedMap((prev) => {
      const nextForDate: Record<string, boolean> = {};
      for (const k of allKeys) {
        nextForDate[k] = shouldCheckAll;
      }
      setSetting(`checked_ing_${date}`, JSON.stringify(nextForDate));
      return {
        ...prev,
        [date]: nextForDate,
      };
    });
  };

  const handleDateSelect = (date: string) => {
    setSearchModalVisible(false);
    setHighlightDate(date);
    
    const yOffset = dateLayouts.current[date];
    if (yOffset !== undefined && scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: yOffset, animated: true });
    }
    
    setTimeout(() => {
      setHighlightDate(null);
    }, 2000);
  };

  const handleDeleteLog = (id: string, dishName: string) => {
    Alert.alert('确认删除', `确定要从日志中移除「${dishName}」吗？`, [
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
      <GlobalBackground />
      <ScrollView
        ref={scrollViewRef}
        className="flex-1"
        contentContainerStyle={{ 
          paddingTop: insets.top + 20, 
          paddingHorizontal: 20,
          paddingBottom: 120 
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-[34px] font-extrabold text-neutral-900 dark:text-white mb-6 tracking-tight">
          菜品日志
        </Text>
        
        {sortedDates.length === 0 ? (
          <View className="items-center justify-center mt-20">
            <View className="w-16 h-16 rounded-3xl bg-neutral-200/60 dark:bg-neutral-800 items-center justify-center mb-3.5">
              <Calendar size={32} color="#8E8E93" />
            </View>
            <Text className="text-[17px] font-bold text-neutral-800 dark:text-neutral-200">暂无日志记录</Text>
            <Text className="text-[13px] text-neutral-400 mt-1">在「今天吃什么」抽签后点击加入今日即可记录</Text>
          </View>
        ) : (
          sortedDates.map((date) => {
            const isHighlighted = highlightDate === date;
            const dayLogs = groupedLogs[date] || [];
            const { title, subtitle, isToday } = getFriendlyDate(date);

            // 聚合当天所有菜品的食材清单
            const dayIngredients: DayIngredientItem[] = [];
            dayLogs.forEach((log) => {
              const dishName = log.dish?.name || '未知菜品';
              const ings = log.dish?.ingredients || [];
              ings.forEach((ing, idx) => {
                const rawAmount = (ing.amount || '').trim();
                const isModerate = rawAmount === '适量' || rawAmount === '（适量）' || rawAmount === '(适量)';
                dayIngredients.push({
                  key: `${log.dishId}_${idx}_${ing.name}`,
                  dishId: log.dishId,
                  name: ing.name,
                  amount: isModerate ? '' : rawAmount,
                  dishName,
                });
              });
            });

            const currentChecked = checkedMap[date] || {};
            const totalIngCount = dayIngredients.length;
            const checkedIngCount = dayIngredients.filter((i) => !!currentChecked[i.key]).length;
            const isAllChecked = totalIngCount > 0 && checkedIngCount === totalIngCount;
            const allIngKeys = dayIngredients.map((i) => i.key);

            return (
              <View 
                key={date} 
                className={`rounded-[24px] overflow-hidden mb-6 bg-white dark:bg-[#1C1C1E] border ${
                  isHighlighted 
                    ? 'border-[#FF6B35] ring-2 ring-orange-500/20' 
                    : 'border-black/[0.04] dark:border-white/[0.06]'
                } shadow-sm`}
                onLayout={(e) => {
                  dateLayouts.current[date] = e.nativeEvent.layout.y;
                }}
              >
                {/* ─── 模块卡片顶栏：日期展示 ─── */}
                <View className={`flex-row items-center justify-between px-4 py-3.5 border-b border-black/[0.04] dark:border-white/[0.06] ${
                  isToday 
                    ? 'bg-orange-50/70 dark:bg-orange-950/30' 
                    : 'bg-neutral-50/70 dark:bg-[#232326]'
                }`}>
                  <View className="flex-row items-center">
                    <View className={`w-8 h-8 rounded-lg items-center justify-center mr-2.5 ${
                      isToday ? 'bg-[#FF6B35]' : 'bg-neutral-200 dark:bg-neutral-700'
                    }`}>
                      <Calendar size={16} color={isToday ? '#FFF' : '#8E8E93'} />
                    </View>
                    <View>
                      <View className="flex-row items-center">
                        <Text className={`text-[17px] font-extrabold ${
                          isToday 
                            ? 'text-[#FF6B35]' 
                            : 'text-neutral-900 dark:text-white'
                        }`}>
                          {title}
                        </Text>
                        {isToday && (
                          <View className="ml-2 bg-[#FF6B35] px-2 py-0.5 rounded-full">
                            <Text className="text-[10px] font-bold text-white">今日</Text>
                          </View>
                        )}
                      </View>
                      <Text className="text-[11px] text-neutral-400 dark:text-neutral-500 font-medium mt-0.5">
                        {subtitle}
                      </Text>
                    </View>
                  </View>

                  <View className="bg-neutral-100 dark:bg-neutral-800 px-2.5 py-1 rounded-full">
                    <Text className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400">
                      {dayLogs.length} 道菜品
                    </Text>
                  </View>
                </View>

                {/* ─── 模块上部：待买原料与食材清单 (可打勾、清单字体) ─── */}
                <View className="p-4 bg-orange-50/20 dark:bg-orange-950/10">
                  <View className="flex-row items-center justify-between mb-2.5">
                    <View className="flex-row items-center">
                      <ListChecks size={15} color="#FF6B35" strokeWidth={2.2} />
                      <Text className="text-[13px] font-bold text-neutral-500 dark:text-neutral-400 tracking-wider ml-1.5">
                        待买食材与原料
                      </Text>
                      {totalIngCount > 0 && (
                        <Text className="text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 ml-2">
                          ({checkedIngCount}/{totalIngCount})
                        </Text>
                      )}
                    </View>

                    {/* 一键全选/清空快捷操作 */}
                    {totalIngCount > 0 && (
                      <Pressable
                        onPress={() => handleToggleAllIngredients(date, allIngKeys, !isAllChecked)}
                        hitSlop={8}
                        className="flex-row items-center bg-white dark:bg-neutral-800 px-2 py-0.5 rounded-md border border-black/[0.04] dark:border-white/[0.06] active:opacity-70"
                      >
                        <Text className="text-[11px] font-semibold text-[#FF6B35]">
                          {isAllChecked ? '取消全选' : '全部买齐'}
                        </Text>
                      </Pressable>
                    )}
                  </View>

                  {/* 食材条目列表 */}
                  {totalIngCount === 0 ? (
                    <View className="py-2.5 px-3 rounded-xl bg-white/70 dark:bg-neutral-800/40 border border-dashed border-neutral-200 dark:border-neutral-800">
                      <Text className="text-[12px] text-neutral-400 dark:text-neutral-500 font-normal text-center">
                        当天菜单菜品未录入食材清单
                      </Text>
                    </View>
                  ) : (
                    <View className="gap-1.5">
                      {dayIngredients.map((item) => {
                        const isChecked = !!currentChecked[item.key];

                        return (
                          <Pressable
                            key={item.key}
                            onPress={() => handleToggleIngredient(date, item.key)}
                            className={`flex-row items-center py-2 px-3 rounded-xl border transition-all ${
                              isChecked
                                ? 'bg-neutral-100/60 dark:bg-neutral-800/30 border-transparent opacity-65'
                                : 'bg-white dark:bg-[#252528] border-black/[0.04] dark:border-white/[0.06] shadow-sm'
                            } active:scale-[0.99]`}
                          >
                            {/* 方形圆角 Checkbox */}
                            <View className={`w-4 h-4 rounded-md items-center justify-center mr-2.5 border ${
                              isChecked
                                ? 'bg-[#FF6B35] border-[#FF6B35]'
                                : 'border-neutral-300 dark:border-neutral-600 bg-transparent'
                            }`}>
                              {isChecked && <Check size={11} color="#FFF" strokeWidth={3} />}
                            </View>

                            {/* 食材信息：清单风格中等字重，与下部菜名明显区分 */}
                            <View className="flex-1 flex-row items-center justify-between">
                              <View className="flex-row items-center flex-1 mr-2">
                                <Text
                                  numberOfLines={1}
                                  className={`text-[14px] font-medium tracking-wide ${
                                    isChecked
                                      ? 'line-through text-neutral-400 dark:text-neutral-500'
                                      : 'text-neutral-800 dark:text-neutral-200'
                                  }`}
                                >
                                  {item.name}
                                </Text>
                                {item.amount && !['适量', '（适量）', '(适量)'].includes(item.amount.trim()) ? (
                                  <Text
                                    className={`text-[12px] ml-2 ${
                                      isChecked
                                        ? 'line-through text-neutral-400 dark:text-neutral-500'
                                        : 'text-[#FF6B35] dark:text-[#FF8F5E] font-semibold'
                                    }`}
                                  >
                                    {item.amount}
                                  </Text>
                                ) : null}
                              </View>

                              {/* 所属菜品标签 */}
                              <Text className="text-[11px] font-normal text-neutral-400 dark:text-neutral-500">
                                {item.dishName}
                              </Text>
                            </View>
                          </Pressable>
                        );
                      })}
                    </View>
                  )}
                </View>

                {/* ─── 分隔界线 ─── */}
                <View className="h-[1px] bg-black/[0.05] dark:bg-white/[0.06]" />

                {/* ─── 模块下部：菜品名称与卡片 (大号粗体排版) ─── */}
                <View className="p-4 bg-white dark:bg-[#1C1C1E]">
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center">
                      <Utensils size={15} color="#FF6B35" strokeWidth={2.2} />
                      <Text className="text-[13px] font-bold text-neutral-500 dark:text-neutral-400 tracking-wider ml-1.5">
                        安排菜品
                      </Text>
                    </View>
                    <Text className="text-[11px] text-neutral-400">
                      共 {dayLogs.length} 道
                    </Text>
                  </View>

                  <View className="gap-2.5">
                    {dayLogs.map((log) => {
                      const dishName = log.dish?.name || '未知菜品';

                      return (
                        <View 
                          key={log.id} 
                          className="bg-neutral-50/80 dark:bg-[#252528] rounded-2xl p-3 flex-row items-center border border-black/[0.03] dark:border-white/[0.04]"
                        >
                          {/* 菜品缩略图 */}
                          <View className="w-14 h-14 rounded-xl bg-neutral-200 dark:bg-neutral-800 overflow-hidden mr-3.5">
                            {log.dish?.imageUri ? (
                              <Image 
                                source={{ uri: log.dish.imageUri }} 
                                className="w-full h-full" 
                                resizeMode="cover"
                              />
                            ) : (
                              <View className="w-full h-full items-center justify-center bg-neutral-100 dark:bg-neutral-800">
                                <BookOpen size={18} color="#C7C7CC" />
                              </View>
                            )}
                          </View>

                          {/* 菜品信息：大号特粗标题排版 */}
                          <View className="flex-1 mr-2">
                            <Text 
                              numberOfLines={1}
                              className="text-[18px] font-black text-neutral-900 dark:text-white tracking-tight mb-1"
                            >
                              {dishName}
                            </Text>

                            <View className="flex-row items-center">
                              {/* 分类徽标 */}
                              <View className="bg-orange-50 dark:bg-orange-950/40 px-2 py-0.5 rounded-md mr-2">
                                <Text className="text-[11px] font-bold text-[#FF6B35]">
                                  {log.mealType}
                                </Text>
                              </View>

                              {/* 价格 */}
                              {log.dish?.price !== null && log.dish?.price !== undefined && (
                                <Text className="text-[12px] font-bold text-neutral-500 dark:text-neutral-400">
                                  ¥{log.dish.price}
                                </Text>
                              )}
                            </View>
                          </View>

                          {/* 删除操作 */}
                          <Pressable 
                            onPress={() => handleDeleteLog(log.id, dishName)}
                            className="p-2 rounded-xl bg-red-50 dark:bg-red-950/30 active:opacity-70"
                          >
                            <Trash2 size={16} color="#EF4444" />
                          </Pressable>
                        </View>
                      );
                    })}
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* 浮动日期跳转按钮 */}
      {sortedDates.length > 0 && (
        <Pressable
          onPress={() => setSearchModalVisible(true)}
          className="absolute bottom-6 right-6 w-14 h-14 bg-[#FF6B35] rounded-full items-center justify-center shadow-lg active:scale-95"
          style={{ elevation: 5, shadowColor: '#FF6B35', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } }}
        >
          <Calendar size={24} color="#FFF" />
        </Pressable>
      )}

      {/* 日期选择弹层 */}
      <Modal visible={searchModalVisible} transparent animationType="fade">
        <View className="flex-1 bg-black/40 justify-center items-center px-6">
          <View className="bg-white dark:bg-[#1C1C1E] w-full max-h-[70%] rounded-[24px] overflow-hidden">
            <View className="flex-row items-center justify-between p-5 border-b border-black/[0.05] dark:border-white/[0.05]">
              <Text className="text-[17px] font-bold text-neutral-900 dark:text-white">快速跳转日期</Text>
              <Pressable onPress={() => setSearchModalVisible(false)} className="p-1">
                <X size={20} color="#8E8E93" />
              </Pressable>
            </View>
            <ScrollView className="p-4">
              {sortedDates.map((date) => {
                const { title, subtitle } = getFriendlyDate(date);
                const count = (groupedLogs[date] || []).length;
                return (
                  <Pressable
                    key={date}
                    onPress={() => handleDateSelect(date)}
                    className="py-3 px-3 rounded-xl border-b border-black/[0.03] dark:border-white/[0.03] flex-row items-center justify-between active:bg-neutral-100 dark:active:bg-[#2C2C2E]"
                  >
                    <View>
                      <Text className="text-[16px] text-neutral-800 dark:text-neutral-200 font-bold">
                        {title}
                      </Text>
                      <Text className="text-[11px] text-neutral-400 mt-0.5">
                        {subtitle}
                      </Text>
                    </View>
                    <View className="bg-orange-50 dark:bg-orange-950/40 px-2.5 py-1 rounded-full">
                      <Text className="text-[11px] font-bold text-[#FF6B35]">
                        {count} 道菜
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
