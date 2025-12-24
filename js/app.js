/**
 * 主应用逻辑
 */

class App {
    constructor() {
        this.currentTab = 'vod';
        this.init();
    }

    init() {
        this.bindTabEvents();
        this.bindExportEvents();
        this.bindPasswordEvents();
        this.initEditors();
        this.showTab('vod');
    }

    initEditors() {
        window.vodEditor = new VodEditor(document.getElementById('vod-editor'));
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
    }

    getExportPayload() {
        const exportType = document.getElementById('export-type').value;
        const vodSources = vodEditor.getSources();
        const dmChannels = dmEditor.getChannels();

        const payload = {
            timestamp: Date.now(),
            type: exportType
        };

        if (exportType === 'vod' || exportType === 'all') {
            payload.vodSources = vodSources;
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

            // 生成一个简单的数据 URL
            // 实际使用时，应该将加密数据上传到服务器或 GitHub Pages
            const subscriptionData = {
                version: '2.0',
                data: base64
            };

            // 这里生成一个示例 URL 格式
            const exampleUrl = `https://your-github-pages.github.io/kerkerker-config-manager/data/config.enc.json`;

            const output = document.getElementById('encrypted-output');
            output.innerHTML = `
        <div class="output-section">
          <h4>📋 加密字符串</h4>
          <textarea readonly class="encrypted-text">${base64}</textarea>
          <button class="btn btn-secondary btn-sm" onclick="StorageModule.copyToClipboard('${base64}').then(() => App.showToast('已复制', 'success'))">复制</button>
        </div>
        <div class="output-section">
          <h4>🔗 订阅 URL 格式</h4>
          <p class="hint">将加密文件 (config.enc.json) 上传到 GitHub Pages 后，用户可通过以下格式的 URL 导入：</p>
          <input type="text" readonly value="${exampleUrl}" class="url-input">
        </div>
      `;
            output.classList.add('active');

            App.showToast('已生成订阅信息', 'success');
        } catch (error) {
            App.showToast('生成失败: ' + error.message, 'error');
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
        if (payload.type === 'dailymotion' && (!payload.dailymotionChannels || payload.dailymotionChannels.length === 0)) {
            App.showToast('没有 Dailymotion 频道可导出', 'error');
            return false;
        }
        if (payload.type === 'all') {
            const hasVod = payload.vodSources && payload.vodSources.length > 0;
            const hasDm = payload.dailymotionChannels && payload.dailymotionChannels.length > 0;
            if (!hasVod && !hasDm) {
                App.showToast('没有配置可导出', 'error');
                return false;
            }
        }
        return true;
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
