# 项目结构说明

## 目录组织


# 项目结构文档

## 当前架构（Vercel部署）

ulearning-storage 是一个基于 Vercel 的全栈应用，利用优学院平台的华为云 OBS 存储空间提供免费的个人云盘服务。

## 完整项目结构

```
ulearning-storage/
├── api/                           # Vercel Serverless Functions
│   ├── lib/
│   │   └── auth.js               # 共享认证模块，token缓存和刷新
│   ├── login.js                  # 登录 API 端点
│   ├── upload.js                 # 文件上传 API 端点
│   ├── files.js                  # 文件管理 API 端点（列表/删除）
│   ├── ulearning-api.js          # 优学院 API 完整封装
│   └── obs-uploader.js           # 华为云 OBS 上传实现
├── src/                           # React 前端源代码
│   ├── components/
│   │   ├── FileManager.tsx       # 主文件管理界面
│   │   ├── FileUpload.tsx        # 拖拽上传组件
│   │   ├── FileList.tsx          # 文件列表视图
│   │   ├── ImageGallery.tsx      # 图床网格视图
│   │   └── Login.tsx            # 登录组件
│   ├── App.tsx                  # 应用主入口，路由配置
│   └── main.tsx                 # React 应用入口
├── assets/                        # 静态资源
│   ├── 1可以使用域名邮箱进行注册.png
│   ├── 2注册的时候可以自己选择允许邮箱注册的学校.png
│   ├── 3给课程随机起名字.png
│   ├── 4文件会保存到资源这里.png
│   └── favicon.ico
├── docs/                          # 项目文档
│   ├── API_ANALYSIS.md           # 优学院 API 完整分析
│   ├── PROJECT_DOCUMENTATION.md  # 项目完整文档
│   ├── PROJECT_STRUCTURE.md     # 项目结构说明
│   ├── MIGRATION_TO_VERCEL.md   # 迁移历史
│   ├── VERCEL_DEPLOY.md         # Vercel 部署指南
│   └── project_document/        # 历史文档（待清理）
├── .env.example                   # 环境变量示例
├── .vercel/                      # Vercel 配置目录
├── package.json                   # Node.js 依赖配置
├── package-lock.json              # 依赖锁定文件
├── vercel.json                   # Vercel 部署配置
├── vite.config.ts               # Vite 构建配置
├── tsconfig.json               # TypeScript 配置
├── tsconfig.node.json          # Node.js TypeScript 配置
├── tailwind.config.js          # TailwindCSS 配置
├── postcss.config.js           # PostCSS 配置
└── index.html                  # HTML 入口文件
```

## 核心模块详解

### 1. API 层（Vercel Functions）

#### `api/lib/auth.js`
- **功能**: 认证辅助模块
- **特性**: 
  - Token 缓存（12小时有效期）
  - 自动刷新机制
  - 环境变量读取

#### `api/login.js`
- **路径**: `/api/login`
- **方法**: POST
- **功能**: 验证优学院账号，返回 authorization token

#### `api/upload.js`
- **路径**: `/api/upload`
- **方法**: POST
- **功能**: 
  - 接收 base64 编码文件
  - 协调 token 获取、OBS 上传、通知完成
  - 支持多文件批量上传

#### `api/files.js`
- **路径**: `/api/files`
- **方法**: GET, DELETE
- **功能**: 
  - GET: 获取用户文件列表
  - DELETE: 删除指定文件（需要管理员密码）

#### `api/ulearning-api.js`
- **功能**: 优学院 API 完整封装
- **主要函数**:
  - `login()` - 用户登录
  - `getUploadToken()` - 获取 OBS 上传令牌
  - `notifyUploadComplete()` - 通知上传完成
  - `publishToCourse()` - 发布到课程
  - `getFileList()` - 获取文件列表
  - `deleteFiles()` - 删除文件
  - `buildRemotePath()` - 构建远程路径

#### `api/obs-uploader.js`
- **功能**: 华为云 OBS 上传实现
- **特性**:
  - 使用 Node.js crypto 生成 AWS V4 签名
  - 支持大文件上传
  - 完整的错误处理

### 2. 前端层（React + TypeScript）

#### `src/App.tsx`
- **功能**: 应用主入口
- **路由配置**:
  - `/` - FileManager（公共文件浏览器）
  - `/admin` - AdminPanel（管理界面，当前未实现）
  - `/imgbed` - ImgBed（图床模式）

#### `src/components/FileManager.tsx`
- **功能**: 主文件管理界面
- **特性**:
  - 视图切换：文件列表 / 图床模式
  - 集成上传、文件列表、图片画廊组件
  - 响应式设计

#### `src/components/FileUpload.tsx`
- **功能**: 文件上传组件
- **特性**:
  - 使用 react-dropzone 实现拖拽上传
  - 文件预览和进度显示
  - 支持 base64 编码传输

#### `src/components/FileList.tsx`
- **功能**: 文件列表视图
- **特性**:
  - 表格形式展示文件信息
  - 支持下载和删除操作
  - 文件大小和上传时间显示

#### `src/components/ImageGallery.tsx`
- **功能**: 图床视图
- **特性**:
  - 网格形式展示图片
  - 图片缩略图预览
  - 复制直链功能

### 3. 配置文件

#### `vercel.json`
- **功能**: Vercel 部署配置
- **配置**:
  - API 路由重写
  - 构建输出目录
  - 环境变量配置

#### `package.json`
- **功能**: Node.js 项目配置
- **依赖**:
  - React 18 + TypeScript
  - Vite 构建工具
  - TailwindCSS 样式框架
  - react-dropzone 文件上传
  - react-router 路由管理

## 数据流架构

```
用户操作
    ↓
React 前端组件
    ↓ (HTTP 请求)
Vercel Serverless Functions
    ↓ (API 调用)
优学院平台 API
    ↓ (OBS 操作)
华为云对象存储
```

### 关键数据流

1. **登录流程**:
   - 前端 → `/api/login` → 优学院登录 API
   - 返回 authorization token

2. **文件上传流程**:
   - 前端 → `/api/upload` → 获取 OBS 上传令牌
   - 上传到华为云 OBS
   - 通知优学院上传完成
   - 返回文件 URL

3. **文件管理流程**:
   - 前端 → `/api/files` → 优学院文件 API
   - 返回文件列表或删除结果

## 技术栈详情

### 前端技术
- **React 18**: 用户界面框架
- **TypeScript**: 类型安全的 JavaScript
- **Vite**: 快速构建工具
- **TailwindCSS**: 实用优先的 CSS 框架
- **React Router**: 客户端路由
- **React Dropzone**: 文件拖拽上传

### 后端技术
- **Vercel Functions**: Serverless 计算平台
- **Node.js**: JavaScript 运行时
- **Node.js Crypto**: 加密和签名生成

### 存储和部署
- **华为云 OBS**: 对象存储服务
- **优学院 API**: 存储凭证和管理
- **Vercel**: 应用托管和部署

## 开发工作流

### 本地开发
bash
npm install          # 安装依赖
npm run dev          # 启动开发服务器


### 环境变量
- `ULEARNING_USERNAME`: 优学院用户名
- `ULEARNING_PASSWORD`: 优学院密码
- `COURSE_IDS`: 课程 ID 列表
- `COURSE_PASSWORDS`: 课程密码映射
- `IMG_BED_FOLDER_NAME`: 图床文件夹名
- `ADMIN_PASSWORD`: 管理员密码

## 架构优势

1. **无服务器**: 完全 Serverless，无需维护服务器
2. **全球 CDN**: Vercel 提供全球加速
3. **免费存储**: 利用优学院免费 OBS 空间
4. **类型安全**: 全栈 TypeScript 开发
5. **现代工具**: 使用最新的前端开发工具链

## 扩展性考虑

### 可扩展的功能
- 文件夹管理
- 批量操作
- 文件分享
- 视频预览
- 移动端适配

### 性能优化
- 图片压缩
- 断点续传
- 缓存策略
- CDN 优化