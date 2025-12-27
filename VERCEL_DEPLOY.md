# Vercel 部署指南

## 环境变量配置

在 Vercel 项目设置中配置以下环境变量：

```
ULEARNING_USERNAME=你的优学院用户名
ULEARNING_PASSWORD=你的优学院密码
DEFAULT_COURSE_ID=默认课程ID（可选）
```

## 部署步骤

1. 安装 Vercel CLI（如果还没有安装）：
```bash
npm install -g vercel
```

2. 登录 Vercel：
```bash
vercel login
```

3. 部署项目：
```bash
vercel
```

4. 生产环境部署：
```bash
vercel --prod
```

## API 端点

- `POST /api/login` - 用户登录
- `POST /api/upload` - 文件上传

## 架构说明

### 为什么迁移到 Vercel？

Cloudflare Workers 使用 Web Crypto API，生成的 AWS V4 签名与华为云 OBS 不兼容。Vercel 支持标准 Node.js 环境，可以使用 Node.js 的 `crypto` 模块，生成正确的签名。

### 工作流程

1. 前端将文件转换为 base64 发送到 `/api/upload`
2. Vercel 后端使用 Node.js crypto 生成正确的 OBS 签名
3. 后端直接上传文件到华为云 OBS
4. 通知优学院上传完成
5. 返回文件 URL 给前端

## 注意事项

- Vercel Serverless Functions 有 4.5MB 请求体限制
- 对于大文件，考虑使用分片上传或预签名 URL
- 当前实现适用于小于 4MB 的文件
