/**
 * Dailymotion 频道编辑器组件
 */

class DmEditor {
    constructor(container) {
        this.container = container;
        this.channels = [];
        this.editingIndex = -1;
        this.init();
    }

    init() {
        this.render();
        this.loadChannels();
    }

    loadChannels() {
        this.channels = StorageModule.loadDmChannels();
        this.renderList();
    }

    saveChannels() {
        StorageModule.saveDmChannels(this.channels);
    }

    getChannels() {
        return this.channels;
    }

    setChannels(channels) {
        this.channels = channels;
        this.saveChannels();
        this.renderList();
    }

    render() {
        this.container.innerHTML = `
      <div class="editor-header">
        <h2>Dailymotion 频道配置</h2>
        <div class="header-actions">
          <button class="btn btn-secondary" id="dm-import-json">
            <i data-lucide="folder-input"></i>
            <span>导入JSON</span>
          </button>
          <button class="btn btn-primary" id="dm-add-btn">
            <i data-lucide="plus"></i>
            <span>添加频道</span>
          </button>
        </div>
      </div>
      
      <div class="source-list" id="dm-channel-list"></div>
      
      <!-- 编辑弹窗 -->
      <div class="modal" id="dm-edit-modal">
        <div class="modal-content">
          <div class="modal-header">
            <h3 id="dm-modal-title">添加频道</h3>
            <button class="modal-close" id="dm-modal-close">
              <i data-lucide="x"></i>
            </button>
          </div>
          <div class="modal-body">
            <div class="form-grid">
              <div class="form-group">
                <label>用户名 <span class="required">*</span></label>
                <input type="text" id="dm-username" placeholder="例如: kchow125">
              </div>
              <div class="form-group">
                <label>显示名称 <span class="required">*</span></label>
                <input type="text" id="dm-displayname" placeholder="例如: KChow125">
              </div>
              <div class="form-group full-width">
                <label>头像 URL (可选)</label>
                <input type="text" id="dm-avatar" placeholder="https://...">
              </div>
              <div class="form-group">
                <label class="checkbox-label">
                  <input type="checkbox" id="dm-active" checked>
                  <span>启用</span>
                </label>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" id="dm-cancel-btn">
              <i data-lucide="x"></i>
              <span>取消</span>
            </button>
            <button class="btn btn-primary" id="dm-save-btn">
              <i data-lucide="check"></i>
              <span>保存</span>
            </button>
          </div>
        </div>
      </div>
      
      <input type="file" id="dm-file-input" accept=".json" style="display: none">
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
        document.getElementById('dm-add-btn').addEventListener('click', () => {
            this.openModal(-1);
        });

        // 导入JSON
        document.getElementById('dm-import-json').addEventListener('click', () => {
            document.getElementById('dm-file-input').click();
        });

        document.getElementById('dm-file-input').addEventListener('change', (e) => {
            this.handleFileImport(e);
        });

        // 弹窗事件
        document.getElementById('dm-modal-close').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('dm-cancel-btn').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('dm-save-btn').addEventListener('click', () => {
            this.saveChannel();
        });

        // 点击遮罩关闭
        document.getElementById('dm-edit-modal').addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal();
            }
        });
    }

    renderList() {
        const list = document.getElementById('dm-channel-list');

        if (this.channels.length === 0) {
            list.innerHTML = `
        <div class="empty-state">
          <i data-lucide="play-circle" class="empty-icon"></i>
          <p>暂无频道配置</p>
          <p class="hint">点击「添加频道」按钮开始添加 Dailymotion 频道，或导入 JSON 配置文件</p>
        </div>
      `;
            this.refreshIcons();
            return;
        }

        list.innerHTML = this.channels.map((channel, index) => `
      <div class="source-item ${!channel.isActive ? 'disabled' : ''}" data-index="${index}">
        <div class="source-info">
          <div class="source-header">
            <div class="avatar">
              ${channel.avatarUrl
                ? `<img src="${this.escapeHtml(channel.avatarUrl)}" alt="${this.escapeHtml(channel.displayName)}">`
                : `<span>${channel.displayName.charAt(0).toUpperCase()}</span>`
            }
            </div>
            <div>
              <h4>${this.escapeHtml(channel.displayName)}</h4>
              <p class="username">@${this.escapeHtml(channel.username)}</p>
            </div>
            ${!channel.isActive ? '<span class="status-badge inactive">已禁用</span>' : ''}
          </div>
        </div>
        <div class="source-actions">
          <button class="btn-icon" onclick="dmEditor.editChannel(${index})" title="编辑">
            <i data-lucide="pencil"></i>
          </button>
          <button class="btn-icon danger" onclick="dmEditor.deleteChannel(${index})" title="删除">
            <i data-lucide="trash-2"></i>
          </button>
        </div>
      </div>
    `).join('');

        this.refreshIcons();
    }

    openModal(index) {
        this.editingIndex = index;
        const modal = document.getElementById('dm-edit-modal');
        const title = document.getElementById('dm-modal-title');

        if (index === -1) {
            title.textContent = '添加频道';
            this.clearForm();
        } else {
            title.textContent = '编辑频道';
            this.fillForm(this.channels[index]);
        }

        modal.classList.add('active');
    }

    closeModal() {
        document.getElementById('dm-edit-modal').classList.remove('active');
        this.editingIndex = -1;
    }

    clearForm() {
        document.getElementById('dm-username').value = '';
        document.getElementById('dm-displayname').value = '';
        document.getElementById('dm-avatar').value = '';
        document.getElementById('dm-active').checked = true;
    }

    fillForm(channel) {
        document.getElementById('dm-username').value = channel.username || '';
        document.getElementById('dm-displayname').value = channel.displayName || '';
        document.getElementById('dm-avatar').value = channel.avatarUrl || '';
        document.getElementById('dm-active').checked = channel.isActive !== false;
    }

    saveChannel() {
        const username = document.getElementById('dm-username').value.trim();
        const displayName = document.getElementById('dm-displayname').value.trim();

        if (!username || !displayName) {
            App.showToast('请填写必填字段', 'error');
            return;
        }

        // 检查 username 是否重复
        const existingIndex = this.channels.findIndex(c => c.username === username);
        if (existingIndex !== -1 && existingIndex !== this.editingIndex) {
            App.showToast('用户名已存在', 'error');
            return;
        }

        const channel = {
            username,
            displayName,
            avatarUrl: document.getElementById('dm-avatar').value.trim() || undefined,
            isActive: document.getElementById('dm-active').checked
        };

        if (this.editingIndex === -1) {
            this.channels.push(channel);
        } else {
            this.channels[this.editingIndex] = channel;
        }

        this.saveChannels();
        this.renderList();
        this.closeModal();
        App.showToast('保存成功', 'success');
    }

    editChannel(index) {
        this.openModal(index);
    }

    deleteChannel(index) {
        if (confirm(`确定要删除频道「${this.channels[index].displayName}」吗？`)) {
            this.channels.splice(index, 1);
            this.saveChannels();
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
                let channels = [];

                // 支持多种格式
                if (Array.isArray(data)) {
                    channels = data;
                } else if (data.dailymotionChannels) {
                    channels = data.dailymotionChannels;
                } else if (data.channels) {
                    channels = data.channels;
                }

                if (channels.length > 0) {
                    this.channels = channels;
                    this.saveChannels();
                    this.renderList();
                    App.showToast(`成功导入 ${channels.length} 个频道`, 'success');
                } else {
                    App.showToast('未找到有效的频道配置', 'error');
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

window.DmEditor = DmEditor;
