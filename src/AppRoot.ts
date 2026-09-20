import { AssetMap } from './AssetMap';
import { LocationSelector } from './LocationSelector';
import { BottomBar } from './BottomBar';
import { BeancountLocation, Asset } from './script';
import { SidePanel } from './SidePanel';
import { AssetsService } from './AssetsService';

async function fetchLocations(): Promise<BeancountLocation[]> {
    const res = await fetch('/locations');
    return res.json();
}

async function fetchAssets(): Promise<Asset[]> {
    const res = await fetch('/metadata');
    return res.json();
}

async function fetchGeoJson(source: string): Promise<any> {
    const res = await fetch(source);
    return res.json();
}

export class AppRoot extends HTMLElement {
    private as = AssetsService.instance;

    private _assetMap: AssetMap | null = null;
    private _locationSelector: LocationSelector | null = null;
    private _bottomBar: BottomBar | null = null;
    private _sidePanel: SidePanel | null = null;

    private _locations: BeancountLocation[] = [];
    private _selectedAssets: Asset[] = [];

    connectedCallback(): void {
        this.style.display = 'block';
        this.style.width = '100%';
        this.style.height = '100%';
        this.style.position = 'relative';

        this._assetMap = document.createElement('asset-map') as AssetMap;
        this.appendChild(this._assetMap);
        this._assetMap.addEventListener('select-object', (ev) => {
            const metadata = (ev as CustomEvent<Asset>).detail;
            this.addSelectedAsset(metadata);
        });

        this.init();
    }

    set selectedAssets(selectedAssets: Asset[]) {
        this._selectedAssets = selectedAssets;
        if (this._sidePanel) {
            this._sidePanel.assets = selectedAssets;
        }
    }

    disconnectedCallback(): void {
        this._locationSelector?.remove();
        this._bottomBar?.remove();
        this._sidePanel?.remove();
    }

    private async init(): Promise<void> {
        const [locations, assets] = await Promise.all([
            fetchLocations(),
            fetchAssets().catch((err) => {
                console.warn('Failed to fetch beancount metadata:', err);
                return [] as Asset[];
            })
        ]);

        this._locations = locations;
        this.as.assets = assets;

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

    private addSelectedAsset(asset: Asset) {
        const exists = this._selectedAssets.some(item => item.id === asset.id);
        if (exists) return;

        this.selectedAssets = this._selectedAssets.concat(asset);
    }

    private removeSelectedAsset(id: string) {
        this.selectedAssets = this._selectedAssets.filter(item => item.id !== id);
    }

    private showSidePanel(): void {
        const sidePanel = document.createElement('side-panel') as SidePanel;
        this._sidePanel = sidePanel;
        this.appendChild(sidePanel);

        AssetsService.onChange(() => {
            this.selectedAssets = this._selectedAssets
                .map(({ id }) => this.as.getAssetById(id))
                .filter(a => !!a);
        });

        sidePanel.addEventListener('close-card', (ev) => {
            const asset = (ev as CustomEvent<Asset>).detail;
            this.removeSelectedAsset(asset.id);
        });
    }

    private async loadLocation(location: BeancountLocation): Promise<void> {
        const geojson = await fetchGeoJson(location.filename);

        if (this._assetMap) {
            this._assetMap.locationsMetadata = this.as.assets;
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
            this._selectedAssets = [];

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
