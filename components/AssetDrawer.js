import { AssetItemCard } from './AssetItemCard.js';

export class AssetDrawer extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
    }

    open(metadata) {
        const titleEl = this.shadowRoot.querySelector('#panel-title');
        const subtitleEl = this.shadowRoot.querySelector('#panel-subtitle');
        const badgeEl = this.shadowRoot.querySelector('#panel-type-badge');
        const countEl = this.shadowRoot.querySelector('#panel-contents-count');
        const listEl = this.shadowRoot.querySelector('#panel-contents-list');

        const name = metadata?.name || '';
        const type = metadata?.type || '';
        const id = metadata?.id || '';

        titleEl.textContent = name;
        subtitleEl.textContent = id;
        badgeEl.textContent = type;
        badgeEl.className = `panel-type-badge ${type.toLowerCase()}`;

        const contents = metadata?.contents || [];
        countEl.textContent = `${contents.length} ${contents.length === 1 ? 'item' : 'items'}`;
        listEl.innerHTML = '';

        if (contents.length === 0) {
            listEl.innerHTML = '<div class="empty-state">No items stored in this location</div>';
        } else {
            contents.forEach(item => {
                const card = document.createElement('asset-item-card');
                card.setItem(item);
                listEl.appendChild(card);
            });
        }

        const panel = this.shadowRoot.querySelector('.side-panel');
        if (panel) panel.classList.remove('hidden');
    }

    close() {
        const panel = this.shadowRoot.querySelector('.side-panel');
        if (panel) panel.classList.add('hidden');
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                .side-panel {
                    position: fixed;
                    top: 16px;
                    right: 16px;
                    bottom: 16px;
                    width: 360px;
                    max-width: calc(100vw - 32px);
                    background: rgba(30, 41, 59, 0.95);
                    backdrop-filter: blur(16px);
                    -webkit-backdrop-filter: blur(16px);
                    border: 1px solid #334155;
                    border-radius: 16px;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
                    z-index: 1500;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease;
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                }
                .side-panel.hidden {
                    transform: translateX(390px);
                    opacity: 0;
                    pointer-events: none;
                }
                .panel-header {
                    padding: 20px;
                    border-bottom: 1px solid #334155;
                    display: flex;
                    align-items: flex-start;
                    justify-content: space-between;
                    gap: 12px;
                    background: rgba(15, 23, 42, 0.4);
                }
                .panel-title-container {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
                .panel-type-badge {
                    align-self: flex-start;
                    font-size: 11px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    padding: 3px 8px;
                    border-radius: 6px;
                    background: #3b82f6;
                    color: #ffffff;
                }
                .panel-type-badge.room {
                    background: #0284c7;
                }
                .panel-type-badge.container {
                    background: #9333ea;
                }
                .panel-type-badge.flat {
                    background: #475569;
                }
                .panel-title {
                    margin: 4px 0 0 0;
                    font-size: 20px;
                    font-weight: 700;
                    color: #f8fafc;
                }
                .panel-subtitle {
                    font-size: 12px;
                    color: #94a3b8;
                    font-family: monospace;
                    word-break: break-all;
                    line-height: 1.4;
                }
                .close-btn {
                    background: #334155;
                    border: none;
                    color: #94a3b8;
                    font-size: 20px;
                    width: 32px;
                    height: 32px;
                    border-radius: 8px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s ease;
                    flex-shrink: 0;
                }
                .close-btn:hover {
                    background: #475569;
                    color: #ffffff;
                }
                .panel-body {
                    padding: 20px;
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                    overflow-y: auto;
                }
                .panel-section-title {
                    font-size: 14px;
                    font-weight: 600;
                    color: #cbd5e1;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }
                .contents-count-badge {
                    font-size: 12px;
                    font-weight: 500;
                    background: #1e293b;
                    padding: 2px 8px;
                    border-radius: 12px;
                    border: 1px solid #334155;
                    color: #94a3b8;
                }
                .panel-contents-list {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
                .empty-state {
                    text-align: center;
                    padding: 20px;
                    color: #94a3b8;
                    font-size: 14px;
                }
            </style>
            <div class="side-panel hidden">
                <div class="panel-header">
                    <div class="panel-title-container">
                        <span class="panel-type-badge" id="panel-type-badge">Location</span>
                        <h3 class="panel-title" id="panel-title">Details</h3>
                        <span class="panel-subtitle" id="panel-subtitle"></span>
                    </div>
                    <button id="close-panel-btn" class="close-btn" title="Close Panel">&times;</button>
                </div>
                <div class="panel-body">
                    <div class="panel-section-title">
                        <span>Stored Assets</span>
                        <span class="contents-count-badge" id="panel-contents-count">0 items</span>
                    </div>
                    <div id="panel-contents-list" class="panel-contents-list">
                        <div class="empty-state">Select an object to inspect its contents</div>
                    </div>
                </div>
            </div>
        `;

        this.shadowRoot.querySelector('#close-panel-btn').addEventListener('click', () => {
            this.close();
        });
    }
}
customElements.define('asset-drawer', AssetDrawer);
