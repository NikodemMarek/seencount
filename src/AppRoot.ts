import { AssetMap } from './AssetMap';
import { LocationSelector } from './LocationSelector';
import { BottomBar } from './BottomBar';
import { BeancountLocation, Metadata } from './script';
import { SidePanel } from './SidePanel';

async function fetchLocations(): Promise<BeancountLocation[]> {
    const res = await fetch('/locations');
    return res.json();
}

async function fetchMetadata(): Promise<Metadata[]> {
    const res = await fetch('/metadata');
    return res.json();
}

async function fetchGeoJson(source: string): Promise<any> {
    const res = await fetch(source);
    return res.json();
}

export class AppRoot extends HTMLElement {
    private _assetMap: AssetMap | null = null;
    private _locationSelector: LocationSelector | null = null;
    private _bottomBar: BottomBar | null = null;
    private _sidePanel: SidePanel | null = null;

    private _locations: BeancountLocation[] = [];
    private _metadata: Metadata[] = [];
    private _selectedLocations: Metadata[] = [];

    connectedCallback(): void {
        this.style.display = 'block';
        this.style.width = '100%';
        this.style.height = '100%';
        this.style.position = 'relative';

        this._assetMap = document.createElement('asset-map') as AssetMap;
        this.appendChild(this._assetMap);
        this._assetMap.addEventListener('select-object', (ev) => {
            const metadata = (ev as CustomEvent<Metadata>).detail;
            this.addSelectedLocation(metadata);
        });

        this.init();
    }

    disconnectedCallback(): void {
        this._locationSelector?.remove();
        this._bottomBar?.remove();
        this._sidePanel?.remove();
    }

    private async init(): Promise<void> {
        const [locations, metadata] = await Promise.all([
            fetchLocations(),
            fetchMetadata().catch((err) => {
                console.warn('Failed to fetch beancount metadata:', err);
                return [] as Metadata[];
            })
        ]);

        this._locations = locations;
        this._metadata = metadata;

        this.showLocationSelector();
    }

    private showLocationSelector(): void {
        const selector = document.createElement('location-selector') as LocationSelector;
        selector.locations = this._locations;
        this.appendChild(selector);
        this._locationSelector = selector;

        selector.addEventListener('location-selected', async (ev) => {
            const { location } = (ev as CustomEvent<{ location: BeancountLocation }>).detail;
            selector.remove();
            this._locationSelector = null;

            if (this._assetMap) {
                this._assetMap.geojson = null;
            }
            await this.loadLocation(location);
        }, { once: true });
    }

    private addSelectedLocation(metadata: Metadata) {
        const exists = this._selectedLocations.some(item => item.id === metadata.id);
        if (exists) return;

        this._selectedLocations.push(metadata);
        this._sidePanel!.data = this._selectedLocations;
    }

    private removeSelectedLocation(id: string) {
        this._selectedLocations = this._selectedLocations.filter(item => item.id !== id);
        this._sidePanel!.data = this._selectedLocations;
    }

    private showSidePanel(): void {
        const sidePanel = document.createElement('side-panel') as SidePanel;
        this._sidePanel = sidePanel;
        this.appendChild(sidePanel);

        sidePanel.addEventListener('close-card', (ev) => {
            const data = (ev as CustomEvent<Metadata>).detail;
            this.removeSelectedLocation(data.id);
        });
    }

    private async loadLocation(location: BeancountLocation): Promise<void> {
        const geojson = await fetchGeoJson(location.filename);

        if (this._assetMap) {
            this._assetMap.locationsMetadata = this._metadata;
            this._assetMap.geojson = geojson;
        }

        this.showBottomBar(location.name);
        this.showSidePanel();
    }

    private showBottomBar(locationName: string): void {
        const bar = document.createElement('bottom-bar') as BottomBar;
        bar.location = locationName;
        this.appendChild(bar);
        this._bottomBar = bar;

        bar.addEventListener('change-location', () => {
            bar.remove();
            this._bottomBar = null;

            this._sidePanel?.remove();
            this._sidePanel = null;
            this._selectedLocations = [];

            this.showLocationSelector();
        }, { once: true });
    }
}

customElements.define('app-root', AppRoot);

declare global {
    interface HTMLElementTagNameMap {
        'app-root': AppRoot;
    }
}
