/**
 * 本地存储管理模块
 */

const STORAGE_KEYS = {
    VOD_SOURCES: 'kerkerker_vod_sources',
    SHORTS_SOURCES: 'kerkerker_shorts_sources',
    DM_CHANNELS: 'kerkerker_dm_channels',
    LAST_PASSWORD_HINT: 'kerkerker_password_hint'
};

/**
 * 保存 VOD 源配置
 */
function saveVodSources(sources) {
    localStorage.setItem(STORAGE_KEYS.VOD_SOURCES, JSON.stringify(sources));
}

/**
 * 加载 VOD 源配置
 */
function loadVodSources() {
    const data = localStorage.getItem(STORAGE_KEYS.VOD_SOURCES);
    return data ? JSON.parse(data) : [];
}

/**
 * 保存短剧源配置
 */
function saveShortsSources(sources) {
    localStorage.setItem(STORAGE_KEYS.SHORTS_SOURCES, JSON.stringify(sources));
}

/**
 * 加载短剧源配置
 */
function loadShortsSources() {
    const data = localStorage.getItem(STORAGE_KEYS.SHORTS_SOURCES);
    return data ? JSON.parse(data) : [];
}

/**
 * 保存 Dailymotion 频道配置
 */
function saveDmChannels(channels) {
    localStorage.setItem(STORAGE_KEYS.DM_CHANNELS, JSON.stringify(channels));
}

/**
 * 加载 Dailymotion 频道配置
 */
function loadDmChannels() {
    const data = localStorage.getItem(STORAGE_KEYS.DM_CHANNELS);
    return data ? JSON.parse(data) : [];
}

/**
 * 保存密码提示 (可选)
 */
function savePasswordHint(hint) {
    if (hint) {
        localStorage.setItem(STORAGE_KEYS.LAST_PASSWORD_HINT, hint);
    } else {
        localStorage.removeItem(STORAGE_KEYS.LAST_PASSWORD_HINT);
    }
}

/**
 * 加载密码提示
 */
function loadPasswordHint() {
    return localStorage.getItem(STORAGE_KEYS.LAST_PASSWORD_HINT) || '';
}

/**
 * 清除所有数据
 */
function clearAllData() {
    Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
    });
}

/**
 * 导出所有配置为 JSON
 */
function exportToJson() {
    return {
        vodSources: loadVodSources(),
        shortsSources: loadShortsSources(),
        dailymotionChannels: loadDmChannels(),
        exportedAt: new Date().toISOString()
    };
}

/**
 * 从 JSON 导入配置
 */
function importFromJson(json) {
    if (json.vodSources) {
        saveVodSources(json.vodSources);
    }
    if (json.shortsSources) {
        saveShortsSources(json.shortsSources);
    }
    if (json.dailymotionChannels) {
        saveDmChannels(json.dailymotionChannels);
    }
}

/**
 * 下载文件
 */
function downloadFile(content, filename, mimeType = 'application/json') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * 复制到剪贴板
 */
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (error) {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            document.body.removeChild(textarea);
            return true;
        } catch (e) {
            document.body.removeChild(textarea);
            return false;
        }
    }
}

// 导出到全局
window.StorageModule = {
    saveVodSources,
    loadVodSources,
    saveShortsSources,
    loadShortsSources,
    saveDmChannels,
    loadDmChannels,
    savePasswordHint,
    loadPasswordHint,
    clearAllData,
    exportToJson,
    importFromJson,
    downloadFile,
    copyToClipboard
};
