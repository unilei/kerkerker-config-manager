/**
 * 短剧源编辑器组件
 */

class ShortsEditor {
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
        this.sources = StorageModule.loadShortsSources();
        this.renderList();
    }

    saveSources() {
        StorageModule.saveShortsSources(this.sources);
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
        <h2>短剧源配置</h2>
        <div class="header-actions">
          <button class="btn btn-secondary" id="shorts-import-json">
            <i data-lucide="folder-input"></i>
            <span>导入JSON</span>
          </button>
          <button class="btn btn-primary" id="shorts-add-btn">
            <i data-lucide="plus"></i>
            <span>添加源</span>
          </button>
        </div>
      </div>
      
      <div class="source-list" id="shorts-source-list"></div>
      
      <!-- 编辑弹窗 -->
      <div class="modal" id="shorts-edit-modal">
        <div class="modal-content">
          <div class="modal-header">
            <h3 id="shorts-modal-title">添加短剧源</h3>
            <button class="modal-close" id="shorts-modal-close">
              <i data-lucide="x"></i>
            </button>
          </div>
          <div class="modal-body">
            <div class="form-grid">
              <div class="form-group">
                <label>Key (唯一标识) <span class="required">*</span></label>
                <input type="text" id="shorts-key" placeholder="例如: wwzy">
              </div>
              <div class="form-group">
                <label>名称 <span class="required">*</span></label>
                <input type="text" id="shorts-name" placeholder="例如: 旺旺资源">
              </div>
              <div class="form-group full-width">
                <label>API 地址 <span class="required">*</span></label>
                <input type="text" id="shorts-api" placeholder="https://...">
              </div>
              <div class="form-group">
                <label>分类 ID (可选)</label>
                <input type="number" id="shorts-typeid" placeholder="短剧分类 ID">
                <p class="hint-small">不同资源站的短剧分类 ID 不同，留空则获取全部</p>
              </div>
              <div class="form-group">
                <label>优先级</label>
                <input type="number" id="shorts-priority" value="0" min="0">
                <p class="hint-small">数值越小优先级越高</p>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" id="shorts-cancel-btn">
              <i data-lucide="x"></i>
              <span>取消</span>
            </button>
            <button class="btn btn-primary" id="shorts-save-btn">
              <i data-lucide="check"></i>
              <span>保存</span>
            </button>
          </div>
        </div>
      </div>
      
      <input type="file" id="shorts-file-input" accept=".json" style="display: none">
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
        document.getElementById('shorts-add-btn').addEventListener('click', () => {
            this.openModal(-1);
        });

        // 导入JSON
        document.getElementById('shorts-import-json').addEventListener('click', () => {
            document.getElementById('shorts-file-input').click();
        });

        document.getElementById('shorts-file-input').addEventListener('change', (e) => {
            this.handleFileImport(e);
        });

        // 弹窗事件
        document.getElementById('shorts-modal-close').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('shorts-cancel-btn').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('shorts-save-btn').addEventListener('click', () => {
            this.saveSource();
        });

        // 点击遮罩关闭
        document.getElementById('shorts-edit-modal').addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal();
            }
        });
    }

    renderList() {
        const list = document.getElementById('shorts-source-list');

        if (this.sources.length === 0) {
            list.innerHTML = `
        <div class="empty-state">
          <i data-lucide="film" class="empty-icon"></i>
          <p>暂无短剧源配置</p>
          <p class="hint">点击「添加源」按钮开始添加短剧源，或导入 JSON 配置文件</p>
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
              ${source.typeId ? `<p><span class="label">分类 ID:</span> ${source.typeId}</p>` : ''}
            </div>
          </div>
          <div class="source-actions">
            <button class="btn-icon" onclick="shortsEditor.editSource(${originalIndex})" title="编辑">
              <i data-lucide="pencil"></i>
            </button>
            <button class="btn-icon danger" onclick="shortsEditor.deleteSource(${originalIndex})" title="删除">
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
        const modal = document.getElementById('shorts-edit-modal');
        const title = document.getElementById('shorts-modal-title');

        if (index === -1) {
            title.textContent = '添加短剧源';
            this.clearForm();
            document.getElementById('shorts-priority').value = this.sources.length;
        } else {
            title.textContent = '编辑短剧源';
            this.fillForm(this.sources[index]);
        }

        modal.classList.add('active');
    }

    closeModal() {
        document.getElementById('shorts-edit-modal').classList.remove('active');
        this.editingIndex = -1;
    }

    clearForm() {
        document.getElementById('shorts-key').value = '';
        document.getElementById('shorts-name').value = '';
        document.getElementById('shorts-api').value = '';
        document.getElementById('shorts-typeid').value = '';
        document.getElementById('shorts-priority').value = '0';
    }

    fillForm(source) {
        document.getElementById('shorts-key').value = source.key || '';
        document.getElementById('shorts-name').value = source.name || '';
        document.getElementById('shorts-api').value = source.api || '';
        document.getElementById('shorts-typeid').value = source.typeId || '';
        document.getElementById('shorts-priority').value = source.priority || 0;
    }

    saveSource() {
        const key = document.getElementById('shorts-key').value.trim();
        const name = document.getElementById('shorts-name').value.trim();
        const api = document.getElementById('shorts-api').value.trim();

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

        const typeIdValue = document.getElementById('shorts-typeid').value.trim();

        const source = {
            key,
            name,
            api,
            typeId: typeIdValue ? parseInt(typeIdValue) : undefined,
            priority: parseInt(document.getElementById('shorts-priority').value) || 0,
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
                } else if (data.shortsSources) {
                    sources = data.shortsSources;
                } else if (data.sources) {
                    sources = data.sources;
                }

                if (sources.length > 0) {
                    this.sources = sources;
                    this.saveSources();
                    this.renderList();
                    App.showToast(`成功导入 ${sources.length} 个短剧源`, 'success');
                } else {
                    App.showToast('未找到有效的短剧源配置', 'error');
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

window.ShortsEditor = ShortsEditor;
