import { BeancountLocation } from "./script";

export class LocationItem extends HTMLElement {
    private shadow: ShadowRoot;

    private _locationData: BeancountLocation | null = null;
    private _isSelected: boolean = false;

    constructor() {
        super();
        this.shadow = this.attachShadow({ mode: 'open' });
    }

    set location(data: BeancountLocation) {
        this._locationData = data;
        this.render();
    }
    set selected(value: boolean) {
        this._isSelected = value;
        this.render();
    }

    private render(): void {
        const item = this.shadow.querySelector('.location-item');
        const itemName = this.shadow.querySelector('.location-name');
        const itemFile = this.shadow.querySelector('.location-file');
        if (!item || !itemName || !itemFile) return;

        item.classList.toggle('selected', this._isSelected);
        itemName.textContent = this._locationData?.name || 'unknown';
        itemFile.textContent = this._locationData?.filename || 'unknown';
      }

    connectedCallback(): void {
        this.shadow.innerHTML = `
            <style>
                .location-item {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 14px 16px;
                    border-radius: 12px;
                    background: #0f172a;
                    border: 2px solid #334155;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                }
                .location-item:hover {
                    border-color: #3b82f6;
                    background: #1e293b;
                    transform: translateY(-1px);
                }
                .location-item.selected {
                    border-color: #3b82f6;
                    background: rgba(59, 130, 246, 0.12);
                }
                .location-info {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .location-icon {
                    width: 40px;
                    height: 40px;
                    border-radius: 10px;
                    background: #334155;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 20px;
                    color: #60a5fa;
                    flex-shrink: 0;
                }
                .location-details {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }
                .location-name {
                    font-weight: 600;
                    font-size: 15px;
                    color: #f8fafc;
                }
                .location-file {
                    font-size: 12px;
                    color: #64748b;
                    font-family: monospace;
                }
                .badge {
                    font-size: 11px;
                    font-weight: 600;
                    padding: 4px 8px;
                    border-radius: 6px;
                    background: #334155;
                    color: #94a3b8;
                }
                .location-item.selected .badge {
                    background: #3b82f6;
                    color: #ffffff;
                }
            </style>
            <div class="location-item">
                <div class="location-info">
                    <div class="location-icon">🏠</div>
                    <div class="location-details">
                        <span class="location-name"></span>
                        <span class="location-file"></span>
                    </div>
                </div>
                <span class="badge">GeoJSON</span>
            </div>
        `;

        this.render();
    }
}

customElements.define('location-item', LocationItem);

declare global {
  interface HTMLElementTagNameMap {
    'location-item': LocationItem;
  }
}
