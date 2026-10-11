# 🍳 Fooder (吃什么 / 简悦食光)

> 解决每天“今天吃什么”终极难题的现代移动端食谱管理与做饭规划工具。基于 React Native + Expo 构建，纯本地离线隐私优先，支持双格式数据互导。

---

## ✨ 核心特性

- 🎲 **随机抽签选菜**：告别选择困难症！支持按餐别、荤素偏好随机摇号抽取今日菜单，抽取结果可一键平分添加到今日或明日菜单。
- 📖 **智能菜谱库**：分类收录私房菜、家常菜。支持菜品图片、难度、耗时、主辅食材配比及图文制作步骤。
- 📅 **今日/明日做饭规划**：直观的九宫格/卡片式菜单管理，快速调整早午晚餐排期，做饭井井有条。
- 🛒 **食材待买清单**：根据今日与明日菜单自动汇总统合待买原料与用量，买菜省时高效。
- 💾 **离线与本地优先**：采用 Expo SQLite 本地持久化数据库，数据完全保存在手机本地，无需联网即可使用，极速流畅。
- 🔄 **数据备份与互通**：支持导出与导入 `.fooder` 和 `.guorizi` 数据备份包，系统级关联文件打开方式，换机无忧。
- 🎨 **丰富视觉与动效**：精心调优的 3D 主题图标、2s 丝滑品牌开屏动画、流畅的卡片手势动效与深浅色模式自适应。

---

## 🛠️ 技术技术栈

- **框架**：[React Native](https://reactnative.dev/) (0.86) + [Expo](https://expo.dev/) (SDK 57)
- **路由**：[Expo Router](https://docs.expo.dev/router/introduction/) (File-based Routing)
- **语言**：TypeScript 6.0
- **样式**：[NativeWind](https://www.nativewind.dev/) (Tailwind CSS v3) + Lucide Icons
- **动效**：[React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/)
- **状态管理**：[Zustand](https://github.com/pmndrs/zustand)
- **本地存储**：[expo-sqlite](https://docs.expo.dev/versions/latest/sdk/sqlite/)
- **打包发布**：[EAS Build](https://docs.expo.dev/eas/) (原生 Android APK 构建)

---

## 🚀 本地运行与开发

### 环境要求
- Node.js >= 20.x
- npm / yarn / bun
- 手机端安装 [Expo Go](https://expo.dev/go) 或 Android 模拟器

### 安装与启动
```bash
# 1. 克隆代码仓库
git clone <your-repository-url>
cd fooder

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npx expo start
```
使用手机打开 Expo Go 扫描控制台二维码即可实时预览调试。

---

## 📦 打包 Android 独立 APK

项目已预先配置好 `eas.json` 与 `app.json`：

```bash
# 执行云端 APK 构建（输出格式为独立 APK，无需 Google Play 服务）
npx eas-cli@latest build -p android --profile preview
```

---

## 📄 开源协议

本项目采用 [MIT License](LICENSE) 授权。
