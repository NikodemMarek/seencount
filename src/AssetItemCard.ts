import { AssetContent } from "./script";

export class AssetItemCard extends HTMLElement {
    private shadow: ShadowRoot;

    private _content: AssetContent | null = null;
    private _ghost: boolean = false;

    constructor() {
        super();
        this.shadow = this.attachShadow({ mode: 'open' });
    }

    get content(): AssetContent {
        return this._content!;
    }
    set content(content: AssetContent) {
        this._content = content;
        this.render();
    }
    set ghost(ghost: boolean) {
        this._ghost = ghost;
        this.toggleAttribute('ghost', ghost);
    }

    private render() {
        const itemName = this.shadow.querySelector('.item-name');
        const itemQuantityBadge = this.shadow.querySelector('.item-qty-badge');
        if (!itemName || !itemQuantityBadge) return;

        const name = this._content?.asset || 'Asset';
        itemName.textContent = name;
        itemQuantityBadge.textContent = `${this._content?.quantity || '?'} ${name}`;
    }

    connectedCallback(): void {
        this.shadow.innerHTML = `
            <style>
                :host {
                    display: block;
                    transition: opacity 0.2s ease, filter 0.2s ease;
                }
                :host([ghost]) {
                    opacity: 0.5;
                    filter: brightness(0.7) saturate(0.5);
                    pointer-events: none;
                    cursor: default;
                }
                .item-card {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 12px 14px;
                    background: #0f172a;
                    border: 1px solid #334155;
                    border-radius: 12px;
                    transition: border-color 0.2s ease;
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                }
                .item-card:hover {
                    border-color: #3b82f6;
                }
                .item-info {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .item-icon {
                    width: 34px;
                    height: 34px;
                    border-radius: 8px;
                    background: #1e293b;
                    border: 1px solid #334155;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 16px;
                }
                .item-name {
                    font-size: 14px;
                    font-weight: 600;
                    color: #f8fafc;
                }
                .item-qty-badge {
                    font-size: 13px;
                    font-weight: 700;
                    color: #60a5fa;
                    background: rgba(59, 130, 246, 0.15);
                    padding: 4px 10px;
                    border-radius: 8px;
                    border: 1px solid rgba(59, 130, 246, 0.3);
                }
            </style>
            <div class="item-card">
                <div class="item-info">
                    <div class="item-icon">📦</div>
                    <span class="item-name"></span>
                </div>
                <span class="item-qty-badge"></span>
            </div>
        `;

        this.render();
    }
}

customElements.define('asset-item-card', AssetItemCard);

declare global {
    interface HTMLElementTagNameMap {
        'asset-item-card': AssetItemCard;
    }
}
