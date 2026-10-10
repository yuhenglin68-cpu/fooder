/**
 * Zustand 全局状态管理 — 菜品数据 store
 *
 * 作为 SQLite 数据库与 UI 之间的前端缓存与响应式桥接层，避免每次渲染都查库。
 */

import { create } from 'zustand';
import {
  Dish,
  CreateDishInput,
  UpdateDishInput,
  DishCategory,
} from '@/database/types';
import {
  getAllDishes,
  getDishById,
  insertDish,
  updateDish as dbUpdateDish,
  deleteDish as dbDeleteDish,
  searchDishes,
  getRandomDishes,
  getDishCount,
} from '@/database';
import { deleteImageFromSandbox } from '@/utils/fileManager';

export interface DishState {
  /** 缓存的菜品列表 */
  dishes: Dish[];
  /** 菜品总数 */
  totalCount: number;
  /** 当前筛选分类（null 表示全部） */
  activeCategory: DishCategory | null;
  /** 当前搜索关键字 */
  searchKeyword: string;
  /** 是否正在加载 */
  isLoading: boolean;

  // ── Actions ──────────────────────────────

  /**
   * 从 SQLite 数据库读取菜品列表并更新 store 状态
   * @param category 可选分类筛选，不传则使用当前选中的分类
   */
  loadDishes: (category?: DishCategory | null) => void;

  /**
   * 新增菜品：先持久化至 SQLite，成功后刷新前端缓存状态
   * @param input 新建菜品输入参数
   */
  addNewDish: (input: CreateDishInput) => Dish;

  /** 别名兼容 */
  addDish: (input: CreateDishInput) => Dish;

  /**
   * 删除菜品：从 SQLite 删除，并同步清理沙盒永久目录中的图片文件，最后刷新状态
   * @param id 菜品 ID
   */
  removeDish: (id: string) => boolean;

  /**
   * 更新菜品信息
   */
  updateDish: (id: string, input: UpdateDishInput) => Dish | null;

  /**
   * 搜索菜品（名称 / 标签）
   */
  search: (keyword: string) => void;

  /**
   * 随机抽取菜品
   */
  pickRandom: (count?: number) => Dish[];

  /**
   * 刷新菜品总数
   */
  refreshCount: () => void;

  /**
   * 切换当前分类
   */
  setCategory: (category: DishCategory | null) => void;
}

export const useDishStore = create<DishState>((set, get) => ({
  dishes: [],
  totalCount: 0,
  activeCategory: null,
  searchKeyword: '',
  isLoading: false,

  loadDishes: (category?: DishCategory | null) => {
    set({ isLoading: true });
    try {
      const cat = category !== undefined ? category : get().activeCategory;
      const dishes = getAllDishes(cat ?? undefined);
      set({
        dishes,
        activeCategory: cat ?? null,
        searchKeyword: '',
        totalCount: getDishCount(),
        isLoading: false,
      });
    } catch (error) {
      console.error('[useDishStore] 加载菜谱失败:', error);
      set({ isLoading: false });
    }
  },

  addNewDish: (input: CreateDishInput) => {
    const dish = insertDish(input);
    // 插入成功后立即刷新前端缓存
    get().loadDishes();
    return dish;
  },

  addDish: (input: CreateDishInput) => {
    return get().addNewDish(input);
  },

  removeDish: (id: string) => {
    // 1. 查找待删除菜品并清理本地沙盒图片文件
    const currentList = get().dishes;
    const targetDish = currentList.find((d) => d.id === id) ?? getDishById(id);
    if (targetDish?.imageUri) {
      try {
        deleteImageFromSandbox(targetDish.imageUri);
      } catch (err) {
        console.warn('[useDishStore] 清理沙盒本地图片失败:', err);
      }
    }

    // 2. 从 SQLite 数据库删除行记录
    const success = dbDeleteDish(id);

    // 3. 刷新前端状态
    if (success) {
      get().loadDishes();
    }
    return success;
  },

  updateDish: (id: string, input: UpdateDishInput) => {
    const dish = dbUpdateDish(id, input);
    if (dish) {
      get().loadDishes();
    }
    return dish;
  },

  search: (keyword: string) => {
    const trimmed = keyword.trim();
    if (!trimmed) {
      get().loadDishes();
      return;
    }
    const dishes = searchDishes(trimmed);
    set({ dishes, searchKeyword: trimmed });
  },

  pickRandom: (count: number = 1) => {
    return getRandomDishes(count);
  },

  refreshCount: () => {
    set({ totalCount: getDishCount() });
  },

  setCategory: (category: DishCategory | null) => {
    get().loadDishes(category);
  },
}));
