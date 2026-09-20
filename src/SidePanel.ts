import { AssetCard } from './AssetCard';
import { Asset } from './script';

export class SidePanel extends HTMLElement {
    private shadow: ShadowRoot;

    private _assets: Asset[] = [];

    constructor() {
        super();
        this.shadow = this.attachShadow({ mode: 'open' });
    }

    set assets(assets: Asset[]) {
        this._assets = assets;
        this.render();
    }

    private dispatchCloseCard(asset: Asset) {
        this.dispatchEvent(new CustomEvent('close-card', {
            detail: asset,
            bubbles: true,
            cancelable: true
        }));
    }

    private render() {
        const sidePanel = this.shadow.querySelector('.side-panel');
        if (!sidePanel) return;

        const elements = this._assets.map(metadata => {
            const assetCard = document.createElement('asset-card') as AssetCard;
            assetCard.asset = metadata;
            assetCard.addEventListener('close-card', () => {
                this.dispatchCloseCard(metadata);
            }, { once: true });
            return assetCard;
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
