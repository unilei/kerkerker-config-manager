/**
 * 加密/解密模块 - PBKDF2 + AES-256-GCM
 * 
 * 安全特性:
 * - PBKDF2 密钥派生 (100000 iterations)
 * - AES-256-GCM 加密 (提供加密 + 完整性验证)
 * - 随机盐值和IV
 */

const PBKDF2_ITERATIONS = 100000;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const KEY_LENGTH = 256;

/**
 * 生成随机字节数组
 */
function generateRandomBytes(length) {
  return crypto.getRandomValues(new Uint8Array(length));
}

/**
 * Uint8Array 转 Base64
 */
function uint8ArrayToBase64(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Base64 转 Uint8Array
 */
function base64ToUint8Array(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * 字符串转 Uint8Array (UTF-8)
 */
function stringToUint8Array(str) {
  return new TextEncoder().encode(str);
}

/**
 * Uint8Array 转字符串 (UTF-8)
 */
function uint8ArrayToString(bytes) {
  return new TextDecoder().decode(bytes);
}

/**
 * PBKDF2 密钥派生
 */
async function deriveKey(password, salt, iterations = PBKDF2_ITERATIONS) {
  const passwordBuffer = stringToUint8Array(password);
  
  // 导入密码作为密钥材料
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );
  
  // 派生 AES-GCM 密钥
  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: iterations,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * AES-256-GCM 加密
 * @param {object} payload - 要加密的配置数据
 * @param {string} password - 用户密码
 * @returns {object} - 加密包
 */
async function encryptConfig(payload, password) {
  const salt = generateRandomBytes(SALT_LENGTH);
  const iv = generateRandomBytes(IV_LENGTH);
  
  // 派生密钥
  const key = await deriveKey(password, salt);
  
  // 加密数据
  const plaintext = stringToUint8Array(JSON.stringify(payload));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    plaintext
  );
  
  // AES-GCM 的输出包含认证标签 (最后16字节)
  const ciphertextArray = new Uint8Array(ciphertext);
  const data = ciphertextArray.slice(0, -16);
  const tag = ciphertextArray.slice(-16);
  
  return {
    version: '2.0',
    algorithm: 'aes-256-gcm',
    kdf: 'pbkdf2',
    salt: uint8ArrayToBase64(salt),
    iv: uint8ArrayToBase64(iv),
    iterations: PBKDF2_ITERATIONS,
    data: uint8ArrayToBase64(data),
    tag: uint8ArrayToBase64(tag)
  };
}

/**
 * AES-256-GCM 解密
 * @param {object} encryptedPackage - 加密包
 * @param {string} password - 用户密码
 * @returns {object} - 解密后的配置数据
 */
async function decryptConfig(encryptedPackage, password) {
  const { salt, iv, iterations, data, tag } = encryptedPackage;
  
  // 解码 Base64
  const saltBytes = base64ToUint8Array(salt);
  const ivBytes = base64ToUint8Array(iv);
  const dataBytes = base64ToUint8Array(data);
  const tagBytes = base64ToUint8Array(tag);
  
  // 派生密钥
  const key = await deriveKey(password, saltBytes, iterations);
  
  // 合并数据和标签
  const ciphertext = new Uint8Array(dataBytes.length + tagBytes.length);
  ciphertext.set(dataBytes);
  ciphertext.set(tagBytes, dataBytes.length);
  
  // 解密
  try {
    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: ivBytes },
      key,
      ciphertext
    );
    
    return JSON.parse(uint8ArrayToString(new Uint8Array(plaintext)));
  } catch (error) {
    throw new Error('解密失败：密码错误或数据已损坏');
  }
}

/**
 * 加密包转 Base64 字符串
 */
function packageToBase64(encryptedPackage) {
  return btoa(JSON.stringify(encryptedPackage));
}

/**
 * Base64 字符串转加密包
 */
function base64ToPackage(base64String) {
  try {
    return JSON.parse(atob(base64String));
  } catch (error) {
    throw new Error('无效的加密字符串格式');
  }
}

/**
 * 检查密码强度
 * @returns {object} { score: 0-4, message: string, color: string }
 */
function checkPasswordStrength(password) {
  if (!password) {
    return { score: 0, message: '请输入密码', color: '#6b7280' };
  }
  
  let score = 0;
  
  // 长度检查
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  
  // 字符类型检查
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
  
  const levels = [
    { score: 0, message: '非常弱', color: '#ef4444' },
    { score: 1, message: '弱', color: '#f97316' },
    { score: 2, message: '一般', color: '#eab308' },
    { score: 3, message: '强', color: '#22c55e' },
    { score: 4, message: '非常强', color: '#10b981' }
  ];
  
  const level = levels[Math.min(score, 4)];
  return { score, ...level };
}

// 导出到全局
window.CryptoModule = {
  encryptConfig,
  decryptConfig,
  packageToBase64,
  base64ToPackage,
  checkPasswordStrength,
  uint8ArrayToBase64,
  base64ToUint8Array
};
