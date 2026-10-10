import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Alert } from 'react-native';
import type { Dish } from '@/database/types';
import { useDishStore } from '@/store/useDishStore';

const EXPORT_FILE_NAME = 'fooder_share.fooder';

/**
 * 导出菜品包为本地分享文件
 */
export async function exportDishes(dishes: Dish[]) {
  try {
    const dishesToExport = [];
    for (const dish of dishes) {
      let base64Image = null;
      if (dish.imageUri) {
        try {
          base64Image = await FileSystem.readAsStringAsync(dish.imageUri, {
            encoding: FileSystem.EncodingType.Base64,
          });
        } catch (err) {
          console.warn(`[SyncManager] 读取图片失败: ${dish.imageUri}`);
        }
      }
      dishesToExport.push({
        ...dish,
        imageBase64: base64Image,
      });
    }

    const payload = {
      version: '1.0',
      type: 'fooder-export',
      dishes: dishesToExport,
    };

    const fileUri = `${FileSystem.cacheDirectory}${EXPORT_FILE_NAME}`;
    await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(payload), {
      encoding: FileSystem.EncodingType.UTF8,
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/json',
        dialogTitle: '分享菜谱',
      });
    } else {
      Alert.alert('提示', '当前设备不支持分享功能');
    }
  } catch (error) {
    console.error('[SyncManager] 导出菜谱失败:', error);
    Alert.alert('导出失败', '发生未知错误，请重试');
  }
}

/**
 * 解析并导入本地文件数据包
 */
export async function importDishesFromFile(fileUri: string): Promise<Dish[] | null> {
  try {
    const content = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    const payload = JSON.parse(content);
    if (payload.type !== 'fooder-export' || !Array.isArray(payload.dishes)) {
      Alert.alert('导入失败', '文件格式不正确');
      return null;
    }

    const importedDishes: Dish[] = [];
    for (const item of payload.dishes) {
      let localImageUri = item.imageUri;
      if (item.imageBase64) {
        // 将 base64 重新写回本地沙盒图片文件
        const filename = `import_${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
        const newUri = `${FileSystem.documentDirectory}${filename}`;
        await FileSystem.writeAsStringAsync(newUri, item.imageBase64, {
          encoding: FileSystem.EncodingType.Base64,
        });
        localImageUri = newUri;
      }

      // 提取纯净数据
      const dish: Dish = {
        id: item.id,
        name: item.name,
        category: item.category,
        tags: item.tags || [],
        price: item.price,
        ingredients: item.ingredients || [],
        steps: item.steps || '',
        imageUri: localImageUri,
      };
      importedDishes.push(dish);
    }

    return importedDishes;
  } catch (error) {
    console.error('[SyncManager] 读取或解析导入文件失败:', error);
    Alert.alert('导入失败', '无法解析该数据包');
    return null;
  }
}

/**
 * 调起文件选择器导入菜品包
 */
export async function pickAndImportDishes() {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: true,
    });

    if (result.canceled || result.assets.length === 0) {
      return;
    }

    const file = result.assets[0];
    if (!file.name.endsWith('.fooder') && !file.name.endsWith('.guorizi') && !file.name.endsWith('.json')) {
      Alert.alert('提示', '请选择有效的 .fooder 数据包文件');
      return;
    }

    const importedDishes = await importDishesFromFile(file.uri);
    if (importedDishes && importedDishes.length > 0) {
      const { importAndMergeDishes } = useDishStore.getState();
      importAndMergeDishes(importedDishes);
      Alert.alert('导入成功', `成功导入并合并 ${importedDishes.length} 道菜品`);
    }
  } catch (error) {
    console.error('[SyncManager] 手动选择导入失败:', error);
    Alert.alert('导入失败', '无法处理选择的文件');
  }
}
