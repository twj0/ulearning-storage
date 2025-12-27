// 华为云 OBS 上传 - TypeScript 实现
// 基于 Python OBS SDK 的逻辑重写

interface UlearningTokenInfo {
  ak: string
  sk: string
  securitytoken: string
  endpoint: string
  bucket: string
  domain: string
}

// 计算 HMAC-SHA256
async function hmacSHA256(key: string, data: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder()
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  return await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(data))
}

// 生成 AWS V4 签名
async function generateSignature(
  method: string,
  url: string,
  headers: Record<string, string>,
  ak: string,
  sk: string,
  securityToken: string,
  region: string = 'cn-north-4'
): Promise<string> {
  const urlObj = new URL(url)
  const host = urlObj.hostname
  const path = urlObj.pathname

  const date = new Date()
  const amzDate = date.toISOString().replace(/[:-]|\.\d{3}/g, '')
  const dateStamp = amzDate.substring(0, 8)

  // Canonical request
  const canonicalHeaders = `host:${host}\nx-amz-date:${amzDate}\nx-amz-security-token:${securityToken}\n`
  const signedHeaders = 'host;x-amz-date;x-amz-security-token'
  const payloadHash = 'UNSIGNED-PAYLOAD'

  const canonicalRequest = `${method}\n${path}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`

  // String to sign
  const algorithm = 'AWS4-HMAC-SHA256'
  const credentialScope = `${dateStamp}/${region}/s3/aws4_request`
  const canonicalRequestHash = Array.from(
    new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonicalRequest)))
  ).map(b => b.toString(16).padStart(2, '0')).join('')

  const stringToSign = `${algorithm}\n${amzDate}\n${credentialScope}\n${canonicalRequestHash}`

  // Calculate signature
  const kDate = await hmacSHA256(`AWS4${sk}`, dateStamp)
  const kRegion = await hmacSHA256(String.fromCharCode(...new Uint8Array(kDate)), region)
  const kService = await hmacSHA256(String.fromCharCode(...new Uint8Array(kRegion)), 's3')
  const kSigning = await hmacSHA256(String.fromCharCode(...new Uint8Array(kService)), 'aws4_request')
  const signature = Array.from(
    new Uint8Array(await crypto.subtle.sign('HMAC',
      await crypto.subtle.importKey('raw', kSigning, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']),
      new TextEncoder().encode(stringToSign)
    ))
  ).map(b => b.toString(16).padStart(2, '0')).join('')

  return `${algorithm} Credential=${ak}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`
}

// 上传文件到华为云 OBS
export async function uploadToOBS(
  file: File,
  tokenInfo: UlearningTokenInfo,
  remotePath: string
): Promise<string> {
  const url = `https://${tokenInfo.bucket}.${tokenInfo.endpoint}/${remotePath}`

  const date = new Date()
  const amzDate = date.toISOString().replace(/[:-]|\.\d{3}/g, '')

  const headers: Record<string, string> = {
    'x-amz-date': amzDate,
    'x-amz-security-token': tokenInfo.securitytoken,
    'x-amz-content-sha256': 'UNSIGNED-PAYLOAD'
  }

  // 生成签名
  const authorization = await generateSignature(
    'PUT',
    url,
    headers,
    tokenInfo.ak,
    tokenInfo.sk,
    tokenInfo.securitytoken
  )

  // 上传文件
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      ...headers,
      'Authorization': authorization
    },
    body: file
  })

  if (!response.ok) {
    throw new Error(`OBS 上传失败: ${response.status} ${response.statusText}`)
  }

  return `${tokenInfo.domain}/${remotePath}`
}
