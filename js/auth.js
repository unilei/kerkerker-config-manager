/**
 * 认证模块 - 访问密码保护
 */

const AUTH_STORAGE_KEYS = {
    PASSWORD_HASH: 'kerkerker_access_password_hash',
    SESSION_TOKEN: 'kerkerker_session_token'
};

/**
 * 使用 SHA-256 哈希密码
 */
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * 检查是否已设置访问密码
 */
function isPasswordSet() {
    return !!localStorage.getItem(AUTH_STORAGE_KEYS.PASSWORD_HASH);
}

/**
 * 设置访问密码
 */
async function setAccessPassword(password) {
    if (!password || password.length < 4) {
        throw new Error('密码长度至少为 4 位');
    }
    const hash = await hashPassword(password);
    localStorage.setItem(AUTH_STORAGE_KEYS.PASSWORD_HASH, hash);
    // 设置密码后自动登录
    createSession();
    return true;
}

/**
 * 验证访问密码
 */
async function verifyPassword(password) {
    const storedHash = localStorage.getItem(AUTH_STORAGE_KEYS.PASSWORD_HASH);
    if (!storedHash) {
        return false;
    }
    const inputHash = await hashPassword(password);
    return inputHash === storedHash;
}

/**
 * 创建会话（登录成功后调用）
 */
function createSession() {
    // 生成随机会话令牌
    const token = crypto.randomUUID ? crypto.randomUUID() : 
        Math.random().toString(36).substring(2) + Date.now().toString(36);
    sessionStorage.setItem(AUTH_STORAGE_KEYS.SESSION_TOKEN, token);
    return token;
}

/**
 * 检查是否已登录（会话有效）
 */
function isAuthenticated() {
    return !!sessionStorage.getItem(AUTH_STORAGE_KEYS.SESSION_TOKEN);
}

/**
 * 登出
 */
function logout() {
    sessionStorage.removeItem(AUTH_STORAGE_KEYS.SESSION_TOKEN);
}

/**
 * 清除密码（重置访问密码）
 */
function clearPassword() {
    localStorage.removeItem(AUTH_STORAGE_KEYS.PASSWORD_HASH);
    logout();
}

/**
 * 登录验证
 */
async function login(password) {
    const isValid = await verifyPassword(password);
    if (isValid) {
        createSession();
        return true;
    }
    return false;
}

// 导出到全局
window.AuthModule = {
    isPasswordSet,
    setAccessPassword,
    verifyPassword,
    isAuthenticated,
    login,
    logout,
    clearPassword
};
