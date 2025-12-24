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

1. 打开配置管理器
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

## 部署指南

本项目是纯静态站点，可部署到任意静态托管服务。

### GitHub Pages

1. Fork 或推送此仓库到 GitHub
2. 进入仓库 Settings → Pages
3. Source 选择 `GitHub Actions` 或 `Deploy from a branch`
4. 如选择分支部署，选择 `master` / `main` 分支，文件夹选择 `/ (root)`
5. 访问 `https://<username>.github.io/kerkerker-config-manager/`

### Vercel

1. 登录 [Vercel](https://vercel.com)
2. 点击 **Add New** → **Project**
3. 导入你的 GitHub 仓库
4. Framework Preset 选择 `Other`
5. 点击 **Deploy**
6. 部署完成后访问分配的域名

**或使用 CLI：**

```bash
# 安装 Vercel CLI
npm i -g vercel

# 在项目目录下运行
cd kerkerker-config-manager
vercel

# 生产部署
vercel --prod
```

### Netlify

1. 登录 [Netlify](https://netlify.com)
2. 点击 **Add new site** → **Import an existing project**
3. 连接你的 GitHub 仓库
4. Build settings 留空（纯静态站点无需构建）
5. 点击 **Deploy site**

**或使用拖拽部署：**

1. 访问 [Netlify Drop](https://app.netlify.com/drop)
2. 将整个项目文件夹拖入页面
3. 即时获得部署 URL

**或使用 CLI：**

```bash
# 安装 Netlify CLI
npm i -g netlify-cli

# 部署
cd kerkerker-config-manager
netlify deploy --prod --dir .
```

### Cloudflare Pages

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 进入 **Workers & Pages** → **Pages**
3. 点击 **Create a project** → **Connect to Git**
4. 选择你的 GitHub 仓库
5. Build settings:
   - Framework preset: `None`
   - Build command: 留空
   - Build output directory: `/`
6. 点击 **Save and Deploy**

**或使用 CLI：**

```bash
# 安装 Wrangler CLI
npm i -g wrangler

# 登录
wrangler login

# 部署
cd kerkerker-config-manager
wrangler pages deploy . --project-name kerkerker-config-manager
```

### 阿里云 OSS

1. 登录 [阿里云 OSS 控制台](https://oss.console.aliyun.com)
2. 创建 Bucket，权限设为「公共读」
3. 进入 Bucket → **基础设置** → **静态页面**
4. 设置默认首页为 `index.html`
5. 上传所有项目文件
6. 绑定自定义域名（可选）
7. 访问 `https://<bucket>.oss-<region>.aliyuncs.com/index.html`

**使用 ossutil 命令行：**

```bash
# 安装 ossutil
# macOS
brew install aliyun-cli

# 上传文件
ossutil cp -r . oss://<bucket-name>/ --exclude ".git/*"
```

### 腾讯云 COS

1. 登录 [腾讯云 COS 控制台](https://console.cloud.tencent.com/cos)
2. 创建存储桶，访问权限设为「公有读私有写」
3. 进入存储桶 → **基础配置** → **静态网站**
4. 开启静态网站功能，设置索引文档为 `index.html`
5. 上传所有项目文件
6. 访问静态网站域名

### 七牛云

1. 登录 [七牛开发者平台](https://portal.qiniu.com)
2. 创建对象存储空间，访问控制设为「公开」
3. 上传所有项目文件
4. 绑定自定义域名
5. 访问绑定的域名

## 本地开发

```bash
# 使用任意静态服务器
npx serve .

# 或使用 Python
python -m http.server 8080

# 或使用 PHP
php -S localhost:8080
```

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

## 技术栈

- 纯 HTML/CSS/JavaScript (无框架依赖)
- Web Crypto API (原生加密支持)
- LocalStorage (本地配置存储)

## 许可证

MIT License
