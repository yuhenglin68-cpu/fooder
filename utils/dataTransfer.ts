/**
 * fooder 离线数据包导出与导入模块
 *
 * 规范：
 * 1. 导出：将 SQLite 中的全部菜品元数据及沙盒本地图片（Base64 封装）打包为单个 .fooder 文件，
 *    通过系统原生分享面板 (expo-sharing) 支持微信、隔空投送、文件管理器保存等免翻墙离线传输。
 * 2. 导入：通过系统文件选取器 (expo-document-picker) 选择 .fooder 数据包，
 *    校验格式后将图片写入本地沙盒，将菜品数据合并入 SQLite 数据库并刷新 store。
 */

import { Paths, File, Directory } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { getAllDishes, getDatabase } from '@/database';
import { type Dish, rowToDish, type DishRow } from '@/database/types';
import { ensureImageDirectory } from '@/utils/fileManager';

/** .fooder 离线数据包结构定义 */
export interface FooderBackupPackage {
  version: '1.0';
  appName: 'fooder';
  exportedAt: number;
  dishCount: number;
  dishes: Array<
    Omit<Dish, 'imageUri'> & {
      imageFileName?: string | null;
      imageBase64?: string | null;
    }
  >;
}

/** 获取图片永久存储 Directory 实例 */
function getDishImagesDir(): Directory {
  return new Directory(Paths.document, 'dish_images');
}

/**
 * 导出全部菜品数据包为 .fooder 文件并唤起系统分享
 */
export async function exportDataPackage(): Promise<{ success: boolean; count: number; message: string }> {
  try {
    const dishes = getAllDishes();
    if (dishes.length === 0) {
      return { success: false, count: 0, message: '当前菜谱库为空，没有可导出的数据' };
    }

    const exportDishes: FooderBackupPackage['dishes'] = [];

    for (const dish of dishes) {
      let imageBase64: string | null = null;
      let imageFileName: string | null = null;

      if (dish.imageUri) {
        try {
          const imgFile = new File(dish.imageUri);
          if (imgFile.exists) {
            imageBase64 = await imgFile.base64();
            imageFileName = imgFile.name || `${dish.id}.jpg`;
          }
        } catch (err) {
          console.warn(`[exportData] 读取菜品图片失败 (${dish.name}):`, err);
        }
      }

      exportDishes.push({
        id: dish.id,
        name: dish.name,
        category: dish.category,
        tags: dish.tags,
        price: dish.price,
        ingredients: dish.ingredients,
        steps: dish.steps,
        createdAt: dish.createdAt,
        imageFileName,
        imageBase64,
      });
    }

    const backupData: FooderBackupPackage = {
      version: '1.0',
      appName: 'fooder',
      exportedAt: Date.now(),
      dishCount: exportDishes.length,
      dishes: exportDishes,
    };

    const jsonContent = JSON.stringify(backupData);

    // 将备份文件写入应用缓存目录
    const fileName = `fooder_backup_${Date.now()}.fooder`;
    const exportFile = new File(Paths.cache, fileName);
    if (!exportFile.exists) {
      exportFile.create();
    }
    exportFile.write(jsonContent);

    // 检查并唤起系统分享
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      return { success: false, count: dishes.length, message: '当前设备不支持系统分享功能' };
    }

    await Sharing.shareAsync(exportFile.uri, {
      mimeType: 'application/octet-stream',
      dialogTitle: '导出 fooder 菜谱数据包',
      UTI: 'com.fooder.datapackage',
    });

    return {
      success: true,
      count: dishes.length,
      message: `已打包导出 ${dishes.length} 道菜品`,
    };
  } catch (error) {
    console.error('[exportDataPackage] 导出失败:', error);
    throw error;
  }
}

/**
 * 从选取的 .fooder 文件导入菜谱数据并合并入库
 */
export async function importDataPackage(): Promise<{
  success: boolean;
  importedCount: number;
  totalInPackage: number;
  message: string;
}> {
  try {
    ensureImageDirectory();
    const imagesDir = getDishImagesDir();

    // 唤起系统文件选择器
    const pickResult = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      type: '*/*',
    });

    if (pickResult.canceled || !pickResult.assets || pickResult.assets.length === 0) {
      return { success: false, importedCount: 0, totalInPackage: 0, message: '用户取消选取' };
    }

    const pickedAsset = pickResult.assets[0];
    const pickedFile = new File(pickedAsset.uri);

    if (!pickedFile.exists) {
      return { success: false, importedCount: 0, totalInPackage: 0, message: '无法读取所选文件' };
    }

    const fileContent = await pickedFile.text();
    let parsed: FooderBackupPackage;

    try {
      parsed = JSON.parse(fileContent);
    } catch {
      return { success: false, importedCount: 0, totalInPackage: 0, message: '文件解析失败，不是有效的 fooder 数据包' };
    }

    if (parsed.appName !== 'fooder' || !Array.isArray(parsed.dishes)) {
      return { success: false, importedCount: 0, totalInPackage: 0, message: '文件格式不匹配，无法导入' };
    }

    const db = getDatabase();
    let importedCount = 0;

    for (const item of parsed.dishes) {
      if (!item.name || !item.category) continue;

      let localImageUri: string | null = null;

      // 如果数据包中包含图片的 base64 数据，恢复写入沙盒文件
      if (item.imageBase64) {
        try {
          const extension = item.imageFileName?.endsWith('.png') ? '.png' : '.jpg';
          const savedFileName = `import_${Date.now()}_${Math.random().toString(36).substring(2, 7)}${extension}`;
          const destImageFile = new File(imagesDir, savedFileName);

          if (!destImageFile.exists) {
            destImageFile.create();
          }
          destImageFile.write(item.imageBase64, { encoding: 'base64' });
          localImageUri = destImageFile.uri;
        } catch (err) {
          console.warn('[importData] 恢复图片文件失败:', err);
        }
      }

      const dishId = item.id || `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
      const createdAt = item.createdAt || Date.now();

      // 使用 INSERT OR REPLACE 避免重复插入冲突
      db.runSync(
        `INSERT OR REPLACE INTO dishes (id, name, image_uri, category, tags, price, ingredients, steps, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          dishId,
          item.name,
          localImageUri,
          item.category,
          (item.tags || []).join(','),
          item.price ?? null,
          JSON.stringify(item.ingredients || []),
          item.steps || '',
          createdAt,
        ]
      );

      importedCount++;
    }

    return {
      success: true,
      importedCount,
      totalInPackage: parsed.dishes.length,
      message: `成功导入 ${importedCount} 道菜品`,
    };
  } catch (error) {
    console.error('[importDataPackage] 导入失败:', error);
    throw error;
  }
}
