import { AssetCard } from './AssetCard';
import { Metadata } from './script';

export class SidePanel extends HTMLElement {
    private shadow: ShadowRoot;

    private _data: Metadata[] = [];

    constructor() {
        super();
        this.shadow = this.attachShadow({ mode: 'open' });
    }

    set data(data: Metadata[]) {
        this._data = data;
        this.render();
    }

    private dispatchCloseCard(data: Metadata) {
        this.dispatchEvent(new CustomEvent('close-card', {
            detail: data,
            bubbles: true,
            cancelable: true
        }));
    }

    private render() {
        const sidePanel = this.shadow.querySelector('.side-panel');
        if (!sidePanel) return;

        const elements = this._data.map(metadata => {
            const item = document.createElement('asset-card') as AssetCard;
            item.metadata = metadata;
            item.addEventListener('close-card', () => {
                this.dispatchCloseCard(metadata);
            }, { once: true });
            return item;
        });
        sidePanel.replaceChildren(...elements);
    }

    connectedCallback() {
        this.shadow.innerHTML = `
            <style>
                .side-panel {
                    position: fixed;
                    top: 16px;
                    right: 16px;
                    bottom: 16px;
                    width: 360px;
                    max-width: calc(100vw - 32px);
                    z-index: 1500;
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }
            </style>
            <div class="side-panel">
            </div>
        `;

        this.render();
    }
}

customElements.define('side-panel', SidePanel);

declare global {
  interface HTMLElementTagNameMap {
    'side-panel': SidePanel;
  }
}
