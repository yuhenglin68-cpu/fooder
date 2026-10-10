/**
 * 本地数据库引擎 —— 基于 expo-sqlite
 *
 * 设计原则：
 * 1. 单例模式：全局共享同一个数据库连接
 * 2. 同步 API（expo-sqlite v14+ 支持同步 execSync / getFirstSync 等）
 * 3. 所有数据库操作集中在此模块，对外暴露类型安全的函数
 */

import * as SQLite from 'expo-sqlite';
import {
  CreateDishInput,
  Dish,
  DishRow,
  UpdateDishInput,
  rowToDish,
  DailyLog,
  DailyLogRow,
  CreateDailyLogInput,
  rowToDailyLog,
  MealType,
} from './types';

// ─── 数据库连接单例 ─────────────────────────────────────────

const DB_NAME = 'fooder.db';

let _db: SQLite.SQLiteDatabase | null = null;

/** 获取数据库连接（懒初始化） */
export function getDatabase(): SQLite.SQLiteDatabase {
  if (!_db) {
    _db = SQLite.openDatabaseSync(DB_NAME);
    _initializeDatabase(_db);
  }
  return _db;
}

// ─── 建表与迁移 ─────────────────────────────────────────────

function _initializeDatabase(db: SQLite.SQLiteDatabase): void {
  // 开启 WAL 模式以提升并发写入性能
  db.execSync('PRAGMA journal_mode = WAL;');

  db.execSync(`
    CREATE TABLE IF NOT EXISTS dishes (
      id          TEXT PRIMARY KEY NOT NULL,
      name        TEXT NOT NULL,
      image_uri   TEXT,
      category    TEXT NOT NULL DEFAULT '其他',
      tags        TEXT NOT NULL DEFAULT '',
      price       REAL,
      ingredients TEXT NOT NULL DEFAULT '[]',
      steps       TEXT NOT NULL DEFAULT '',
      created_at  INTEGER NOT NULL
    );
  `);

  // 为按分类检索创建索引
  db.execSync(`
    CREATE INDEX IF NOT EXISTS idx_dishes_category ON dishes(category);
  `);

  // 创建每日菜品日志表
  db.execSync(`
    CREATE TABLE IF NOT EXISTS daily_logs (
      id          TEXT PRIMARY KEY NOT NULL,
      date_string TEXT NOT NULL,
      dish_id     TEXT NOT NULL,
      meal_type   TEXT NOT NULL,
      created_at  INTEGER NOT NULL,
      FOREIGN KEY(dish_id) REFERENCES dishes(id) ON DELETE CASCADE
    );
  `);
  
  db.execSync(`
    CREATE INDEX IF NOT EXISTS idx_daily_logs_date ON daily_logs(date_string);
  `);
}

// ─── 唯一 ID 生成 ───────────────────────────────────────────

/** 生成基于时间戳 + 随机数的短唯一 ID */
function generateId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}`;
}

// ─── CRUD 操作 ───────────────────────────────────────────────

/** 插入一道新菜 */
export function insertDish(input: CreateDishInput): Dish {
  const db = getDatabase();
  const id = generateId();
  const now = Date.now();

  const row: DishRow = {
    id,
    name: input.name,
    image_uri: input.imageUri ?? null,
    category: input.category,
    tags: (input.tags ?? []).join(','),
    price: input.price ?? null,
    ingredients: JSON.stringify(input.ingredients ?? []),
    steps: input.steps ?? '',
    created_at: now,
  };

  db.runSync(
    `INSERT INTO dishes (id, name, image_uri, category, tags, price, ingredients, steps, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      row.id,
      row.name,
      row.image_uri,
      row.category,
      row.tags,
      row.price,
      row.ingredients,
      row.steps,
      row.created_at,
    ]
  );

  return rowToDish(row);
}

/** 根据 ID 查询单道菜 */
export function getDishById(id: string): Dish | null {
  const db = getDatabase();
  const row = db.getFirstSync<DishRow>(
    'SELECT * FROM dishes WHERE id = ?',
    [id]
  );
  return row ? rowToDish(row) : null;
}

/** 查询所有菜品（可选按分类过滤） */
export function getAllDishes(category?: string): Dish[] {
  const db = getDatabase();
  let rows: DishRow[];

  if (category) {
    rows = db.getAllSync<DishRow>(
      'SELECT * FROM dishes WHERE category = ? ORDER BY created_at DESC',
      [category]
    );
  } else {
    rows = db.getAllSync<DishRow>(
      'SELECT * FROM dishes ORDER BY created_at DESC'
    );
  }

  return rows.map(rowToDish);
}

/** 按关键词搜索菜品名称 / 标签 */
export function searchDishes(keyword: string): Dish[] {
  const db = getDatabase();
  const pattern = `%${keyword}%`;
  const rows = db.getAllSync<DishRow>(
    `SELECT * FROM dishes
     WHERE name LIKE ? OR tags LIKE ?
     ORDER BY created_at DESC`,
    [pattern, pattern]
  );
  return rows.map(rowToDish);
}

/** 随机抽取 N 道菜 */
export function getRandomDishes(count: number = 1): Dish[] {
  const db = getDatabase();
  const rows = db.getAllSync<DishRow>(
    'SELECT * FROM dishes ORDER BY RANDOM() LIMIT ?',
    [count]
  );
  return rows.map(rowToDish);
}

/** 按照餐点类型随机抽取菜品 */
export function getRandomDishesByMealType(mealType: MealType, count: number = 1): Dish[] {
  const db = getDatabase();
  let where = '';
  
  if (mealType === '早餐') {
    where = "WHERE category IN ('主食', '小吃', '甜点')";
  } else if (mealType === '饮品') {
    where = "WHERE category = '饮品'";
  } else if (mealType === '汤类') {
    where = "WHERE category = '汤羹'";
  } else if (mealType === '肉类') {
    where = "WHERE category = '热炒'";
  } else if (mealType === '素类') {
    where = "WHERE category = '凉菜'";
  } else {
    where = "WHERE category = '其他'";
  }

  let rows = db.getAllSync<DishRow>(
    `SELECT * FROM dishes ${where} ORDER BY RANDOM() LIMIT ?`,
    [count]
  );
  
  // 如果分类下没有菜，兜底全局随机
  if (rows.length === 0) {
    rows = db.getAllSync<DishRow>(
      'SELECT * FROM dishes ORDER BY RANDOM() LIMIT ?',
      [count]
    );
  }
  
  return rows.map(rowToDish);
}

/** 获取菜品总数 */
export function getDishCount(): number {
  const db = getDatabase();
  const result = db.getFirstSync<{ count: number }>(
    'SELECT COUNT(*) as count FROM dishes'
  );
  return result?.count ?? 0;
}

/** 更新指定菜品 */
export function updateDish(id: string, input: UpdateDishInput): Dish | null {
  const db = getDatabase();

  const existing = getDishById(id);
  if (!existing) return null;

  const updates: string[] = [];
  const values: (string | number | null)[] = [];

  if (input.name !== undefined) {
    updates.push('name = ?');
    values.push(input.name);
  }
  if (input.imageUri !== undefined) {
    updates.push('image_uri = ?');
    values.push(input.imageUri ?? null);
  }
  if (input.category !== undefined) {
    updates.push('category = ?');
    values.push(input.category);
  }
  if (input.tags !== undefined) {
    updates.push('tags = ?');
    values.push(input.tags.join(','));
  }
  if (input.price !== undefined) {
    updates.push('price = ?');
    values.push(input.price ?? null);
  }
  if (input.ingredients !== undefined) {
    updates.push('ingredients = ?');
    values.push(JSON.stringify(input.ingredients));
  }
  if (input.steps !== undefined) {
    updates.push('steps = ?');
    values.push(input.steps);
  }

  if (updates.length === 0) return existing;

  values.push(id);
  db.runSync(
    `UPDATE dishes SET ${updates.join(', ')} WHERE id = ?`,
    values
  );

  return getDishById(id);
}

/** 删除指定菜品 */
export function deleteDish(id: string): boolean {
  const db = getDatabase();
  const result = db.runSync('DELETE FROM dishes WHERE id = ?', [id]);
  return result.changes > 0;
}

/** 删除所有菜品（危险操作，仅供设置页重置使用） */
export function deleteAllDishes(): number {
  const db = getDatabase();
  const result = db.runSync('DELETE FROM dishes');
  return result.changes;
}

/** 批量导入并合并菜品（如果存在同名或同 ID，则覆盖更新） */
export function upsertDishes(dishes: Dish[]): void {
  const db = getDatabase();
  
  db.withTransactionSync(() => {
    for (const dish of dishes) {
      const existing = db.getFirstSync<DishRow>(
        'SELECT * FROM dishes WHERE id = ? OR name = ?',
        [dish.id || '', dish.name]
      );

      const id = existing ? existing.id : (dish.id || generateId());
      const createdAt = existing ? existing.created_at : Date.now();

      const row: DishRow = {
        id,
        name: dish.name,
        image_uri: dish.imageUri ?? null,
        category: dish.category,
        tags: (dish.tags ?? []).join(','),
        price: dish.price ?? null,
        ingredients: JSON.stringify(dish.ingredients ?? []),
        steps: dish.steps ?? '',
        created_at: createdAt,
      };

      if (existing) {
        db.runSync(
          `UPDATE dishes SET name = ?, image_uri = ?, category = ?, tags = ?, price = ?, ingredients = ?, steps = ? WHERE id = ?`,
          [
            row.name,
            row.image_uri,
            row.category,
            row.tags,
            row.price,
            row.ingredients,
            row.steps,
            row.id,
          ]
        );
      } else {
        db.runSync(
          `INSERT INTO dishes (id, name, image_uri, category, tags, price, ingredients, steps, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            row.id,
            row.name,
            row.image_uri,
            row.category,
            row.tags,
            row.price,
            row.ingredients,
            row.steps,
            row.created_at,
          ]
        );
      }
    }
  });
}

// ─── 每日日志 (Daily Logs) CRUD ────────────────────────────

export function getDailyLogsByDate(dateString: string): DailyLog[] {
  const db = getDatabase();
  const logs = db.getAllSync<DailyLogRow>(
    `SELECT * FROM daily_logs WHERE date_string = ? ORDER BY created_at ASC`,
    [dateString]
  );
  return logs.map((row) => {
    const dish = getDishById(row.dish_id);
    return rowToDailyLog(row, dish ?? undefined);
  });
}

export function getAllDailyLogs(): DailyLog[] {
  const db = getDatabase();
  const logs = db.getAllSync<DailyLogRow>(
    `SELECT * FROM daily_logs ORDER BY date_string DESC, created_at ASC`
  );
  return logs.map((row) => {
    const dish = getDishById(row.dish_id);
    return rowToDailyLog(row, dish ?? undefined);
  });
}

export function insertDailyLog(input: CreateDailyLogInput): DailyLog {
  const db = getDatabase();
  const id = generateId();
  const createdAt = Date.now();

  db.runSync(
    `INSERT INTO daily_logs (id, date_string, dish_id, meal_type, created_at) VALUES (?, ?, ?, ?, ?)`,
    [id, input.dateString, input.dishId, input.mealType, createdAt]
  );

  const row = db.getFirstSync<DailyLogRow>(
    `SELECT * FROM daily_logs WHERE id = ?`,
    [id]
  );
  
  if (!row) throw new Error('Insert daily log failed.');
  const dish = getDishById(row.dish_id);
  return rowToDailyLog(row, dish ?? undefined);
}

export function deleteDailyLog(id: string): boolean {
  const db = getDatabase();
  const result = db.runSync(`DELETE FROM daily_logs WHERE id = ?`, [id]);
  return result.changes > 0;
}

/**
 * 清空整个数据库
 */
export function clearDatabase(): void {
  const db = getDatabase();
  db.runSync(`DELETE FROM dishes;`);
}
