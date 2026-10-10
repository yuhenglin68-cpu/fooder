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
