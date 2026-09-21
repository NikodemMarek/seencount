export class DraggableElement extends HTMLElement {
    private shadow: ShadowRoot;

    constructor() {
        super();
        this.shadow = this.attachShadow({ mode: 'open' });
    }

    connectedCallback(): void {
        this.shadow.innerHTML = `
            <style>
                :host {
                    position: absolute;
                    z-index: 2000;
                    pointer-events: none;
                }

                ::slotted(*) {
                    box-sizing: border-box;
                }
            </style>
            <slot></slot>
        `;

        const positionChange = (ev: MouseEvent) => {
            this.style.left = `${ev.x}px`;
            this.style.top = `${ev.y}px`;
        };

        document.addEventListener('mousemove', positionChange);
        document.addEventListener('mouseup', () => {
            document.removeEventListener('mousemove', positionChange);
            this.remove();
        });
    }
}

customElements.define('draggable-element', DraggableElement);

declare global {
    interface HTMLElementTagNameMap {
        'draggable-element': DraggableElement;
    }
}
