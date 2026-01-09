/**
 * 主应用逻辑
 */

class App {
    constructor() {
        this.currentTab = 'vod';
        this.init();
    }

    init() {
        // 先检查认证状态
        this.checkAuth();
        
        this.bindAuthEvents();
        this.bindTabEvents();
        this.bindExportEvents();
        this.bindPasswordEvents();
        this.bindGitHubEvents();
        this.initEditors();
        this.initGitHubStatus();
        this.showTab('vod');
    }

    /**
     * 检查认证状态
     */
    checkAuth() {
        const overlay = document.getElementById('auth-overlay');
        const loginForm = document.getElementById('login-form');
        const setupForm = document.getElementById('setup-form');
        const logoutBtn = document.getElementById('logout-btn');

        if (AuthModule.isAuthenticated()) {
            // 已登录，隐藏遮罩层
            overlay.classList.add('hidden');
            logoutBtn.style.display = 'flex';
        } else if (AuthModule.isPasswordSet()) {
            // 已设置密码，显示登录表单
            loginForm.style.display = 'block';
            setupForm.style.display = 'none';
            logoutBtn.style.display = 'none';
        } else {
            // 未设置密码，显示设置表单
            loginForm.style.display = 'none';
            setupForm.style.display = 'block';
            logoutBtn.style.display = 'none';
        }

        // 刷新 Lucide 图标
        lucide.createIcons();
    }

    /**
     * 绑定认证相关事件
     */
    bindAuthEvents() {
        // 登录
        const authSubmitBtn = document.getElementById('auth-submit-btn');
        const authPasswordInput = document.getElementById('auth-password');
        const authError = document.getElementById('auth-error');

        authSubmitBtn.addEventListener('click', async () => {
            const password = authPasswordInput.value;
            if (!password) {
                authError.textContent = '请输入密码';
                return;
            }

            const success = await AuthModule.login(password);
            if (success) {
                authError.textContent = '';
                this.checkAuth();
                App.showToast('登录成功', 'success');
            } else {
                authError.textContent = '密码错误';
                authPasswordInput.value = '';
            }
        });

        // 回车登录
        authPasswordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                authSubmitBtn.click();
            }
        });

        // 设置密码
        const setupSubmitBtn = document.getElementById('setup-submit-btn');
        const setupPasswordInput = document.getElementById('setup-password');
        const setupError = document.getElementById('setup-error');

        setupSubmitBtn.addEventListener('click', async () => {
            const password = setupPasswordInput.value;
            if (!password || password.length < 4) {
                setupError.textContent = '密码长度至少为 4 位';
                return;
            }

            try {
                await AuthModule.setAccessPassword(password);
                setupError.textContent = '';
                this.checkAuth();
                App.showToast('密码设置成功', 'success');
            } catch (error) {
                setupError.textContent = error.message;
            }
        });

        // 回车设置密码
        setupPasswordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                setupSubmitBtn.click();
            }
        });

        // 登出
        const logoutBtn = document.getElementById('logout-btn');
        logoutBtn.addEventListener('click', () => {
            AuthModule.logout();
            this.checkAuth();
            App.showToast('已退出登录', 'info');
        });
    }

    initEditors() {
        window.vodEditor = new VodEditor(document.getElementById('vod-editor'));
        window.shortsEditor = new ShortsEditor(document.getElementById('shorts-editor'));
        window.dmEditor = new DmEditor(document.getElementById('dm-editor'));
    }

    bindTabEvents() {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.showTab(btn.dataset.tab);
            });
        });
    }

    showTab(tabId) {
        this.currentTab = tabId;

        // 更新按钮状态
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
        });

        // 更新面板显示
        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.toggle('active', panel.id === `${tabId}-panel`);
        });
    }

    bindPasswordEvents() {
        const passwordInput = document.getElementById('encrypt-password');
        const strengthBar = document.getElementById('password-strength-bar');
        const strengthText = document.getElementById('password-strength-text');

        passwordInput.addEventListener('input', () => {
            const result = CryptoModule.checkPasswordStrength(passwordInput.value);
            strengthBar.style.width = `${(result.score / 4) * 100}%`;
            strengthBar.style.backgroundColor = result.color;
            strengthText.textContent = result.message;
            strengthText.style.color = result.color;
        });
    }

    bindExportEvents() {
        // 加密并复制
        document.getElementById('encrypt-copy-btn').addEventListener('click', async () => {
            await this.encryptAndCopy();
        });

        // 加密并下载
        document.getElementById('encrypt-download-btn').addEventListener('click', async () => {
            await this.encryptAndDownload();
        });

        // 生成订阅 URL
        document.getElementById('generate-url-btn').addEventListener('click', async () => {
            await this.generateSubscriptionUrl();
        });

        // 导出类型切换
        document.getElementById('export-type').addEventListener('change', () => {
            this.updatePreview();
        });

        // 实时预览
        document.getElementById('encrypt-password').addEventListener('input', () => {
            this.updatePreview();
        });

        // 上传到 GitHub
        document.getElementById('upload-github-btn').addEventListener('click', async () => {
            await this.uploadToGitHub();
        });
    }

    getExportPayload() {
        const exportType = document.getElementById('export-type').value;
        const vodSources = vodEditor.getSources();
        const shortsSources = shortsEditor.getSources();
        const dmChannels = dmEditor.getChannels();

        const payload = {
            timestamp: Date.now(),
            type: exportType
        };

        if (exportType === 'vod' || exportType === 'all') {
            payload.vodSources = vodSources;
        }
        if (exportType === 'shorts' || exportType === 'all') {
            payload.shortsSources = shortsSources;
        }
        if (exportType === 'dailymotion' || exportType === 'all') {
            payload.dailymotionChannels = dmChannels;
        }

        return payload;
    }

    updatePreview() {
        const payload = this.getExportPayload();
        const preview = document.getElementById('config-preview');
        preview.textContent = JSON.stringify(payload, null, 2);
    }

    async encryptAndCopy() {
        const password = document.getElementById('encrypt-password').value;
        if (!password) {
            App.showToast('请输入加密密码', 'error');
            return;
        }

        const payload = this.getExportPayload();
        if (!this.validatePayload(payload)) return;

        try {
            document.getElementById('encrypt-copy-btn').disabled = true;
            document.getElementById('encrypt-copy-btn').textContent = '加密中...';

            const encrypted = await CryptoModule.encryptConfig(payload, password);
            const base64 = CryptoModule.packageToBase64(encrypted);

            const success = await StorageModule.copyToClipboard(base64);
            if (success) {
                App.showToast('已复制加密字符串到剪贴板', 'success');
                this.showEncryptedOutput(base64);
            } else {
                App.showToast('复制失败，请手动复制', 'error');
            }
        } catch (error) {
            App.showToast('加密失败: ' + error.message, 'error');
        } finally {
            document.getElementById('encrypt-copy-btn').disabled = false;
            document.getElementById('encrypt-copy-btn').textContent = '📋 复制加密字符串';
        }
    }

    async encryptAndDownload() {
        const password = document.getElementById('encrypt-password').value;
        if (!password) {
            App.showToast('请输入加密密码', 'error');
            return;
        }

        const payload = this.getExportPayload();
        if (!this.validatePayload(payload)) return;

        try {
            document.getElementById('encrypt-download-btn').disabled = true;
            document.getElementById('encrypt-download-btn').textContent = '加密中...';

            const encrypted = await CryptoModule.encryptConfig(payload, password);
            const filename = `config-${payload.type}-${Date.now()}.enc.json`;

            StorageModule.downloadFile(JSON.stringify(encrypted, null, 2), filename);
            App.showToast('已下载加密配置文件', 'success');
        } catch (error) {
            App.showToast('加密失败: ' + error.message, 'error');
        } finally {
            document.getElementById('encrypt-download-btn').disabled = false;
            document.getElementById('encrypt-download-btn').textContent = '💾 下载加密文件';
        }
    }

    async generateSubscriptionUrl() {
        const password = document.getElementById('encrypt-password').value;
        if (!password) {
            App.showToast('请输入加密密码', 'error');
            return;
        }

        const payload = this.getExportPayload();
        if (!this.validatePayload(payload)) return;

        try {
            const encrypted = await CryptoModule.encryptConfig(payload, password);
            const base64 = CryptoModule.packageToBase64(encrypted);
            const encryptedJson = JSON.stringify(encrypted, null, 2);

            // 自动检测当前站点 URL
            const currentUrl = window.location.origin + window.location.pathname.replace(/\/[^\/]*$/, '');
            const suggestedUrl = `${currentUrl}/data/config.enc.json`;

            // 生成 Data URL（可直接使用，无需服务器）
            const dataUrl = `data:application/json;base64,${btoa(encryptedJson)}`;

            // 生成文件名
            const filename = `config-${payload.type}-${Date.now()}.enc.json`;

            const output = document.getElementById('encrypted-output');
            output.innerHTML = `
                <div class="output-section">
                    <h4>📋 加密字符串</h4>
                    <p class="hint">直接复制此字符串，在 kerkerker 中粘贴导入</p>
                    <textarea readonly class="encrypted-text" id="encrypted-string-output">${base64}</textarea>
                    <button class="btn btn-secondary btn-sm" onclick="App.copyText('encrypted-string-output')">📋 复制</button>
                </div>
                
                <div class="output-section">
                    <h4>🔗 订阅 URL</h4>
                    <p class="hint">以下是几种分享配置的方式：</p>
                    
                    <div class="url-option">
                        <label>方式一：GitHub Pages URL（推荐）</label>
                        <p class="hint-small">下载加密文件后，上传到 GitHub Pages 的 data 目录</p>
                        <div class="url-row">
                            <input type="text" readonly value="${suggestedUrl}" class="url-input" id="github-pages-url">
                            <button class="btn btn-secondary btn-sm" onclick="App.copyText('github-pages-url')">复制</button>
                        </div>
                        <button class="btn btn-success btn-sm" onclick="StorageModule.downloadFile('${encryptedJson.replace(/'/g, "\\'")}', '${filename}')">
                            💾 下载配置文件 (${filename})
                        </button>
                    </div>
                    
                    <div class="url-option">
                        <label>方式二：Data URL（无需服务器）</label>
                        <p class="hint-small">直接使用此 URL，无需上传文件，但 URL 较长</p>
                        <div class="url-row">
                            <input type="text" readonly value="${dataUrl}" class="url-input" id="data-url">
                            <button class="btn btn-secondary btn-sm" onclick="App.copyText('data-url')">复制</button>
                        </div>
                    </div>
                    
                    <div class="url-option">
                        <label>方式三：其他托管服务</label>
                        <p class="hint-small">下载配置文件后上传到任意静态文件托管服务（如 Vercel、Netlify、OSS 等）</p>
                    </div>
                </div>
            `;
            output.classList.add('active');

            App.showToast('已生成订阅信息', 'success');
        } catch (error) {
            App.showToast('生成失败: ' + error.message, 'error');
        }
    }

    // 复制指定元素的内容
    static copyText(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            const text = element.value || element.textContent;
            StorageModule.copyToClipboard(text).then(success => {
                if (success) {
                    App.showToast('已复制到剪贴板', 'success');
                } else {
                    App.showToast('复制失败', 'error');
                }
            });
        }
    }

    showEncryptedOutput(base64) {
        const output = document.getElementById('encrypted-output');
        output.innerHTML = `
      <div class="output-section">
        <h4>✅ 加密成功</h4>
        <textarea readonly class="encrypted-text">${base64}</textarea>
        <p class="hint">将此字符串分享给用户，他们可以在 kerkerker 设置页面使用相同密码导入。</p>
      </div>
    `;
        output.classList.add('active');
    }

    validatePayload(payload) {
        if (payload.type === 'vod' && (!payload.vodSources || payload.vodSources.length === 0)) {
            App.showToast('没有 VOD 源可导出', 'error');
            return false;
        }
        if (payload.type === 'shorts' && (!payload.shortsSources || payload.shortsSources.length === 0)) {
            App.showToast('没有短剧源可导出', 'error');
            return false;
        }
        if (payload.type === 'dailymotion' && (!payload.dailymotionChannels || payload.dailymotionChannels.length === 0)) {
            App.showToast('没有 Dailymotion 频道可导出', 'error');
            return false;
        }
        if (payload.type === 'all') {
            const hasVod = payload.vodSources && payload.vodSources.length > 0;
            const hasShorts = payload.shortsSources && payload.shortsSources.length > 0;
            const hasDm = payload.dailymotionChannels && payload.dailymotionChannels.length > 0;
            if (!hasVod && !hasShorts && !hasDm) {
                App.showToast('没有配置可导出', 'error');
                return false;
            }
        }
        return true;
    }

    /**
     * GitHub 事件绑定
     */
    bindGitHubEvents() {
        // 切换 GitHub 设置表单显示
        document.getElementById('toggle-github-settings').addEventListener('click', () => {
            const form = document.getElementById('github-settings-form');
            const isVisible = form.style.display !== 'none';
            form.style.display = isVisible ? 'none' : 'block';

            // 刷新图标
            lucide.createIcons();
        });

        // 保存 GitHub 设置
        document.getElementById('save-github-btn').addEventListener('click', () => {
            this.saveGitHubSettings();
        });

        // 测试 GitHub 连接
        document.getElementById('test-github-btn').addEventListener('click', async () => {
            await this.testGitHubConnection();
        });
    }

    /**
     * 初始化 GitHub 状态
     */
    initGitHubStatus() {
        const settings = GitHubModule.getSettings();

        // 填充已保存的设置
        if (settings.token) {
            document.getElementById('github-token').value = settings.token;
        }
        if (settings.owner) {
            document.getElementById('github-owner').value = settings.owner;
        }
        if (settings.repo) {
            document.getElementById('github-repo').value = settings.repo;
        }
        if (settings.branch) {
            document.getElementById('github-branch').value = settings.branch;
        }
        if (settings.path) {
            document.getElementById('github-path').value = settings.path;
        }

        // 更新状态显示
        this.updateGitHubStatus();
    }

    /**
     * 更新 GitHub 状态显示
     */
    updateGitHubStatus() {
        const status = document.getElementById('github-status');
        const uploadBtn = document.getElementById('upload-github-btn');

        if (GitHubModule.isConfigured()) {
            const settings = GitHubModule.getSettings();
            status.className = 'github-status connected';
            status.textContent = `已配置: ${settings.owner}/${settings.repo}`;
            uploadBtn.disabled = false;
        } else {
            status.className = 'github-status disconnected';
            status.textContent = '未配置';
            uploadBtn.disabled = true;
        }
    }

    /**
     * 保存 GitHub 设置
     */
    saveGitHubSettings() {
        const token = document.getElementById('github-token').value.trim();
        const owner = document.getElementById('github-owner').value.trim();
        const repo = document.getElementById('github-repo').value.trim();
        const branch = document.getElementById('github-branch').value.trim() || 'main';
        const path = document.getElementById('github-path').value.trim() || 'data';

        if (!token || !owner || !repo) {
            App.showToast('请填写 Token、仓库所有者和仓库名称', 'error');
            return;
        }

        GitHubModule.saveSettings({ token, owner, repo, branch, path });
        this.updateGitHubStatus();
        App.showToast('GitHub 设置已保存', 'success');

        // 隐藏设置表单
        document.getElementById('github-settings-form').style.display = 'none';
    }

    /**
     * 测试 GitHub 连接
     */
    async testGitHubConnection() {
        // 先临时保存设置以便测试
        const token = document.getElementById('github-token').value.trim();
        const owner = document.getElementById('github-owner').value.trim();
        const repo = document.getElementById('github-repo').value.trim();
        const branch = document.getElementById('github-branch').value.trim() || 'main';
        const path = document.getElementById('github-path').value.trim() || 'data';

        if (!token || !owner || !repo) {
            App.showToast('请先填写 Token、仓库所有者和仓库名称', 'error');
            return;
        }

        // 临时保存
        GitHubModule.saveSettings({ token, owner, repo, branch, path });

        const testBtn = document.getElementById('test-github-btn');
        testBtn.disabled = true;
        testBtn.querySelector('span').textContent = '测试中...';

        try {
            const result = await GitHubModule.testConnection();
            App.showToast(`连接成功! 仓库: ${result.repoName}`, 'success');
            this.updateGitHubStatus();
        } catch (error) {
            App.showToast('连接失败: ' + error.message, 'error');
        } finally {
            testBtn.disabled = false;
            testBtn.querySelector('span').textContent = '测试连接';
        }
    }

    /**
     * 上传到 GitHub
     */
    async uploadToGitHub() {
        const password = document.getElementById('encrypt-password').value;
        if (!password) {
            App.showToast('请输入加密密码', 'error');
            return;
        }

        if (!GitHubModule.isConfigured()) {
            App.showToast('请先配置 GitHub 设置', 'error');
            return;
        }

        const payload = this.getExportPayload();
        if (!this.validatePayload(payload)) return;

        const uploadBtn = document.getElementById('upload-github-btn');
        uploadBtn.disabled = true;
        uploadBtn.querySelector('span').textContent = '上传中...';

        try {
            // 加密配置
            const encrypted = await CryptoModule.encryptConfig(payload, password);
            const encryptedJson = JSON.stringify(encrypted, null, 2);

            // 生成文件名
            const filename = `config.enc.json`;
            const commitMessage = `chore: update encrypted config (${payload.type})`;

            // 上传到 GitHub
            const result = await GitHubModule.uploadFile(filename, encryptedJson, commitMessage);

            // 显示成功信息和 URL
            const pagesUrl = GitHubModule.getFileUrl(filename);
            const rawUrl = GitHubModule.getRawUrl(filename);

            const output = document.getElementById('encrypted-output');
            output.innerHTML = `
                <div class="output-section">
                    <h4>✅ 上传成功!</h4>
                    <p class="hint">配置文件已上传到 GitHub</p>
                    
                    <div class="url-option">
                        <label>GitHub Pages URL（推荐）</label>
                        <p class="hint-small">如果启用了 GitHub Pages，可直接使用此 URL</p>
                        <div class="url-row">
                            <input type="text" readonly value="${pagesUrl}" class="url-input" id="pages-url">
                            <button class="btn btn-secondary btn-sm" onclick="App.copyText('pages-url')">复制</button>
                        </div>
                    </div>
                    
                    <div class="url-option">
                        <label>Raw URL（直接访问）</label>
                        <p class="hint-small">无需 GitHub Pages，可直接访问</p>
                        <div class="url-row">
                            <input type="text" readonly value="${rawUrl}" class="url-input" id="raw-url">
                            <button class="btn btn-secondary btn-sm" onclick="App.copyText('raw-url')">复制</button>
                        </div>
                    </div>
                    
                    <div class="url-option">
                        <label>GitHub 文件页面</label>
                        <div class="url-row">
                            <input type="text" readonly value="${result.url}" class="url-input" id="github-url">
                            <button class="btn btn-secondary btn-sm" onclick="App.copyText('github-url')">复制</button>
                            <a href="${result.url}" target="_blank" class="btn btn-secondary btn-sm">打开</a>
                        </div>
                    </div>
                </div>
            `;
            output.classList.add('active');

            App.showToast('配置已上传到 GitHub!', 'success');
        } catch (error) {
            App.showToast('上传失败: ' + error.message, 'error');
        } finally {
            uploadBtn.disabled = false;
            uploadBtn.querySelector('span').textContent = '上传到 GitHub';
        }
    }

    static showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;

        container.appendChild(toast);

        // 触发动画
        setTimeout(() => toast.classList.add('show'), 10);

        // 自动移除
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
