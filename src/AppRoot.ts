import { AssetMap } from './AssetMap';
import { LocationSelector } from './LocationSelector';
import { BottomBar } from './BottomBar';
import { BeancountLocation, Asset, Assets, isContainer } from './script';
import { SidePanel } from './SidePanel';
import { AssetsService } from './AssetsService';

async function fetchLocations(): Promise<BeancountLocation[]> {
    const res = await fetch('/locations');
    return res.json();
}

async function fetchAssets(): Promise<Assets> {
    const res = await fetch('/assets');
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
    private _selectedAssetsIds: Set<string> = new Set();

    connectedCallback(): void {
        this.style.display = 'block';
        this.style.width = '100%';
        this.style.height = '100%';
        this.style.position = 'relative';

        this._assetMap = document.createElement('asset-map') as AssetMap;
        this.appendChild(this._assetMap);
        this._assetMap.addEventListener('select-object', (ev) => {
            const id = (ev as CustomEvent<string>).detail;
            this.addSelectedAsset(id);
        });

        this.init();
    }

    set selectedAssetsIds(selectedAssetsIds: Set<string>) {
        this._selectedAssetsIds = selectedAssetsIds;
        if (this._sidePanel) {
            this._sidePanel.assets = Array
                .from(selectedAssetsIds, id => this.as.getAssetById(id))
                .filter(a => !!a && isContainer(a));
        }
    }

    disconnectedCallback(): void {
        this._locationSelector?.remove();
        this._bottomBar?.remove();
        this._sidePanel?.remove();
    }

    private async init(): Promise<void> {
        this._locations = await fetchLocations();
        this.as.assets = await fetchAssets();

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

    private addSelectedAsset(id: string) {
        this.selectedAssetsIds = this._selectedAssetsIds.add(id);
    }

    private removeSelectedAsset(id: string) {
        this._selectedAssetsIds.delete(id);
        this.selectedAssetsIds = this._selectedAssetsIds;
    }

    private showSidePanel(): void {
        const sidePanel = document.createElement('side-panel') as SidePanel;
        this._sidePanel = sidePanel;
        this.appendChild(sidePanel);

        AssetsService.onChange(() => {
            this.selectedAssetsIds = this._selectedAssetsIds;
        });

        sidePanel.addEventListener('close-card', (ev) => {
            const asset = (ev as CustomEvent<Asset>).detail;
            this.removeSelectedAsset(asset.id);
        });
    }

    private async loadLocation(location: BeancountLocation): Promise<void> {
        const geojson = await fetchGeoJson(location.filename);

        if (this._assetMap) {
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
            this._selectedAssetsIds.clear();

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
