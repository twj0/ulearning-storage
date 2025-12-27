# 优学院云盘 - Cloudflare Pages 部署版

基于优学院平台和华为云 OBS 的免费在线网盘，使用 Cloudflare Pages 部署。

## 🚀 一键部署

### 第 1 步：Fork 项目

[![Fork on GitHub](https://img.shields.io/badge/Fork-GitHub-blue?style=for-the-badge&logo=github)](https://github.com/twj0/ulearning-storage/fork)

点击按钮 Fork 项目到你的 GitHub 账号

### 第 2 步：部署到 Cloudflare

1. 访问 [Cloudflare Pages](https://dash.cloudflare.com/pages)
2. 点击 **Create a project** → **Connect to Git**
3. 选择你刚才 Fork 的仓库 `ulearning-storage`
4. 构建设置会自动识别，直接点击 **Save and Deploy**

### 第 3 步：配置绑定（在 Dashboard 中点几下）

部署完成后，进入项目 → **Settings** → **Functions** → **Bindings**

#### 添加 D1 数据库（必需）
- 点击 **Add binding** → **D1 database**
- Variable name: `DB`
- 点击 **Create new database** → 输入 `storage_db` → 保存
- 进入 D1 Console → 执行 SQL：
  ```sql
  CREATE TABLE files (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    size INTEGER NOT NULL,
    type TEXT,
    url TEXT NOT NULL,
    content_id TEXT,
    created_at TEXT NOT NULL
  );
  ```

#### 添加 KV 命名空间（可选）
- 点击 **Add binding** → **KV namespace**
- Variable name: `KV`
- 点击 **Create new namespace** → 输入 `storage_kv` → 保存

### ✅ 完成！

访问你的 Pages URL 即可使用。

---

## 项目特点

✅ **完全免费** - 利用优学院的华为云 OBS 存储空间
✅ **全球加速** - Cloudflare CDN 全球分发
✅ **无需服务器** - Serverless 架构
✅ **图形界面** - 现代化 Web UI
✅ **图床功能** - 支持图片直链分享

## 技术架构

```
用户浏览器 → Cloudflare Pages (前端)
              ↓
         Cloudflare Workers (API)
              ↓
         优学院 API → 华为云 OBS (存储)
              ↓
         Cloudflare D1 (文件元数据)
```

## 技术栈

**前端：**
- React 18 + TypeScript
- Vite（构建工具）
- TailwindCSS（样式）
- React Dropzone（文件上传）
- React Icons（图标库）

**后端：**
- Cloudflare Pages（静态托管）
- Cloudflare Workers（API 端点）
- 优学院 API（认证和令牌）
- 华为云 OBS（文件存储）
- Cloudflare D1（文件元数据）

## 前置要求

1. Cloudflare 账号（免费版即可）
2. 优学院账号
3. Node.js 18+ 和 npm

> **注意：** 本项目使用 Cloudflare Workers 绑定，无需 `.env` 文件。所有配置通过 `wrangler.toml` 管理。详见 [CLOUDFLARE_CONFIG.md](CLOUDFLARE_CONFIG.md)

## 本地

### 方式一：自动配置（推荐）

```bash
# 1. 安装依赖
npm install

# 2. 登录 Cloudflare
npx wrangler login

# 3. 自动创建 KV 和 D1 资源
npm run setup

# 4. 本地测试
npm run dev

# 5. 部署到 Cloudflare Pages
npm run deploy
```

### 方式二：手动配置

如果自动配置失败，可以手动创建资源：

#### 1. 安装依赖

```bash
npm install
```

#### 2. 登录 Cloudflare

```bash
npx wrangler login
```

#### 3. 创建 D1 数据库

```bash
npx wrangler d1 create storage_db
```

记录输出的 `database_id`，更新 `wrangler.toml`：

```toml
[[d1_databases]]
binding = "DB"
database_name = "storage_db"
database_id = "粘贴你的 database_id"
```

#### 4. 初始化数据库

```bash
npx wrangler d1 execute storage_db --file=schema.sql
```

#### 5. 创建 KV 命名空间（可选）

```bash
npx wrangler kv namespace create KV
npx wrangler kv namespace create KV --preview
```

更新 `wrangler.toml` 中的 KV id 和 preview_id。

#### 6. 本地测试

```bash
npm run dev
```

访问 `http://localhost:5173`，使用优学院账号登录测试。

#### 7. 部署到 Cloudflare Pages

```bash
npm run deploy
```

部署成功后会显示您的网站 URL：`https://ulearning-storage.pages.dev`

## 使用说明

### 登录

使用您的优学院账号（邮箱/手机号）和密码登录。

### 上传文件

1. 点击"上传文件"按钮
2. 选择或拖拽文件
3. 文件会自动上传到华为云 OBS
4. 上传完成后可在文件列表查看

### 文件管理

- **文件列表**：查看所有上传的文件
- **下载**：点击下载图标下载文件
- **删除**：点击删除图标删除文件

### 图床功能

1. 切换到"图床"视图
2. 上传的图片会自动显示
3. 点击"复制链接"获取图片直链
4. 可用于 Markdown、博客等场景

## 配置说明

### R2 存储

- 免费额度：10 GB 存储 + 每月 100 万次读取
- 无出站流量费用
- 全球 CDN 加速

### D1 数据库

- 免费额度：5 GB 存储 + 每天 500 万次读取
- SQLite 兼容
- 自动备份

### Pages 部署

- 免费额度：无限请求
- 全球 CDN
- 自动 HTTPS

## 安全建议

1. **密码加密**：生产环境必须使用 bcrypt 等算法加密密码
2. **JWT 签名**：使用真实的 JWT 库（如 jose）而非简单的 base64
3. **CORS 配置**：限制允许的域名
4. **文件类型验证**：限制上传的文件类型和大小
5. **速率限制**：防止滥用上传功能

## 成本估算

基于 Cloudflare 免费计划：

- R2 存储：10 GB 免费
- D1 数据库：5 GB 免费
- Pages 托管：无限请求
- Workers：每天 10 万次请求免费

**适合场景：**
- 个人网盘（轻度使用）
- 图床服务（中等流量）
- 小团队文件共享

## 故障排查

### 上传失败

1. 检查 R2 存储桶是否创建成功
2. 检查 wrangler.toml 配置是否正确
3. 查看浏览器控制台错误信息

### 登录失败

1. 确认数据库中有用户记录
2. 检查用户名和密码是否正确
3. 查看 Workers 日志：`wrangler tail`

### 文件无法下载

1. 检查文件是否成功上传到 R2
2. 确认文件元数据在数据库中存在
3. 检查 R2 存储桶权限

## 进阶功能

### 添加文件分享功能

修改 `functions/[[path]].ts`，添加公开分享链接生成逻辑。

### 添加文件夹功能

扩展数据库 schema，添加 folders 表，实现文件夹层级结构。

### 添加图片压缩

使用 Cloudflare Images 或集成第三方图片处理服务。

### 添加视频预览

使用 Cloudflare Stream 实现视频上传和播放。

## 项目结构

```
uleaning-storage/
├── src/                      # 前端源代码
│   ├── components/          # React 组件
│   │   ├── Login.tsx       # 登录页面
│   │   ├── FileManager.tsx # 文件管理器
│   │   ├── FileList.tsx    # 文件列表
│   │   ├── FileUpload.tsx  # 文件上传
│   │   └── ImageGallery.tsx # 图床
│   ├── App.tsx             # 主应用
│   ├── main.tsx            # 入口文件
│   └── index.css           # 全局样式
├── functions/               # Cloudflare Workers
│   ├── [[path]].ts         # API 路由
│   ├── ulearning-api.ts    # 优学院 API
│   └── obs-uploader.ts     # OBS 上传
├── _python-old/            # Python 旧版本
├── docs/                   # 项目文档
├── schema.sql              # 数据库结构
├── wrangler.toml           # Cloudflare 配置
├── package.json            # 依赖配置
└── README.md               # 本文件
```


## 相关链接

- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
- [Cloudflare R2 文档](https://developers.cloudflare.com/r2/)
- [Cloudflare D1 文档](https://developers.cloudflare.com/d1/)
- [Wrangler CLI 文档](https://developers.cloudflare.com/workers/wrangler/)

> claudecode may make mistakes, so double-check outputs. 
