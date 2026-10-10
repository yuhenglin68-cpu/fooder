/**
 * 核心类型定义 —— 菜品数据模型
 */

/** 菜品分类枚举 */
export type DishCategory =
  | '主食'
  | '热炒'
  | '汤羹'
  | '凉菜'
  | '甜点'
  | '小吃'
  | '饮品'
  | '其他';

export type MealType = '早餐' | '饮品' | '肉类' | '素类' | '汤类' | '其它';

/** 所有可用分类常量 */
export const DISH_CATEGORIES: DishCategory[] = [
  '主食',
  '热炒',
  '汤羹',
  '凉菜',
  '甜点',
  '小吃',
  '饮品',
  '其他',
];

/** 单条食材 */
export interface Ingredient {
  name: string;
  amount: string; // e.g. "200g", "2勺", "适量"
}

/** 数据库行 —— dishes 表原始结构 */
export interface DishRow {
  id: string;
  name: string;
  image_uri: string | null;
  category: DishCategory;
  tags: string; // 逗号分隔
  price: number | null;
  ingredients: string; // JSON 字符串
  steps: string;
  created_at: number; // Unix 时间戳 (ms)
}

/** 应用层菜品对象（已解析） */
export interface Dish {
  id: string;
  name: string;
  imageUri: string | null;
  category: DishCategory;
  tags: string[];
  price: number | null;
  ingredients: Ingredient[];
  steps: string;
  createdAt: number;
}

/** 创建菜品时的输入 DTO */
export interface CreateDishInput {
  name: string;
  imageUri?: string | null;
  category: DishCategory;
  tags?: string[];
  price?: number | null;
  ingredients?: Ingredient[];
  steps?: string;
}

/** 更新菜品时的输入 DTO（所有字段可选） */
export interface UpdateDishInput {
  name?: string;
  imageUri?: string | null;
  category?: DishCategory;
  tags?: string[];
  price?: number | null;
  ingredients?: Ingredient[];
  steps?: string;
}

/** 每日菜品日志行 */
export interface DailyLogRow {
  id: string;
  date_string: string;
  dish_id: string;
  meal_type: string;
  created_at: number;
}

/** 应用层每日菜品日志 */
export interface DailyLog {
  id: string;
  dateString: string;
  dishId: string;
  mealType: string; // MealType 强转
  createdAt: number;
  dish?: Dish; // 级联查询的菜品详情
}

export interface CreateDailyLogInput {
  dateString: string;
  dishId: string;
  mealType: string;
}

// ─── 行 ↔ 应用对象转换工具 ────────────────────────────────

/** 将数据库行转换为应用层对象 */
export function rowToDish(row: DishRow): Dish {
  let parsedIngredients: Ingredient[] = [];
  try {
    parsedIngredients = JSON.parse(row.ingredients || '[]');
  } catch {
    parsedIngredients = [];
  }

  return {
    id: row.id,
    name: row.name,
    imageUri: row.image_uri,
    category: row.category,
    tags: row.tags ? row.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
    price: row.price,
    ingredients: parsedIngredients,
    steps: row.steps || '',
    createdAt: row.created_at,
  };
}

/** 将数据库行转换为应用层日志对象 */
export function rowToDailyLog(row: DailyLogRow, dish?: Dish): DailyLog {
  return {
    id: row.id,
    dateString: row.date_string,
    dishId: row.dish_id,
    mealType: row.meal_type,
    createdAt: row.created_at,
    dish,
  };
}
