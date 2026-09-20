export class AssetItemCard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.itemData = null;
    }

    setItem(item) {
        this.itemData = item;
        this.render();
    }

    render() {
        if (!this.itemData) return;
        this.shadowRoot.innerHTML = `
            <style>
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
                    <span class="item-name">${this.itemData.asset}</span>
                </div>
                <span class="item-qty-badge">${this.itemData.quantity} ${this.itemData.asset}</span>
            </div>
        `;
    }
}
customElements.define('asset-item-card', AssetItemCard);
