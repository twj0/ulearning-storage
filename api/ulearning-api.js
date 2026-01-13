/**
 * @file uLearning API 接口定义
 * 包含用户认证、文件上传、课程管理等相关接口
 */

const API_BASE_URL = 'https://courseapi.ulearning.cn'

/**
 * 用户登录并获取认证令牌
 * @param {string} username - 用户名
 * @param {string} password - 密码
 * @returns {Promise<string>} 认证令牌(authorization token)
 * @throws {Error} 登录失败时抛出错误
 */
// 登录获取 Token
export async function login(username, password) {
  const response = await fetch(`${API_BASE_URL}/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ loginName: username, password })
  })

  if (!response.ok) {
    throw new Error(`登录失败: ${response.status}`)
  }

  const result = await response.json()
  if (!result.authorization) {
    throw new Error('登录失败: 未获取到 authorization')
  }

  return result.authorization
}

/**
 * 获取上传令牌
 * @param {string} authToken - 认证令牌
 * @param {string} remotePath - 远程存储路径
 * @returns {Promise<any>} 上传令牌相关信息
 * @throws {Error} 获取上传令牌失败时抛出错误
 */
// 获取上传令牌
export async function getUploadToken(authToken, remotePath) {
  const url = new URL(`${API_BASE_URL}/obs/uploadToken`)
  url.searchParams.set('path', remotePath)

  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': authToken,
      'Origin': 'https://courseweb.ulearning.cn',
      'Referer': 'https://courseweb.ulearning.cn/',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`获取上传令牌失败: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  if (data.code !== 1) {
    throw new Error(`获取上传令牌失败: ${data.message}`)
  }

  return data.result
}

/**
 * 通知服务器上传完成
 * @param {string} authToken - 认证令牌
 * @param {string} filename - 文件名
 * @param {string} fileUrl - 文件URL
 * @param {number} fileSize - 文件大小
 * @returns {Promise<string>} 服务器响应文本
 * @throws {Error} 通知上传完成失败时抛出错误
 */
// 通知上传完成
export async function notifyUploadComplete(authToken, filename, fileUrl, fileSize) {
  const ext = filename.split('.').pop() || ''

  const response = await fetch(`${API_BASE_URL}/course/content/upload?lang=zh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authToken,
      Origin: 'https://courseweb.ulearning.cn',
      Referer: 'https://courseweb.ulearning.cn/'
    },
    body: JSON.stringify({
      title: filename,
      type: 1,
      status: 2,
      contentSize: fileSize,
      location: fileUrl,
      mimeType: ext,
      isView: 0,
      remark2: 1,
      remark3: 0
    })
  })

  if (!response.ok) {
    throw new Error(`通知上传完成失败: ${response.status}`)
  }

  return await response.text()
}

/**
 * 将内容发布到指定课程
 * @param {string} authToken - 认证令牌
 * @param {string|number} contentId - 内容ID
 * @param {string|number} courseId - 课程ID
 * @returns {Promise<string>} 服务器响应文本
 * @throws {Error} 发布到课程失败时抛出错误
 */
// 发布到课程
export async function publishToCourse(authToken, contentId, courseId) {
  const response = await fetch(`${API_BASE_URL}/course/content?lang=zh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authToken,
      Origin: 'https://courseweb.ulearning.cn',
      Referer: 'https://courseweb.ulearning.cn/'
    },
    body: JSON.stringify({
      ocId: courseId,
      contentIds: [{ id: null, contentId: parseInt(contentId), localType: 0 }],
      parentId: 0
    })
  })

  if (!response.ok) {
    throw new Error(`发布到课程失败: ${response.status}`)
  }

  return await response.text()
}

/**
 * 构建远程存储路径
 * @param {string} filename - 原始文件名
 * @returns {string} 构建的远程路径
 */
// 构建远程路径
export function buildRemotePath(filename) {
  const timestamp = Date.now()
  const ext = filename.includes('.') ? filename.substring(filename.lastIndexOf('.')) : ''
  return `resources/web/${timestamp}${ext}`
}

/**
 * 获取用户文件列表
 * @param {string} authToken - 认证令牌
 * @param {number} [page=1] - 页码
 * @param {number} [pageSize=100] - 每页数量
 * @returns {Promise<any>} 文件列表数据
 * @throws {Error} 获取文件列表失败时抛出错误
 */
// 获取文件列表
export async function getFileList(authToken, page = 1, pageSize = 100) {
  const url = new URL(`${API_BASE_URL}/content/user/list`)
  url.searchParams.set('pn', page)
  url.searchParams.set('ps', pageSize)
  url.searchParams.set('parentId', '0')
  url.searchParams.set('viewType', '0')
  url.searchParams.set('lang', 'zh')

  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': authToken,
      'Origin': 'https://courseweb.ulearning.cn',
      'Referer': 'https://courseweb.ulearning.cn/'
    }
  })

  if (!response.ok) {
    throw new Error(`获取文件列表失败: ${response.status}`)
  }

  return await response.json()
}

/**
 * 删除指定的文件(从库中删除)
 * @param {string} authToken - 认证令牌
 * @param {Array<number>} contentIds - 要删除的内容ID数组
 * @returns {Promise<boolean>} 删除是否成功
 * @throws {Error} 删除文件失败时抛出错误
 */
// 删除文件（库）
export async function deleteFiles(authToken, contentIds) {
  const response = await fetch(`${API_BASE_URL}/content/delete?_method=DELETE&lang=zh`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': authToken,
      'Origin': 'https://courseweb.ulearning.cn',
      'Referer': 'https://courseweb.ulearning.cn/'
    },
    body: JSON.stringify(contentIds)
  })

  if (!response.ok) {
    throw new Error(`删除文件失败: ${response.status}`)
  }

  return true
}

// ========== 课件文件夹管理 API ==========

/**
 * 获取用户的课程列表
 * @param {string} authToken - 认证令牌
 * @returns {Promise<any>} 课程列表数据
 * @throws {Error} 获取课程列表失败时抛出错误
 */
// 获取课程列表
export async function getCourseList(authToken) {
  const url = new URL(`${API_BASE_URL}/courses`)
  url.searchParams.set('publishStatus', '1')
  url.searchParams.set('type', '1')
  url.searchParams.set('pn', '1')
  url.searchParams.set('ps', '99999')
  url.searchParams.set('lang', 'zh')

  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': authToken,
      'Content-Type': 'application/json',
      'Origin': 'https://courseweb.ulearning.cn',
      'Referer': 'https://courseweb.ulearning.cn/',
      'version': '1'
    }
  })

  if (!response.ok) throw new Error(`获取课程列表失败: ${response.status}`)
  return await response.json()
}

/**
 * 获取指定课程的目录树结构
 * @param {string} authToken - 认证令牌
 * @param {string|number} courseId - 课程ID
 * @returns {Promise<any>} 课程目录树数据
 * @throws {Error} 获取目录失败时抛出错误
 */
// 获取课件文件夹目录树
export async function getCourseDirectory(authToken, courseId) {
  const response = await fetch(`${API_BASE_URL}/course/content/directory/${courseId}?lang=zh`, {
    headers: {
      'Authorization': authToken,
      'Content-Type': 'application/json',
      'Origin': 'https://courseweb.ulearning.cn',
      'Referer': 'https://courseweb.ulearning.cn/',
      'version': '1'
    }
  })

  if (!response.ok) throw new Error(`获取目录失败: ${response.status}`)
  const data = await response.json()
  if (data.code !== 1) throw new Error(`获取目录失败: ${data.message}`)
  return data.result
}

/**
 * 获取课程内容列表(文件和文件夹)
 * @param {string} authToken - 认证令牌
 * @param {string|number} courseId - 课程ID
 * @param {number} [parentId=0] - 父级内容ID
 * @param {number} [page=1] - 页码
 * @param {number} [pageSize=100] - 每页数量
 * @returns {Promise<any>} 课程内容列表数据
 * @throws {Error} 获取课件内容失败时抛出错误
 */
// 获取课件内容列表（文件+文件夹）
export async function getCourseContent(authToken, courseId, parentId = 0, page = 1, pageSize = 100) {
  const url = new URL(`${API_BASE_URL}/course/content`)
  url.searchParams.set('ocId', courseId)
  url.searchParams.set('parentId', parentId)
  url.searchParams.set('pn', page)
  url.searchParams.set('ps', pageSize)
  url.searchParams.set('version', '2')
  url.searchParams.set('lang', 'zh')

  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': authToken,
      'Content-Type': 'application/json',
      'Origin': 'https://courseweb.ulearning.cn',
      'Referer': 'https://courseweb.ulearning.cn/',
      'version': '1'
    }
  })

  if (!response.ok) throw new Error(`获取课件内容失败: ${response.status}`)
  return await response.json()
}

/**
 * 在指定课程中创建文件夹
 * @param {string} authToken - 认证令牌
 * @param {string|number} courseId - 课程ID
 * @param {string} name - 文件夹名称
 * @param {number} [parentId=0] - 父级ID
 * @returns {Promise<any>} 新创建文件夹的信息
 * @throws {Error} 创建文件夹失败时抛出错误
 */
// 创建文件夹
export async function createFolder(authToken, courseId, name, parentId = 0) {
  const response = await fetch(`${API_BASE_URL}/course/content/editor?lang=zh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': authToken,
      'Origin': 'https://courseweb.ulearning.cn',
      'Referer': 'https://courseweb.ulearning.cn/',
      'version': '1'
    },
    body: JSON.stringify({
      ocid: courseId,
      name: name,
      type: 0,
      share: 0,
      parentId: parentId
    })
  })

  if (!response.ok) throw new Error(`创建文件夹失败: ${response.status}`)
  const data = await response.json()
  if (data.code !== 1) throw new Error(`创建文件夹失败: ${data.message}`)
  return data.result // 返回新文件夹ID
}

/**
 * 删除课程中的内容(文件或文件夹)
 * @param {string} authToken - 认证令牌
 * @param {Array<number>} contentIds - 要删除的内容ID数组
 * @returns {Promise<boolean>} 是否删除成功
 * @throws {Error} 删除失败时抛出错误
 */
// 删除课件内容（文件夹或文件）
export async function deleteCourseContent(authToken, contentIds) {
  const response = await fetch(`${API_BASE_URL}/course/content/delete?lang=zh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': authToken,
      'Origin': 'https://courseweb.ulearning.cn',
      'Referer': 'https://courseweb.ulearning.cn/',
      'version': '1'
    },
    body: JSON.stringify(contentIds)
  })

  if (!response.ok) throw new Error(`删除失败: ${response.status}`)
  return true
}

/**
 * 移动文件或文件夹到目标位置
 * @param {string} authToken - 认证令牌
 * @param {string|number} courseId - 课程ID
 * @param {Array<number>} contentIds - 要移动的内容ID数组
 * @param {number} targetParentId - 目标父级ID
 * @returns {Promise<boolean>} 是否移动成功
 * @throws {Error} 移动失败时抛出错误
 */
// 移动文件/文件夹
export async function moveCourseContent(authToken, courseId, contentIds, targetParentId) {
  const response = await fetch(`${API_BASE_URL}/course/content/move?lang=zh`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': authToken,
      'Origin': 'https://courseweb.ulearning.cn',
      'Referer': 'https://courseweb.ulearning.cn/',
      'version': '1'
    },
    body: JSON.stringify({
      ocId: courseId,
      contentIds: contentIds,
      parentId: targetParentId
    })
  })

  if (!response.ok) throw new Error(`移动失败: ${response.status}`)
  const data = await response.json()
  if (data.code !== 1) throw new Error(`移动失败: ${data.message}`)
  return true
}

/**
 * 将资源发布到课程文件夹
 * @param {string} authToken - 认证令牌
 * @param {Array<number>} resourceIds - 资源ID数组
 * @param {Array<number>} courseIds - 课程ID数组
 * @param {number} [parentId=0] - 父级ID
 * @returns {Promise<string>} 服务器响应文本
 * @throws {Error} 发布失败时抛出错误
 */
// 发布文件到课件（从库发布到课件指定文件夹）
export async function releaseToCourseFolders(authToken, resourceIds, courseIds, parentId = 0) {
  const response = await fetch(`${API_BASE_URL}/content/release?lang=zh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': authToken,
      'Origin': 'https://courseweb.ulearning.cn',
      'Referer': 'https://courseweb.ulearning.cn/',
      'version': '1'
    },
    body: JSON.stringify({
      resources: resourceIds,
      ocIds: courseIds,
      share: '1',
      parentId: parentId
    })
  })

  if (!response.ok) throw new Error(`发布失败: ${response.status}`)
  return await response.text()
}