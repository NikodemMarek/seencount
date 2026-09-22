export class BottomBar extends HTMLElement {
    private shadow: ShadowRoot;

    private _location: string = 'None';

    constructor() {
        super();
        this.shadow = this.attachShadow({ mode: 'open' });
    }

    set location(location: string) {
        this._location = location;
        this.render()
    }

    private render() {
        const label = this.shadow.querySelector('#current-location-label');
        if (!label) return;

        label.textContent = this._location;
    }

    connectedCallback() {
        this.shadow.innerHTML = `
            <style>
                .bottom-bar {
                    position: absolute;
                    bottom: 16px;
                    left: 16px;
                    z-index: 1000;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    background: rgba(30, 41, 59, 0.9);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    border: 1px solid #334155;
                    padding: 10px 16px;
                    border-radius: 12px;
                    box-shadow: 0 10px 25px -5px rgba(0,0,0,0.4);
                    transition: opacity 0.3s ease;
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                }
                .active-location-name {
                    font-weight: 600;
                    font-size: 14px;
                    color: #f8fafc;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .btn-secondary {
                    padding: 6px 12px;
                    border-radius: 8px;
                    background: #334155;
                    color: #e2e8f0;
                    font-size: 13px;
                    font-weight: 500;
                    border: 1px solid #475569;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .btn-secondary:hover {
                    background: #475569;
                    color: #ffffff;
                    border-color: #64748b;
                }
            </style>
            <div class="bottom-bar">
                <button id="change-location-btn" class="btn-secondary">📍 Change Location</button>
                <button id="contents-btn" class="btn-secondary">📦 Contents</button>
                <span class="active-location-name" id="current-location-label"></span>
            </div>
        `;

        this.shadow.querySelector('#change-location-btn')?.addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('change-location', {
                bubbles: true,
                composed: true
            }));
        });
        this.shadow.querySelector('#contents-btn')?.addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('show-contents', {
                bubbles: true,
                composed: true
            }));
        });

        this.render();
    }

}

customElements.define('bottom-bar', BottomBar);

declare global {
  interface HTMLElementTagNameMap {
    'bottom-bar': BottomBar;
  }
}
