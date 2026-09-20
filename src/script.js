import { LocationItem } from './components/LocationItem.js';
import { LocationSelector } from './components/LocationSelector.js';
import { BottomBar } from './components/BottomBar.js';
import { SidePanel } from './components/SidePanel.js';
import { AssetItemCard } from './components/AssetItemCard.js';
import { AssetCard } from './components/AssetCard.js';
import { AssetMap } from './components/AssetMap.js';

async function fetchLocations() {
    const res = await fetch("/locations");
    return await res.json();
}

async function fetchBeancountMetadata() {
    const res = await fetch("/metadata");
    return await res.json();
}

async function main() {
    const bottomBar = document.querySelector("bottom-bar");
    const selector = document.querySelector("location-selector");
    const sidePanel = document.querySelector("side-panel");
    const assetMap = document.querySelector("asset-map");

    try {
        const [locations, locationsMetadata] = await Promise.all([
            fetchLocations(),
            fetchBeancountMetadata().catch(err => {
                console.warn("Failed to fetch beancount metadata:", err);
                return [];
            })
        ]);

        selector.setLocations(locations);

        selector.addEventListener("location-selected", async (e) => {
            const selectedLocation = e.detail.location;
            if (!selectedLocation) return;

            selector.hide();
            sidePanel.close();
            bottomBar.setActiveLocation(selectedLocation.name);

            await assetMap.loadLocation(selectedLocation.filename, locationsMetadata);
        });

        bottomBar.addEventListener("change-location", () => {
            selector.show();
        });

        assetMap.addEventListener("select-object", ({detail: metadata}) => {
            sidePanel.addCard(metadata);
        });

    } catch (err) {
        console.error("Initialization error:", err);
    }
}

main();
