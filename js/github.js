/**
 * GitHub API 集成模块
 * 用于将配置文件上传到 GitHub 仓库
 */

const GITHUB_STORAGE_KEY = 'kerkerker_github_settings';

class GitHubAPI {
    constructor() {
        this.settings = this.loadSettings();
    }

    /**
     * 加载 GitHub 设置
     */
    loadSettings() {
        try {
            const data = localStorage.getItem(GITHUB_STORAGE_KEY);
            return data ? JSON.parse(data) : {
                token: '',
                owner: '',
                repo: '',
                branch: 'main',
                path: 'data'
            };
        } catch {
            return {
                token: '',
                owner: '',
                repo: '',
                branch: 'main',
                path: 'data'
            };
        }
    }

    /**
     * 保存 GitHub 设置
     */
    saveSettings(settings) {
        this.settings = { ...this.settings, ...settings };
        localStorage.setItem(GITHUB_STORAGE_KEY, JSON.stringify(this.settings));
    }

    /**
     * 获取当前设置
     */
    getSettings() {
        return { ...this.settings };
    }

    /**
     * 检查配置是否完整
     */
    isConfigured() {
        return !!(this.settings.token && this.settings.owner && this.settings.repo);
    }

    /**
     * 测试 GitHub 连接
     */
    async testConnection() {
        if (!this.isConfigured()) {
            throw new Error('请先配置 GitHub 信息');
        }

        const response = await fetch(`https://api.github.com/repos/${this.settings.owner}/${this.settings.repo}`, {
            headers: {
                'Authorization': `Bearer ${this.settings.token}`,
                'Accept': 'application/vnd.github.v3+json',
                'X-GitHub-Api-Version': '2022-11-28'
            }
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            if (response.status === 401) {
                throw new Error('Token 无效或已过期');
            } else if (response.status === 404) {
                throw new Error('仓库不存在或无权访问');
            } else {
                throw new Error(error.message || `连接失败: ${response.status}`);
            }
        }

        const repo = await response.json();
        return {
            success: true,
            repoName: repo.full_name,
            private: repo.private,
            defaultBranch: repo.default_branch
        };
    }

    /**
     * 获取文件的 SHA（用于更新已存在的文件）
     */
    async getFileSha(filePath) {
        const fullPath = `${this.settings.path}/${filePath}`.replace(/^\/+/, '');

        const response = await fetch(
            `https://api.github.com/repos/${this.settings.owner}/${this.settings.repo}/contents/${fullPath}?ref=${this.settings.branch}`,
            {
                headers: {
                    'Authorization': `Bearer ${this.settings.token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'X-GitHub-Api-Version': '2022-11-28'
                }
            }
        );

        if (response.ok) {
            const data = await response.json();
            return data.sha;
        }

        return null; // 文件不存在
    }

    /**
     * 上传文件到 GitHub
     * @param {string} filename - 文件名
     * @param {string} content - 文件内容（字符串）
     * @param {string} commitMessage - 提交信息
     */
    async uploadFile(filename, content, commitMessage = null) {
        if (!this.isConfigured()) {
            throw new Error('请先配置 GitHub 信息');
        }

        const fullPath = `${this.settings.path}/${filename}`.replace(/^\/+/, '');
        const message = commitMessage || `chore: update ${filename}`;

        // 将内容转为 Base64
        const base64Content = btoa(unescape(encodeURIComponent(content)));

        // 检查文件是否已存在（需要 SHA 来更新）
        const existingSha = await this.getFileSha(filename);

        const body = {
            message,
            content: base64Content,
            branch: this.settings.branch
        };

        if (existingSha) {
            body.sha = existingSha;
        }

        const response = await fetch(
            `https://api.github.com/repos/${this.settings.owner}/${this.settings.repo}/contents/${fullPath}`,
            {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${this.settings.token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json',
                    'X-GitHub-Api-Version': '2022-11-28'
                },
                body: JSON.stringify(body)
            }
        );

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            if (response.status === 401) {
                throw new Error('Token 无效或已过期');
            } else if (response.status === 404) {
                throw new Error('仓库不存在或无权访问');
            } else if (response.status === 422) {
                throw new Error('文件路径无效或分支不存在');
            } else {
                throw new Error(error.message || `上传失败: ${response.status}`);
            }
        }

        const result = await response.json();
        return {
            success: true,
            path: result.content.path,
            sha: result.content.sha,
            url: result.content.html_url,
            downloadUrl: result.content.download_url
        };
    }

    /**
     * 生成上传后的访问 URL
     */
    getFileUrl(filename) {
        const fullPath = `${this.settings.path}/${filename}`.replace(/^\/+/, '');
        // 使用 GitHub Pages 格式的 URL
        return `https://${this.settings.owner}.github.io/${this.settings.repo}/${fullPath}`;
    }

    /**
     * 生成原始文件 URL（用于直接访问）
     */
    getRawUrl(filename) {
        const fullPath = `${this.settings.path}/${filename}`.replace(/^\/+/, '');
        return `https://raw.githubusercontent.com/${this.settings.owner}/${this.settings.repo}/${this.settings.branch}/${fullPath}`;
    }
}

// 导出到全局
window.GitHubModule = new GitHubAPI();
