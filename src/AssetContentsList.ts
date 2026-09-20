import { AssetItemCard } from "./AssetItemCard";
import { LocationContent } from "./script";

export class AssetContentsList extends HTMLElement {
    private shadow: ShadowRoot;

    private _contents: LocationContent[] = [];

    constructor() {
        super();
        this.shadow = this.attachShadow({ mode: 'open' });
    }

    set contents(contents: LocationContent[]) {
        this._contents = contents;
        this.render();
    }

    private render() {
        const emptyStateEl = this.shadow.querySelector('.empty-state');
        const countEl = this.shadow.querySelector('.contents-count-badge');
        const listEl = this.shadow.querySelector('.contents-list');
        if (!emptyStateEl || !countEl || !listEl) return;

        countEl.textContent = `${this._contents.length} ${this._contents.length === 1 ? 'item' : 'items'}`;

        if (this._contents.length === 0) {
            emptyStateEl.classList.remove('hidden');
            listEl.innerHTML = '';
        } else {
            emptyStateEl.classList.add('hidden');
            const items = this._contents.map(item => {
                const itemCard = document.createElement('asset-item-card') as AssetItemCard;
                itemCard.item = item;
                return itemCard;
            });

            listEl.replaceChildren(...items);
        };
    }

    connectedCallback() {
        this.shadow.innerHTML = `
            <style>
                :host {
                    padding: 20px;
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                    overflow-y: auto;
                }
                .section-title {
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
                .contents-list {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
                .empty-state {
                    display: flex;
                    text-align: center;
                    padding: 20px;
                    color: #94a3b8;
                    font-size: 14px;
                }
                .empty-state.hidden {
                    display: none;
                }
            </style>
            <div class="section-title">
                <span>Stored Assets</span>
                <span class="contents-count-badge">0 items</span>
            </div>
            <div class="contents-list"></div>
            <div class="empty-state">No items stored in this location</div>
        `;

        this.render();
    }
}

customElements.define('asset-contents-list', AssetContentsList);

declare global {
  interface HTMLElementTagNameMap {
    'asset-contents-list': AssetContentsList;
  }
}
