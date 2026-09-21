import { Asset, AssetContent, Assets, isContainer } from "./script";

export class AssetsService {
    private static _instance: AssetsService | null = null;
    static get instance(): AssetsService {
        if (!AssetsService._instance) {
            AssetsService._instance = new AssetsService();
        }
        return AssetsService._instance;
    }

    private _assets: Assets = {};

    get assets(): Assets {
        return this._assets;
    }
    set assets(assets: Assets) {
        this._assets = assets;
        this.dispatchChange();
    }

    public getAssetById(id: string): Asset | null {
        return this._assets[id] || null;
    }

    public addContents(id: string, contents: AssetContent[]): void {
        const asset = this.getAssetById(id);
        if (asset && isContainer(asset)) {
            asset.contents = asset.contents.concat(contents);
        }
        this.dispatchChange()
    }
    public removeContents(id: string, contents: AssetContent[]): void {
        const asset = this.getAssetById(id);
        if (asset && isContainer(asset)) {
            asset.contents = asset.contents.filter(c => !contents.includes(c))
        }
        this.dispatchChange()
    }

    private dispatchChange(): void {
        document.dispatchEvent(new CustomEvent('assets-changed', {
            bubbles: true,
            cancelable: true,
            composed: true
        }));
    }
    public static onChange(onChange: () => void): void {
        document.addEventListener('assets-changed', () => {
            onChange();
        });
    }
}
