import { LocationItem } from './LocationItem.js';

export class LocationSelector extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.selectedLocation = null;
    }

    connectedCallback() {
        this.render();
    }

    setLocations(locations) {
        const listContainer = this.shadowRoot.querySelector('#locations-list');
        const previewBtn = this.shadowRoot.querySelector('#preview-btn');
        if (!listContainer) return;

        listContainer.innerHTML = '';

        if (!locations || locations.length === 0) {
            listContainer.innerHTML = '<div class="empty-state">No locations available</div>';
            previewBtn.disabled = true;
            return;
        }

        locations.forEach((loc, index) => {
            const item = document.createElement('location-item');
            item.setLocation(loc);

            item.addEventListener('click', () => {
                this.shadowRoot.querySelectorAll('location-item').forEach(el => el.setSelected(false));
                item.setSelected(true);
                this.selectedLocation = loc;
                previewBtn.disabled = false;
            });

            item.addEventListener('dblclick', () => {
                this.selectedLocation = loc;
                this.dispatchEvent(new CustomEvent('location-selected', {
                    detail: { location: this.selectedLocation },
                    bubbles: true,
                    composed: true
                }));
            });

            listContainer.appendChild(item);

            if (index === 0) {
                item.setSelected(true);
                this.selectedLocation = loc;
                previewBtn.disabled = false;
            }
        });
    }

    show() {
        const overlay = this.shadowRoot.querySelector('.overlay');
        if (overlay) overlay.classList.remove('hidden');
    }

    hide() {
        const overlay = this.shadowRoot.querySelector('.overlay');
        if (overlay) overlay.classList.add('hidden');
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                .overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(15, 23, 42, 0.75);
                    backdrop-filter: blur(10px);
                    -webkit-backdrop-filter: blur(10px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 2000;
                    padding: 20px;
                    opacity: 1;
                    visibility: visible;
                    transition: opacity 0.3s ease, visibility 0.3s ease;
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                }
                .overlay.hidden {
                    opacity: 0;
                    visibility: hidden;
                    pointer-events: none;
                }
                .modal-card {
                    background: #1e293b;
                    border: 1px solid #334155;
                    border-radius: 16px;
                    width: 100%;
                    max-width: 480px;
                    padding: 28px;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                    animation: modalIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                }
                @keyframes modalIn {
                    from {
                        opacity: 0;
                        transform: scale(0.95) translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1) translateY(0);
                    }
                }
                .modal-header h2 {
                    margin: 0 0 6px 0;
                    font-size: 22px;
                    font-weight: 700;
                    color: #f8fafc;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .modal-header p {
                    margin: 0;
                    font-size: 14px;
                    color: #94a3b8;
                    line-height: 1.5;
                }
                .locations-list {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    max-height: 280px;
                    overflow-y: auto;
                    padding-right: 4px;
                }
                .btn-primary {
                    width: 100%;
                    padding: 14px 18px;
                    border-radius: 12px;
                    background: #3b82f6;
                    color: #ffffff;
                    font-weight: 600;
                    font-size: 15px;
                    border: none;
                    cursor: pointer;
                    transition: background 0.2s ease, transform 0.1s ease;
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
                }
                .btn-primary:hover:not(:disabled) {
                    background: #2563eb;
                    transform: translateY(-1px);
                }
                .btn-primary:disabled {
                    background: #334155;
                    color: #64748b;
                    cursor: not-allowed;
                    box-shadow: none;
                }
                .empty-state {
                    text-align: center;
                    padding: 20px;
                    color: #94a3b8;
                    font-size: 14px;
                }
            </style>
            <div class="overlay">
                <div class="modal-card">
                    <div class="modal-header">
                        <h2>Select Location</h2>
                    </div>
                    <div id="locations-list" class="locations-list">
                        <div class="empty-state">Loading available locations...</div>
                    </div>
                    <button id="preview-btn" class="btn-primary" disabled>Preview Location</button>
                </div>
            </div>
        `;

        this.shadowRoot.querySelector('#preview-btn').addEventListener('click', () => {
            if (this.selectedLocation) {
                this.dispatchEvent(new CustomEvent('location-selected', {
                    detail: { location: this.selectedLocation },
                    bubbles: true,
                    composed: true
                }));
            }
        });
    }
}
customElements.define('location-selector', LocationSelector);
