# 优学院API完整分析文档

## 概述

本文档记录了对优学院平台API的完整分析结果，基于浏览器开发者工具的HAR（HTTP Archive）文件分析获得。这些分析为ulearning-storage项目的开发提供了技术基础。

## 1. 认证机制

### 1.1 登录API

**端点**: `POST https://courseapi.ulearning.cn/users/login`

**请求体**:
```json
{
    "loginName": "username",
    "password": "password"
}
```

**响应**:
```json
{
    "userId": 13967952,
    "loginName": "1@ttwwjj.ddns-ip.net",
    "name": "唐伟佳",
    "orgId": 11,
    "roleId": 81,
    "authorization": "DAD6DECD834A78507746A7060E78FFD7"
}
```

### 1.2 Token认证机制

- **Token格式**: 32字符十六进制字符串
- **Token传递**: 通过 `Authorization` 请求头
- **Token有效期**: 约12小时
- **刷新机制**: 需要重新登录获取新token

### 1.3 相关认证端点

- **刷新会话**: `GET /users/login/refresh10Session?uaToken={token}`
- **验证Token**: `GET /users/isValidToken/{token}?lang=zh`
- **获取用户信息**: `GET /users/{userId}?lang=zh`
- **获取菜单权限**: `GET /users/menu/userMenuList?lang=zh`

### 1.4 请求头要求

```
Authorization: {token}
Content-Type: application/json
Origin: https://courseweb.ulearning.cn
Referer: https://courseweb.ulearning.cn/
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:146.0) Gecko/20100101 Firefox/146.0
```

## 2. 文件上传流程

### 2.1 三步上传流程

#### 步骤1: 获取上传令牌

**请求**:
```
GET https://courseapi.ulearning.cn/obs/uploadToken?path=resources/web/{timestamp}.{ext}
Authorization: {token}
```

**响应**:
```json
{
  "code": 1,
  "message": "成功",
  "result": {
    "ak": "临时访问密钥",
    "sk": "临时密钥",
    "securitytoken": "临时安全令牌",
    "bucket": "leicloud-huawei",
    "endpoint": "obs.cn-north-4.myhuaweicloud.com",
    "domain": "https://obscloud.ulearning.cn"
  }
}
```

#### 步骤2: 上传文件到华为云OBS

**请求**:
```
PUT https://{bucket}.{endpoint}/{path}
Content-Type: {file_mime_type}
x-obs-date: {current_date}
x-obs-security-token: {security_token}
Authorization: OBS {ak}:{signature}
Content-Length: {file_size}

[文件二进制数据]
```

**响应**:
- 状态码: 200
- ETag: 文件MD5哈希值

#### 步骤3: 通知服务器上传完成

**请求**:
```
POST https://courseapi.ulearning.cn/course/content/upload?lang=zh
Authorization: {token}
Content-Type: application/json

{
    "title": "文件名",
    "type": 1,
    "status": 2,
    "contentSize": 12345,
    "location": "https://obscloud.ulearning.cn/...",
    "mimeType": "png",
    "isView": 0,
    "remark2": 1,
    "remark3": 0
}
```

**响应**:
```
1865501  // contentId
```

### 2.2 文件路径命名规则

```
resources/web/{timestamp}{random}.{extension}
例: resources/web/17662817426485714.png
```

- timestamp: 13位毫秒时间戳
- random: 4位随机数
- extension: 文件扩展名

### 2.3 OBS签名算法

使用华为云OBS SDK的签名机制，需要：
- Access Key (AK)
- Secret Key (SK)
- Security Token (临时凭证)
- 请求时间戳
- 请求方法和路径

## 3. 文件管理API

### 3.1 双层数据模型

优学院平台采用双层数据模型：

#### 库 (Repository)
- **路径**: `/content/user/list`, `/content/delete`
- **功能**: 文件上传、查看、删除
- **特点**: 扁平化存储，无文件夹结构
- **用途**: 用户上传的原始文件存储位置

#### 课件 (Course)
- **路径**: `/course/content/*`, `/course/content/directory/*`
- **功能**: 文件夹管理、文件组织、发布
- **特点**: 树形结构，支持文件夹层级
- **用途**: 结构化的教学内容管理

### 3.2 文件夹管理API

#### 获取课件目录树
```
GET /course/content/directory/{courseId}?lang=zh
```

#### 获取课件内容
```
GET /course/content?ocId={courseId}&parentId={parentId}&pn=1&ps=10&version=2&lang=zh
```

#### 创建文件夹
```
POST /course/content/editor?lang=zh
Body: {"ocid":"153836","name":"文件夹名","type":0,"share":0,"parentId":0}
```

#### 删除课件内容
```
POST /course/content/delete?lang=zh
Body: [contentId]
```

#### 移动文件/文件夹
```
PUT /course/content/move?lang=zh
Body: {"ocId":courseId,"contentIds":[id1,id2],"parentId":targetParentId}
```

### 3.3 发布管理API

#### 获取课程列表
```
GET /courses?publishStatus=1&type=1&pn=1&ps=99999&lang=zh
```

#### 发布文件到课件
```
POST /content/release?lang=zh
Body: {"resources":[resourceIds],"ocIds":[courseIds],"share":"1","parentId":0}
```

#### 发布到课程
```
POST /course/content?lang=zh
Authorization: {token}

{
    "ocId": "153836",
    "contentIds": [{
        "id": null,
        "contentId": 1865502,
        "localType": 0
    }],
    "parentId": 0
}
```

## 4. 技术实现细节

### 4.1 CORS处理

所有跨域请求前都会发送OPTIONS预检：
```
Access-Control-Request-Method: GET/POST/PUT
Access-Control-Request-Headers: authorization,content-type,version
```

### 4.2 数据流分析

**工作流程**:
1. **上传阶段**: 文件上传到"库"（扁平存储）
2. **组织阶段**: 在"课件"中创建文件夹结构
3. **发布阶段**: 将库文件发布到课件指定位置
4. **管理阶段**: 在课件环境中进行文件管理

**权限模型**:
- 普通用户: 只能操作"库"中的文件
- 管理员: 可以操作"课件"中的文件夹和内容

### 4.3 安全注意事项

1. **Token保护**: Authorization token需要妥善保管
2. **临时凭证**: OBS上传凭证有时效性（约24小时）
3. **HTTPS**: 所有请求必须使用HTTPS
4. **CORS限制**: 只允许从 courseweb.ulearning.cn 域名访问

## 5. 开发中的应用

这些API分析结果已用于：

1. **ulearning-api.js**: 封装了优学院API调用
2. **obs-uploader.js**: 实现了华为云OBS上传逻辑
3. **upload.js**: 处理文件上传的完整流程
4. **files.js**: 文件列表和删除管理

### 5.1 核心API端点

- `https://courseapi.ulearning.cn/users/login` - 登录
- `https://courseapi.ulearning.cn/obs/uploadToken` - 获取上传令牌
- `https://courseapi.ulearning.cn/course/content/upload` - 通知上传完成
- `https://courseapi.ulearning.cn/course/content` - 发布到课程
- `https://courseapi.ulearning.cn/content/user/list` - 获取文件列表
- `https://courseapi.ulearning.cn/content/delete` - 删除文件

## 6. 实现建议

### 6.1 错误处理

- Token过期: 重新登录获取新token
- 上传失败: 重试机制（最多3次）
- 网络超时: 设置合理的timeout参数

### 6.2 Python实现要点

1. 使用 `requests` 库处理HTTP请求
2. 使用 `esdk-obs-python` 或自行实现OBS签名
3. 处理文件分块上传（大文件）
4. 实现重试机制
5. 添加进度回调

### 6.3 Node.js实现要点

1. 使用 Node.js crypto 生成 AWS V4 签名
2. 处理文件流上传
3. 实现token缓存和自动刷新
4. 添加错误处理和重试逻辑

## 7. 数据来源

所有分析数据来自2026年1月13日的浏览器网络请求记录，用于开发研究和学习目的。

## 8. 注意事项

- 这些HAR文件记录的是特定时间点的API行为
- 优学院可能会更新API，实际使用时需要验证
- 不要滥用API，遵守平台使用条款
- 敏感信息（如认证令牌）已在此文档中省略

---

*本文档为优学院API的技术分析，仅供学习和研究使用。*
