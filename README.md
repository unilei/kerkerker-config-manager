# Kerkerker 配置管理器

安全分发 VOD 源和 Dailymotion 频道配置的独立管理工具。

## 功能特性

- 📺 **VOD 源管理** - 添加、编辑、删除、导入视频源配置
- 🎬 **Dailymotion 频道管理** - 管理 Dailymotion 频道列表
- 🔐 **安全加密** - PBKDF2 + AES-256-GCM 加密方案
- 📋 **多种导出方式** - 复制加密字符串、下载加密文件、生成订阅 URL

## 安全方案

采用 **PBKDF2 密钥派生 + AES-256-GCM 加密** 方案：

```
用户密码 → PBKDF2(salt, 100000 iterations) → 派生密钥 → AES-256-GCM 加密
```

### 安全特性

- ✅ 每个用户使用不同的密码/密钥
- ✅ PBKDF2 防止暴力破解 (100,000 次迭代)
- ✅ AES-GCM 提供加密 + 完整性验证
- ✅ 随机盐值和初始化向量
- ✅ 密钥不存储在代码中

## 使用方法

### 1. 配置管理

1. 打开 [配置管理器](https://your-username.github.io/kerkerker-config-manager/)
2. 在「VOD 源」标签页添加视频源配置
3. 在「Dailymotion」标签页添加频道配置

### 2. 加密导出

1. 切换到「加密导出」标签页
2. 设置加密密码（请牢记此密码）
3. 选择导出类型
4. 点击「复制加密字符串」或「下载加密文件」

### 3. 导入配置

在 Kerkerker 应用的设置页面：

1. 点击「导入加密配置」
2. 输入加密密码
3. 粘贴加密字符串或输入订阅 URL
4. 确认导入

## 加密数据格式

```typescript
interface EncryptedPackage {
  version: "2.0";
  algorithm: "aes-256-gcm";
  kdf: "pbkdf2";
  salt: string; // Base64
  iv: string; // Base64
  iterations: number;
  data: string; // Base64
  tag: string; // Base64
}
```

## 开发

### 本地运行

```bash
# 使用任意静态服务器
npx serve .

# 或使用 Python
python -m http.server 8080
```

### 部署到 GitHub Pages

1. Fork 此仓库
2. 启用 GitHub Pages (Settings → Pages → Source: main branch)
3. 访问 `https://your-username.github.io/kerkerker-config-manager/`

## 技术栈

- 纯 HTML/CSS/JavaScript (无框架依赖)
- Web Crypto API (原生加密支持)
- LocalStorage (本地配置存储)

## 许可证

MIT License
