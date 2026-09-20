import { AssetContentsList } from './AssetContentsList';
import { AssetItemCard } from './AssetItemCard';
import { Metadata } from './script';

export class AssetCard extends HTMLElement {
    private shadow: ShadowRoot;

    private _metadata: Metadata | null = null;

    constructor() {
        super();
        this.shadow = this.attachShadow({ mode: 'open' });
    }

    set metadata(metadata: Metadata) {
        this._metadata = metadata;
        this.render();
    }

    private render() {
        const titleEl = this.shadow.querySelector('#panel-title');
        const subtitleEl = this.shadow.querySelector('#panel-subtitle');
        const badgeEl = this.shadow.querySelector('#panel-type-badge');
        const contentsListEl = this.shadow.querySelector('asset-contents-list');
        if (!titleEl || !subtitleEl || !badgeEl || !contentsListEl) return;

        const name = this._metadata?.name || 'Asset';
        const type = this._metadata?.type || 'Asset';
        const id = this._metadata?.id || '';

        titleEl.textContent = name;
        subtitleEl.textContent = id;
        badgeEl.textContent = type;
        badgeEl.classList.add(type.toLowerCase());

        contentsListEl.contents = this._metadata?.contents || [];
    }

    connectedCallback() {
        this.shadow.innerHTML = `
            <style>
                .card {
                    background: rgba(30, 41, 59, 0.95);
                    backdrop-filter: blur(16px);
                    -webkit-backdrop-filter: blur(16px);
                    border: 1px solid #334155;
                    border-radius: 16px;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease;
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
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
            </style>
            <div class="card">
                <div class="panel-header">
                    <div class="panel-title-container">
                        <span class="panel-type-badge" id="panel-type-badge">Location</span>
                        <h3 class="panel-title" id="panel-title">Details</h3>
                        <span class="panel-subtitle" id="panel-subtitle"></span>
                    </div>
                    <button id="close-panel-btn" class="close-btn" title="Close Panel">&times;</button>
                </div>
                <asset-contents-list></asset-contents-list>
            </div>
        `;

        this.shadow.querySelector('#close-panel-btn')?.addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent("close-card", {
                bubbles: true,
                cancelable: true,
            }));
        });

        this.render();
    }

}

customElements.define('asset-card', AssetCard);

declare global {
  interface HTMLElementTagNameMap {
    'asset-card': AssetCard;
  }
}
