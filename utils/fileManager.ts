/**
 * 本地文件沙盒管理器
 *
 * 职责：
 * 1. 将系统相册 / 相机拾取的临时缓存图片拷贝到永久沙盒目录
 * 2. 返回持久化的本地 URI 供数据库记录
 * 3. 提供图片删除能力（配合菜品删除）
 *
 * 使用 expo-file-system v57+ 新版 File/Directory/Paths API
 */

import { Paths, File, Directory } from 'expo-file-system';

/** 图片永久存储目录名 */
const DISH_IMAGES_DIR_NAME = 'dish_images';

/** 获取图片永久存储 Directory 实例 */
function getDishImagesDir(): Directory {
  return new Directory(Paths.document, DISH_IMAGES_DIR_NAME);
}

/**
 * 确保图片目录存在
 * 应用启动时调用一次即可
 */
export function ensureImageDirectory(): void {
  const dir = getDishImagesDir();
  if (!dir.exists) {
    dir.create({ intermediates: true });
  }
}

/**
 * 将临时图片安全保存到沙盒永久目录
 *
 * @param tempUri - 来自 ImagePicker / Camera 的临时缓存 URI
 * @returns 持久化后的本地 URI，可直接用于 <Image source={{ uri }} />
 */
export async function saveImageToSandbox(tempUri: string): Promise<string> {
  ensureImageDirectory();

  // 提取原始文件扩展名，默认 .jpg
  const extension = _extractExtension(tempUri);
  const fileName = `${Date.now()}_${_randomSuffix()}${extension}`;

  const sourceFile = new File(tempUri);
  const destFile = new File(getDishImagesDir(), fileName);

  await sourceFile.copy(destFile);

  return destFile.uri;
}

/**
 * 删除沙盒中的指定图片
 *
 * @param imageUri - 需要删除的沙盒图片 URI
 * @returns 是否成功删除
 */
export function deleteImageFromSandbox(imageUri: string): boolean {
  try {
    const file = new File(imageUri);
    if (file.exists) {
      file.delete();
      return true;
    }
    return false;
  } catch (error) {
    console.warn('[fileManager] 删除图片失败:', error);
    return false;
  }
}

/**
 * 获取沙盒图片目录的总大小（字节）
 * 用于设置页展示存储占用信息
 */
export function getImageDirectorySize(): number {
  try {
    const dir = getDishImagesDir();
    if (!dir.exists) return 0;
    return dir.size ?? 0;
  } catch {
    return 0;
  }
}

/**
 * 格式化文件大小为人类可读字符串
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);
  return `${value.toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

// ─── 私有工具函数 ───────────────────────────────────────────

function _extractExtension(uri: string): string {
  const match = uri.match(/\.(\w+)(?:\?.*)?$/);
  if (match) {
    const ext = match[1].toLowerCase();
    if (['jpg', 'jpeg', 'png', 'webp', 'heic', 'gif'].includes(ext)) {
      return `.${ext}`;
    }
  }
  return '.jpg';
}

function _randomSuffix(): string {
  return Math.random().toString(36).substring(2, 8);
}
