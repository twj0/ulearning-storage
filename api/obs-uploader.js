import crypto from 'crypto'

// 生成 AWS V4 签名
export function generateSignature(method, bucket, endpoint, remotePath, tokenInfo, contentType = '') {
  const date = new Date()
  const amzDate = date.toISOString().replace(/[:-]|\.\d{3}/g, '')
  const dateStamp = amzDate.substring(0, 8)
  const region = 'cn-east-3'
  const service = 'obs'

  // 1. 创建规范请求
  const canonicalUri = `/${remotePath}`
  const canonicalQuerystring = ''
  const canonicalHeaders = `host:${bucket}.${endpoint}\nx-amz-date:${amzDate}\nx-amz-security-token:${tokenInfo.securitytoken}\n`
  const signedHeaders = 'host;x-amz-date;x-amz-security-token'
  const payloadHash = 'UNSIGNED-PAYLOAD'

  const canonicalRequest = `${method}\n${canonicalUri}\n${canonicalQuerystring}\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`

  // 2. 创建待签名字符串
  const algorithm = 'AWS4-HMAC-SHA256'
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`
  const stringToSign = `${algorithm}\n${amzDate}\n${credentialScope}\n${crypto.createHash('sha256').update(canonicalRequest).digest('hex')}`

  // 3. 计算签名
  const kDate = crypto.createHmac('sha256', `AWS4${tokenInfo.sk}`).update(dateStamp).digest()
  const kRegion = crypto.createHmac('sha256', kDate).update(region).digest()
  const kService = crypto.createHmac('sha256', kRegion).update(service).digest()
  const kSigning = crypto.createHmac('sha256', kService).update('aws4_request').digest()
  const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex')

  // 4. 构建 Authorization 头
  const authorizationHeader = `${algorithm} Credential=${tokenInfo.ak}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`

  return {
    url: `https://${bucket}.${endpoint}/${remotePath}`,
    headers: {
      'Host': `${bucket}.${endpoint}`,
      'x-amz-date': amzDate,
      'x-amz-security-token': tokenInfo.securitytoken,
      'x-amz-content-sha256': payloadHash,
      'Authorization': authorizationHeader
    }
  }
}

// 上传文件到 OBS
export async function uploadToOBS(file, remotePath, tokenInfo) {
  const { url, headers } = generateSignature('PUT', tokenInfo.bucket, tokenInfo.endpoint, remotePath, tokenInfo)

  const response = await fetch(url, {
    method: 'PUT',
    headers,
    body: file
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`OBS上传失败: ${response.status} - ${errorText}`)
  }

  return `${tokenInfo.domain}/${remotePath}`
}
