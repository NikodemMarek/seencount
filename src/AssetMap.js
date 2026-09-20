const METERS_PER_DEGREE = 111320;

function parseOrigin(originProp) {
    if (!originProp) return { lat: 0, lng: 0 };
    const first = Number(originProp[0]);
    const second = Number(originProp[1]);
    if (Math.abs(first) <= 90 && Math.abs(second) <= 180) {
        return { lat: first, lng: second };
    }
    return { lat: second, lng: first };
}

function scaleObjectCoordinates(coords, originLat, originLng, rotationDeg = 0) {
    if (typeof coords[0] === 'number') {
        const rawX = coords[0];
        const rawY = coords[1];

        const rad = (rotationDeg * Math.PI) / 180.0;
        const cosR = Math.cos(rad);
        const sinR = Math.sin(rad);

        const xMeters = rawX * cosR - rawY * sinR;
        const yMeters = rawX * sinR + rawY * cosR;

        const latOffset = yMeters / METERS_PER_DEGREE;
        const cosLat = Math.cos((originLat * Math.PI) / 180.0);
        const lngOffset = xMeters / (METERS_PER_DEGREE * (Math.abs(cosLat) > 0.0001 ? cosLat : 1.0));

        return [originLng + lngOffset, originLat + latOffset];
    }
    return coords.map(c => scaleObjectCoordinates(c, originLat, originLng, rotationDeg));
}

function scaleGeoJsonObject(geojson) {
    const scaled = JSON.parse(JSON.stringify(geojson));
    const originProp = scaled.properties?.origin || scaled.origin || scaled.properties?.origin_coordinates;
    const origin = parseOrigin(originProp);
    const rotation = Number(scaled.properties?.rotation ?? scaled.rotation ?? scaled.properties?.angle ?? 0);

    if (scaled.features) {
        scaled.features.forEach(f => {
            if (f.geometry && f.geometry.coordinates) {
                f.geometry.coordinates = scaleObjectCoordinates(f.geometry.coordinates, origin.lat, origin.lng, rotation);
            }
        });
    }
    return scaled;
}

function getStyle(metadata) {
    if (!metadata) {
        return {
            color: '#eba0ac',
            weight: 2,
            fillColor: '#eba0ac',
            fillOpacity: 0.1
        };
    }

    switch (metadata.type) {
        case "Flat":
            return {};
        case "Room":
            return {
                color: '#585b70',
                weight: 2,
                fillColor: '#585b70',
                fillOpacity: 0.1
            };
        case "Container":
            return {
                color: '#89b4fa',
                weight: 2,
                fillColor: '#89b4fa',
                fillOpacity: 0.3
            };
        default:
            return {};
    }
}

function getLabel(metadata) {
    switch (metadata.type) {
        case "Flat":
            return ``;
        case "Room":
            return `${metadata.name}`;
        case "Container":
            return `${metadata.name}`;
        default:
            return `Unnamed ${metadata.type}`;
    }
}

function createPopup(metadata) {
    const label = getLabel(metadata);
    const contents = (!metadata.contents || metadata.contents.length === 0)
        ? 'Empty'
        : `Contains: ${metadata.contents.map(asset => `${asset.quantity} ${asset.asset}`).join(',')}`;

    return `<div class="popup-title"><div class="popup-detail">${label}<br>${contents}</div></div>`;
}

export class AssetMap extends HTMLElement {
    constructor() {
        super();
        this.currentGeoJsonLayer = null;
    }

    connectedCallback() {
        this.style.display = 'block';
        this.style.width = '100%';
        this.style.height = '100%';

        const mapDiv = document.createElement('div');
        mapDiv.id = 'map-container';
        mapDiv.style.width = '100%';
        mapDiv.style.height = '100%';
        mapDiv.style.background = '#0f172a';
        this.appendChild(mapDiv);

        this.map = L.map(mapDiv, {
            maxZoom: 24
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 24,
            maxNativeZoom: 19,
            attribution: '&copy; OpenStreetMap'
        }).addTo(this.map);
    }

    async loadLocation(source, locationsMetadata) {
        if (this.currentGeoJsonLayer) {
            this.map.removeLayer(this.currentGeoJsonLayer);
            this.currentGeoJsonLayer = null;
        }

        const res = await fetch(source);
        const json = await res.json();
        const scaledJson = scaleGeoJsonObject(json);

        this.currentGeoJsonLayer = L.geoJSON(scaledJson, {
            style: (feature) => {
                const metadata = locationsMetadata.find(loc => loc.id === feature?.properties?.beancount_id);
                return getStyle(metadata);
            },
            onEachFeature: (feature, layer) => {
                const metadata = locationsMetadata.find(loc => loc.id === feature?.properties?.beancount_id);
                if (metadata) {
                    layer.bindPopup(createPopup(metadata));
                } else {
                    layer.bindPopup(`<div class="popup-title"><div class="popup-detail">${feature?.properties?.name ?? feature.id}</div></div>`);
                }

                layer.on('mouseover', function() {
                    this.setStyle({ weight: 4 });
                });
                layer.on('mouseout', function() {
                    this.setStyle(getStyle(metadata));
                });

                layer.on('click', (e) => {
                    L.DomEvent.stopPropagation(e);
                    this.dispatchEvent(new CustomEvent('select-object', {
                        bubbles: true,
                        cancelable: true,
                        detail: {
                            name: metadata?.name || feature?.properties?.name || feature?.id || 'Asset',
                            type: metadata?.type || 'Asset',
                            id: metadata?.id || feature?.properties?.beancount_id || feature?.id || '',
                            ...metadata
                        }
                    }));
                });
            }
        });

        this.currentGeoJsonLayer.addTo(this.map);

        try {
            const bounds = this.currentGeoJsonLayer.getBounds();
            if (bounds.isValid()) {
                this.map.fitBounds(bounds, { padding: [50, 50] });
            }
        } catch (e) {
            console.error("Could not fit bounds:", e);
        }
    }
}
customElements.define('asset-map', AssetMap);
