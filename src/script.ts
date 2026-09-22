import init, { add } from '../pkg/seencount.js';
import wasmBytes from '../pkg/seencount_bg.wasm';
import './AppRoot.ts';
import './AssetCard.ts';
import './AssetContentsList.ts';
import './AssetItemCard.ts';
import './AssetMap.ts';
import './AssetsService';
import './BottomBar.ts';
import './ContentsManipulationService';
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

export type Assets = Record<string, Asset>;
export type Asset = PropertyAsset | AreaAsset | ContainerAsset | BasicAsset;
export type PropertyAsset = {
    type: 'Property';
    id: string;
    country: string;
    city: string;
    street: string;
    number: string;
    "postal-code": string;
    ownership: AssetOwnership;
    contents: AssetContent[];
};
export type AreaAsset = {
    type: 'Area';
    id: string;
    name: string;
    contents: AssetContent[];
};
export type ContainerAsset = {
    type: 'Container';
    id: string;
    name: string;
    contents: AssetContent[];
};
export type BasicAsset = {
    type: 'Asset';
    id: string;
    name?: string;
};

export type AssetOwnership = 'Owned';
export type AssetContent = {
    asset: string;
    quantity: number;
};

export function isContainer(asset: Asset): asset is ContainerAsset {
    return asset.type === 'Property' || asset.type === 'Area' || asset.type === 'Container';
}

export function assertNever(value: never): never {
      throw new Error(`Unhandled variant: ${value}`);
}

async function run() {
  await init({ module_or_path: wasmBytes });

  const sum = add(40, 2);
  console.log('Result from Rust WASM:', sum);
}

run();
