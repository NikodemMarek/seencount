import { AssetCard } from './AssetCard.js';

export class SidePanel extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.cardsData = [];
    }

    connectedCallback() {
        this.render();
    }

    addCard(metadata) {
        const exists = this.cardsData.some(item => item.id === metadata.id);
        if (exists) return;

        this.cardsData.push(metadata);
        this.renderSidePanel();
    }

    removeCard(id) {
        this.cardsData = this.cardsData.filter(item => item.id !== id);
        this.renderSidePanel();
    }

    close() {
        this.cardsData = [];
        this.renderSidePanel();
    }

    renderSidePanel() {
        const sidePanel = this.shadowRoot.querySelector('.side-panel');

        sidePanel.classList.toggle('hidden', this.cardsData.length === 0);

        const elements = this.cardsData.map(metadata => {
            const item = document.createElement('asset-card');
            item.metadata = metadata;
            item.addEventListener('close-card', () => this.removeCard(metadata.id));
            return item;
        });

        sidePanel.replaceChildren(...elements);
        elements.forEach((item) => {
            item.open(item.metadata);
        });
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
                    z-index: 1500;
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }
                .side-panel.hidden {
                    transform: translateX(390px);
                    opacity: 0;
                    pointer-events: none;
                }
            </style>
            <div class="side-panel hidden">
            </div>
        `;
    }
}
customElements.define('side-panel', SidePanel);
