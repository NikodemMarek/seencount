import './AppRoot.ts';
import './AssetCard.ts';
import './AssetContentsList.ts';
import './AssetItemCard.ts';
import './AssetMap.ts';
import './AssetsService';
import './BottomBar.ts';
import './DraggableElement';
import './LocationItem.ts';
import './LocationSelector.ts';
import './SidePanel.ts';

export type BeancountLocation = {
    beancount_id: string;
    name: string;
    filename: string;
    data: any;
};

export type AssetType = 'Flat' | 'Room' | 'Container' | 'Asset';

export type AssetContent = {
    asset: string;
    quantity: number;
};

export type Asset = BasicAsset | ContainerAsset;
export type BasicAsset = {
    type: AssetType;
    id: string;
    name?: string;
};
export type ContainerAsset = {
    type: AssetType;
    id: string;
    name: string;
    contents: AssetContent[];
};

export function isContainer(asset: Asset): asset is ContainerAsset {
    return asset.type === 'Flat' || asset.type === 'Room' || asset.type === 'Container'
}
