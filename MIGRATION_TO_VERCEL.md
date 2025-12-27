# 迁移到 Vercel

本项目已从 Cloudflare Pages 迁移到 Vercel，以解决 OBS 签名生成问题。

## 主要变更

### 1. 新增 Vercel API 函数
- `api/login.js` - 用户登录
- `api/upload.js` - 文件上传（使用 Node.js crypto）
- `api/ulearning-api.js` - 优学院 API 客户端
- `api/obs-uploader.js` - OBS 上传器（使用 Node.js crypto）

### 2. 前端更新
- [src/components/FileUpload.tsx](src/components/FileUpload.tsx) - 更新为调用 Vercel API

### 3. 配置文件
- `vercel.json` - Vercel 部署配置
- `VERCEL_DEPLOY.md` - 部署指南

## 为什么迁移？

Cloudflare Workers 使用 Web Crypto API，生成的 AWS V4 签名与华为云 OBS 不兼容。Vercel 支持标准 Node.js 环境，可以使用 Node.js 的 `crypto` 模块生成正确的签名。

## 部署

查看 [VERCEL_DEPLOY.md](VERCEL_DEPLOY.md) 了解详细部署步骤。
