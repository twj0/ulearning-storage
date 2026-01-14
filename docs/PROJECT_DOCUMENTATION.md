# 项目完整文档

## 概述

ulearning-storage 是一个利用优学院平台的华为云 OBS 存储空间搭建的免费个人云盘项目，支持文件上传、图床功能。项目经历了从 Python 到 TypeScript，从 Cloudflare Workers 到 Vercel 的演进。

## 技术架构

### 当前架构（Vercel）

- **前端**: React 18 + TypeScript + Vite + TailwindCSS
- **部署**: Vercel（免费 Serverless Functions + 静态托管）
- **存储**: 华为云 OBS（通过优学院平台）
- **认证**: 优学院账号登录

### 架构演进

1. **第一阶段**: Python 命令行工具
2. **第二阶段**: Cloudflare Pages + Workers + D1
3. **第三阶段**: Vercel + Serverless Functions（当前）

## 项目结构

```
ulearning-storage/
├── api/                     # Vercel Serverless Functions
│   ├── lib/auth.js         # 共享认证模块
│   ├── login.js            # 登录接口
│   ├── upload.js           # 文件上传处理
│   ├── ulearning-api.js    # 优学院 API 客户端
│   └── obs-uploader.js     # OBS 上传逻辑
├── src/                     # React 前端
│   ├── components/         # UI 组件
│   │   ├── FileManager.tsx    # 主文件管理界面
│   │   ├── FileUpload.tsx     # 文件上传组件
│   │   ├── FileList.tsx       # 文件列表视图
│   │   ├── ImageGallery.tsx   # 图床视图
│   │   └── Login.tsx         # 登录组件
│   ├── App.tsx            # 主应用
│   └── main.tsx           # 入口文件
├── assets/                  # 资源文件
│   └── *.png              # 注册指南图片
├── docs/                   # 文档
├── package.json            # 依赖配置
├── vercel.json           # Vercel 部署配置
├── vite.config.ts        # 构建配置
└── tailwind.config.js    # 样式配置
```

## 核心功能

### 前端组件

- **FileManager.tsx**: 主文件管理界面，支持文件列表和图床模式切换
- **FileUpload.tsx**: 拖拽上传组件，使用 react-dropzone
- **FileList.tsx**: 文件列表视图，支持下载和删除
- **ImageGallery.tsx**: 图床视图，网格形式展示图片
- **Login.tsx**: 优学院账号登录组件

### 后端 API

- **login.js**: 用户登录，返回 authorization token
- **upload.js**: 文件上传处理，协调完整上传流程
- **files.js**: 文件管理，获取列表和删除功能
- **ulearning-api.js**: 优学院 API 完整封装
- **obs-uploader.js**: 华为云 OBS 上传，使用 Node.js crypto 签名

## 部署指南

### 1. Fork 项目

[![Fork on GitHub](https://img.shields.io/badge/Fork-GitHub-blue?style=for-the-badge&logo=github)](https://github.com/twj0/ulearning-storage/fork)

### 2. 部署到 Vercel

1. 访问 [vercel.com](https://vercel.com) 并登录
2. 点击 **Add New...** → **Project**
3. 选择 Fork 的仓库，点击 **Deploy**

### 3. 配置环境变量

在 Vercel 项目设置中添加：

```env
ULEARNING_USERNAME=your_ulearning_email
ULEARNING_PASSWORD=your_ulearning_password
COURSE_IDS=153836,123456
COURSE_PASSWORDS={"153836":"pass_for_cs","123456":"pass_for_python"}
IMG_BED_FOLDER_NAME=图床
ADMIN_PASSWORD=password
```

### 4. 完成部署

访问生成的 URL 即可使用您的云盘。

## 优学院账户注册

### 步骤1：使用域名邮箱注册
![使用域名邮箱注册](./assets/1可以使用域名邮箱进行注册.png)

您可以使用域名邮箱地址进行注册。访问优学院注册页面并使用您的邮箱注册。

### 步骤2：选择允许邮箱注册的学校
![选择学校](./assets/2注册的时候可以自己选择允许邮箱注册的学校.png)

注册过程中，您可以选择允许邮箱注册的学校。这将使您能够访问平台的功能。

### 步骤3：创建课程（可随机命名）
![创建课程](./assets/3给课程随机起名字.png)

注册完成后，创建一个课程。您可以给课程起任意名称 - 这将是您的存储空间容器。

### 步骤4：访问文件存储
![文件存储](./assets/4文件会保存到资源这里.png)

您上传的文件将保存在课程资源部分，为您提供云存储访问权限。

> **注意**：注册流程可能因地区和当前优学院政策而有所不同。

## 工作原理

```
用户 → Vercel 前端 → Vercel Functions API → 优学院 API → 华为云 OBS
```

1. **登录**: 通过优学院 API 获取访问令牌
2. **上传**: 使用令牌调用优学院 OBS 上传接口
3. **存储**: 文件直接存储在华为云 OBS
4. **访问**: 通过优学院提供的链接访问文件

## 开发指南

### 本地开发

```bash
npm install
cp .env.example .env  # 配置优学院账号
npm run dev           # 启动开发服务器
```

### 技术要点

- 使用 Vercel Functions 处理 API 请求
- 通过优学院 API 获取 OBS 上传凭证
- 前端使用 React Dropzone 实现拖拽上传
- 支持图片直链和文件下载

## 成本说明

- **Vercel**: 免费计划（10万次请求/天，100GB带宽）
- **存储**: 优学院 OBS（免费，单次最大1GB）
- **域名**: 可绑定自定义域名

适合个人网盘、图床、小团队文件共享等场景。

## 架构迁移历史

### 为什么从 Cloudflare 迁移到 Vercel？

Cloudflare Workers 使用 Web Crypto API，生成的 AWS V4 签名与华为云 OBS 不兼容。Vercel 支持标准 Node.js 环境，可以使用 Node.js 的 `crypto` 模块生成正确的签名。

### 主要变更

1. **新增 Vercel API 函数**
   - `api/login.js` - 用户登录
   - `api/upload.js` - 文件上传（使用 Node.js crypto）
   - `api/ulearning-api.js` - 优学院 API 客户端
   - `api/obs-uploader.js` - OBS 上传器（使用 Node.js crypto）

2. **前端更新**
   - 更新 FileUpload.tsx 调用 Vercel API

3. **配置文件**
   - `vercel.json` - Vercel 部署配置

## API 文档

详细的 API 分析请参考：[API_ANALYSIS.md](./API_ANALYSIS.md)

## 安全注意事项

- 仅用于学习和个人使用
- 不要滥用优学院平台资源
- 注意文件隐私和安全
- 遵守平台使用条款

## 相关链接

- [Vercel 文档](https://vercel.com/docs)
- [优学院官网](https://www.ulearning.cn/)
- [华为云 OBS 文档](https://support.huaweicloud.com/obs/)

---

*本项目仅供技术研究与学习交流使用，非优学院或华为云官方产品。*
