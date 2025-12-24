/**
 * VOD 源编辑器组件
 */

class VodEditor {
    constructor(container) {
        this.container = container;
        this.sources = [];
        this.editingIndex = -1;
        this.init();
    }

    init() {
        this.render();
        this.loadSources();
    }

    loadSources() {
        this.sources = StorageModule.loadVodSources();
        this.renderList();
    }

    saveSources() {
        StorageModule.saveVodSources(this.sources);
    }

    getSources() {
        return this.sources;
    }

    setSources(sources) {
        this.sources = sources;
        this.saveSources();
        this.renderList();
    }

    render() {
        this.container.innerHTML = `
      <div class="editor-header">
        <h2>VOD 源配置</h2>
        <div class="header-actions">
          <button class="btn btn-secondary" id="vod-import-json">
            <i data-lucide="folder-input"></i>
            <span>导入JSON</span>
          </button>
          <button class="btn btn-primary" id="vod-add-btn">
            <i data-lucide="plus"></i>
            <span>添加源</span>
          </button>
        </div>
      </div>
      
      <div class="source-list" id="vod-source-list"></div>
      
      <!-- 编辑弹窗 -->
      <div class="modal" id="vod-edit-modal">
        <div class="modal-content">
          <div class="modal-header">
            <h3 id="vod-modal-title">添加 VOD 源</h3>
            <button class="modal-close" id="vod-modal-close">
              <i data-lucide="x"></i>
            </button>
          </div>
          <div class="modal-body">
            <div class="form-grid">
              <div class="form-group">
                <label>Key (唯一标识) <span class="required">*</span></label>
                <input type="text" id="vod-key" placeholder="例如: rycjapi">
              </div>
              <div class="form-group">
                <label>名称 <span class="required">*</span></label>
                <input type="text" id="vod-name" placeholder="例如: 如意资源站">
              </div>
              <div class="form-group full-width">
                <label>API 地址 <span class="required">*</span></label>
                <input type="text" id="vod-api" placeholder="https://...">
              </div>
              <div class="form-group full-width">
                <label>播放地址 (可选)</label>
                <input type="text" id="vod-playurl" placeholder="留空则直接使用原始播放链接">
              </div>
              <div class="form-group">
                <label>优先级</label>
                <input type="number" id="vod-priority" value="0" min="0">
              </div>
              <div class="form-group">
                <label class="checkbox-label">
                  <input type="checkbox" id="vod-use-playurl" checked>
                  <span>使用播放地址解析</span>
                </label>
              </div>
              <div class="form-group">
                <label>搜索代理 (可选)</label>
                <input type="text" id="vod-search-proxy" placeholder="https://...">
              </div>
              <div class="form-group">
                <label>解析代理 (可选)</label>
                <input type="text" id="vod-parse-proxy" placeholder="https://...">
              </div>
              <div class="form-group">
                <label>解析ID (可选)</label>
                <input type="text" id="vod-parse-id" placeholder="">
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" id="vod-cancel-btn">
              <i data-lucide="x"></i>
              <span>取消</span>
            </button>
            <button class="btn btn-primary" id="vod-save-btn">
              <i data-lucide="check"></i>
              <span>保存</span>
            </button>
          </div>
        </div>
      </div>
      
      <input type="file" id="vod-file-input" accept=".json" style="display: none">
    `;

        this.bindEvents();
        this.refreshIcons();
    }

    refreshIcons() {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    bindEvents() {
        // 添加按钮
        document.getElementById('vod-add-btn').addEventListener('click', () => {
            this.openModal(-1);
        });

        // 导入JSON
        document.getElementById('vod-import-json').addEventListener('click', () => {
            document.getElementById('vod-file-input').click();
        });

        document.getElementById('vod-file-input').addEventListener('change', (e) => {
            this.handleFileImport(e);
        });

        // 弹窗事件
        document.getElementById('vod-modal-close').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('vod-cancel-btn').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('vod-save-btn').addEventListener('click', () => {
            this.saveSource();
        });

        // 点击遮罩关闭
        document.getElementById('vod-edit-modal').addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal();
            }
        });
    }

    renderList() {
        const list = document.getElementById('vod-source-list');

        if (this.sources.length === 0) {
            list.innerHTML = `
        <div class="empty-state">
          <i data-lucide="tv" class="empty-icon"></i>
          <p>暂无 VOD 源配置</p>
          <p class="hint">点击「添加源」按钮开始添加视频源，或导入 JSON 配置文件</p>
        </div>
      `;
            this.refreshIcons();
            return;
        }

        // 按优先级排序
        const sortedSources = [...this.sources].sort((a, b) => (a.priority || 0) - (b.priority || 0));

        list.innerHTML = sortedSources.map((source, idx) => {
            const originalIndex = this.sources.indexOf(source);
            return `
        <div class="source-item" data-index="${originalIndex}">
          <div class="source-info">
            <div class="source-header">
              <span class="priority-badge">#${source.priority || 0}</span>
              <h4>${this.escapeHtml(source.name)}</h4>
              <span class="key-badge">${this.escapeHtml(source.key)}</span>
            </div>
            <div class="source-details">
              <p><span class="label">API:</span> ${this.escapeHtml(source.api)}</p>
              ${source.playUrl ? `<p><span class="label">播放:</span> ${this.escapeHtml(source.playUrl)} ${source.usePlayUrl === false ? '<span class="warning">(未启用)</span>' : ''}</p>` : ''}
            </div>
          </div>
          <div class="source-actions">
            <button class="btn-icon" onclick="vodEditor.editSource(${originalIndex})" title="编辑">
              <i data-lucide="pencil"></i>
            </button>
            <button class="btn-icon danger" onclick="vodEditor.deleteSource(${originalIndex})" title="删除">
              <i data-lucide="trash-2"></i>
            </button>
          </div>
        </div>
      `;
        }).join('');

        this.refreshIcons();
    }

    openModal(index) {
        this.editingIndex = index;
        const modal = document.getElementById('vod-edit-modal');
        const title = document.getElementById('vod-modal-title');

        if (index === -1) {
            title.textContent = '添加 VOD 源';
            this.clearForm();
            document.getElementById('vod-priority').value = this.sources.length;
        } else {
            title.textContent = '编辑 VOD 源';
            this.fillForm(this.sources[index]);
        }

        modal.classList.add('active');
    }

    closeModal() {
        document.getElementById('vod-edit-modal').classList.remove('active');
        this.editingIndex = -1;
    }

    clearForm() {
        document.getElementById('vod-key').value = '';
        document.getElementById('vod-name').value = '';
        document.getElementById('vod-api').value = '';
        document.getElementById('vod-playurl').value = '';
        document.getElementById('vod-priority').value = '0';
        document.getElementById('vod-use-playurl').checked = true;
        document.getElementById('vod-search-proxy').value = '';
        document.getElementById('vod-parse-proxy').value = '';
        document.getElementById('vod-parse-id').value = '';
    }

    fillForm(source) {
        document.getElementById('vod-key').value = source.key || '';
        document.getElementById('vod-name').value = source.name || '';
        document.getElementById('vod-api').value = source.api || '';
        document.getElementById('vod-playurl').value = source.playUrl || '';
        document.getElementById('vod-priority').value = source.priority || 0;
        document.getElementById('vod-use-playurl').checked = source.usePlayUrl !== false;
        document.getElementById('vod-search-proxy').value = source.searchProxy || '';
        document.getElementById('vod-parse-proxy').value = source.parseProxy || '';
        document.getElementById('vod-parse-id').value = source.parseId || '';
    }

    saveSource() {
        const key = document.getElementById('vod-key').value.trim();
        const name = document.getElementById('vod-name').value.trim();
        const api = document.getElementById('vod-api').value.trim();

        if (!key || !name || !api) {
            App.showToast('请填写必填字段', 'error');
            return;
        }

        // 检查 key 是否重复
        const existingIndex = this.sources.findIndex(s => s.key === key);
        if (existingIndex !== -1 && existingIndex !== this.editingIndex) {
            App.showToast('Key 已存在', 'error');
            return;
        }

        const source = {
            key,
            name,
            api,
            playUrl: document.getElementById('vod-playurl').value.trim() || undefined,
            usePlayUrl: document.getElementById('vod-use-playurl').checked,
            priority: parseInt(document.getElementById('vod-priority').value) || 0,
            type: 'json',
            searchProxy: document.getElementById('vod-search-proxy').value.trim() || undefined,
            parseProxy: document.getElementById('vod-parse-proxy').value.trim() || undefined,
            parseId: document.getElementById('vod-parse-id').value.trim() || undefined
        };

        if (this.editingIndex === -1) {
            this.sources.push(source);
        } else {
            this.sources[this.editingIndex] = source;
        }

        this.saveSources();
        this.renderList();
        this.closeModal();
        App.showToast('保存成功', 'success');
    }

    editSource(index) {
        this.openModal(index);
    }

    deleteSource(index) {
        if (confirm(`确定要删除「${this.sources[index].name}」吗？`)) {
            this.sources.splice(index, 1);
            this.saveSources();
            this.renderList();
            App.showToast('删除成功', 'success');
        }
    }

    handleFileImport(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                let sources = [];

                // 支持多种格式
                if (Array.isArray(data)) {
                    sources = data;
                } else if (data.vodSources) {
                    sources = data.vodSources;
                } else if (data.sources) {
                    sources = data.sources;
                }

                if (sources.length > 0) {
                    this.sources = sources;
                    this.saveSources();
                    this.renderList();
                    App.showToast(`成功导入 ${sources.length} 个源`, 'success');
                } else {
                    App.showToast('未找到有效的源配置', 'error');
                }
            } catch (error) {
                App.showToast('文件格式错误', 'error');
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

window.VodEditor = VodEditor;
