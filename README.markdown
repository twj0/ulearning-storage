# 优学院云盘

利用优学院平台的华为云 OBS 存储空间搭建的免费个人网盘，支持文件上传、图床功能。

## 技术平台

- **前端**：React 18 + TypeScript + Vite + TailwindCSS
- **部署**：Vercel（免费 Serverless Functions + 静态托管）
- **存储**：优学院平台提供的华为云 OBS（免费）
- **认证**：优学院账号登录

## 快速部署

### 1. Fork 项目
[![Fork on GitHub](https://img.shields.io/badge/Fork-GitHub-blue?style=for-the-badge&logo=github)](https://github.com/twj0/ulearning-storage/fork)

### 2. 部署到 Vercel
1. 访问 [vercel.com](https://vercel.com) 并登录
2. 点击 **Add New...** → **Project**
3. 选择 Fork 的仓库，点击 **Deploy**

### 3. 配置环境变量
在 Vercel 项目设置中添加：
```
ULEARNING_USERNAME=你的优学院邮箱
ULEARNING_PASSWORD=你的优学院密码
```

### 完成！
访问生成的 URL 即可使用。

## 工作原理

```
用户 → Vercel 前端 → Vercel Functions API → 优学院 API → 华为云 OBS
```

1. **登录**：通过优学院 API 获取访问令牌
2. **上传**：使用令牌调用优学院 OBS 上传接口
3. **存储**：文件直接存储在华为云 OBS
4. **访问**：通过优学院提供的链接访问文件

## 二次开发

### 本地开发
```bash
npm install
cp .env.example .env  # 配置优学院账号
npm run dev           # 启动开发服务器
```

### 项目结构
```
api/                     # Serverless Functions
├── lib/auth.js         # 共享认证模块
├── login.js            # 登录接口
├── upload.js           # 文件上传
├── ulearning-api.js    # 优学院 API 客户端
└── obs-uploader.js     # OBS 上传逻辑

src/                     # React 前端
├── components/         # UI 组件
├── App.tsx            # 主应用
└── main.tsx           # 入口文件
```

### 扩展建议
- **文件分享**：在 `api/upload.js` 添加分享链接生成
- **文件夹管理**：扩展 API 支持目录结构
- **图片处理**：集成压缩、水印等功能
- **批量操作**：添加多文件上传和管理

### 技术要点
- 使用 Vercel Functions 处理 API 请求
- 通过优学院 API 获取 OBS 上传凭证
- 前端使用 React Dropzone 实现拖拽上传
- 支持图片直链和文件下载

## 成本说明

- **Vercel**：免费计划（10万次请求/天，100GB带宽）
- **存储**：优学院 OBS（免费，单次最大1GB）
- **域名**：可绑定自定义域名

适合个人网盘、图床、小团队文件共享等场景。 
