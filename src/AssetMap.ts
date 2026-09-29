declare var L: typeof import('leaflet');

const METERS_PER_DEGREE = 111320;

function parseOrigin(originProp: number[]): number[] {
    if (!originProp) return [0, 0];
    const first = Number(originProp[0]);
    const second = Number(originProp[1]);
    if (Math.abs(first) <= 90 && Math.abs(second) <= 180) {
        return [first, second];
    }
    return [second, first];
}

function scaleObjectCoordinate(coord: number[], originLat: number, originLng: number, rotationDeg = 0): any {
    const rawX = coord[0];
    const rawY = coord[1];

    const rad = (rotationDeg * Math.PI) / 180.0;
    const cosR = Math.cos(rad);
    const sinR = Math.sin(rad);

    const xMeters = rawX * cosR - rawY * sinR;
    const yMeters = rawX * sinR + rawY * cosR;

    const latOffset = yMeters / METERS_PER_DEGREE; const cosLat = Math.cos((originLat * Math.PI) / 180.0);
    const lngOffset = xMeters / (METERS_PER_DEGREE * (Math.abs(cosLat) > 0.0001 ? cosLat : 1.0));

    return [originLng + lngOffset, originLat + latOffset];
}
function scaleObjectCoordinates(coords: any, originLat: number, originLng: number, rotationDeg = 0): any {
    if (typeof coords[0] === 'number') {
        return scaleObjectCoordinate(coords, originLat, originLng, rotationDeg);
    }
    return coords.map((c: any) => scaleObjectCoordinates(c, originLat, originLng, rotationDeg));
}

function scaleGeoJsonObject(geojson: any) {
    const scaled = JSON.parse(JSON.stringify(geojson));
    const originProp = scaled.properties?.origin || scaled.origin || scaled.properties?.origin_coordinates;
    const origin = parseOrigin(originProp);
    const rotation = Number(scaled.properties?.rotation ?? scaled.rotation ?? scaled.properties?.angle ?? 0);

    if (scaled.features) {
        scaled.features.forEach((f: any) => {
            if (f.geometry && f.geometry.coordinates) {
                f.geometry.coordinates = scaleObjectCoordinates(f.geometry.coordinates, origin[0], origin[1], rotation);
            }
        });
    }
    return scaled;
}

function getStyle(id: string | null) {
    if (!id) {
        return {
            color: '#eba0ac',
            weight: 2,
            fillColor: '#eba0ac',
            fillOpacity: 0.1
        };
    }

    const type = document.get_type_by_id(id);

    switch (type) {
        case "property":
            return {};
        case "area":
            return {
                color: '#585b70',
                weight: 2,
                fillColor: '#585b70',
                fillOpacity: 0.1
            };
        case "container":
            return {
                color: '#89b4fa',
                weight: 2,
                fillColor: '#89b4fa',
                fillOpacity: 0.3
            };
        case 'asset':
            return {};
        default:
            return {};
    }
}

function createPopup(id: string) {
    const label = document.get_details_by_id(id);
    // This actually no longer makes much sense, leaving for reference.
    // const contents = isContainer(asset) && asset.contents.length !== 0
    //     ? `Contains: ${asset.contents.map(asset => `${asset.quantity} ${asset.asset}`).join(',')}`
    //     : 'Empty';
    const contents = "";

    return `<div class="popup-title"><div class="popup-detail">${label}<br>${contents}</div></div>`;
}

export class AssetMap extends HTMLElement {
    private map: L.Map | null = null;
    private _currentGeoJsonLayer: L.GeoJSON | null = null;
    private resizeObserver: ResizeObserver | null = null;

    private _geojson: any = null;

    constructor() {
        super();
    }

    set geojson(geojson: any) {
        this._geojson = geojson;
        this.renderGeoJson();
    }

    connectedCallback(): void {
        this.style.display = 'block';
        this.style.width = '100%';
        this.style.height = '100%';
        this.style.position = 'relative';

        if (this.map) return;

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
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.map);

        this.map.setView([0, 0], 2);

        this.resizeObserver = new ResizeObserver(() => {
            this.map?.invalidateSize();
        });
        this.resizeObserver.observe(this);

        this.renderGeoJson();
    }

    disconnectedCallback(): void {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }

        if (this.map) {
            this.map.remove();
            this.map = null;
        }
    }

    private renderGeoJson(): void {
        if (!this.map || !this._geojson) return;

        if (this._currentGeoJsonLayer) {
            this.map.removeLayer(this._currentGeoJsonLayer);
            this._currentGeoJsonLayer = null;
        }

        const scaledJson = scaleGeoJsonObject(this._geojson);
        this._currentGeoJsonLayer = L.geoJSON(scaledJson, {
            style: (feature: any) => {
                return getStyle(feature?.properties?.beancount_id);
            },
            onEachFeature: (feature: any, layer: any) => {
                const id = feature?.properties?.beancount_id;

                if (id) {
                    layer.bindPopup(createPopup(id));
                } else {
                    const fallbackTitle = feature?.properties?.name ?? feature.id ?? 'Asset';
                    layer.bindPopup(`<div class="popup-title"><div class="popup-detail">${fallbackTitle}</div></div>`);
                }

                layer.on('mouseover', () => {
                    if ('setStyle' in layer && typeof layer.setStyle === 'function') {
                        layer.setStyle({ weight: 4 });
                    }
                });

                layer.on('mouseout', () => {
                    if ('setStyle' in layer && typeof layer.setStyle === 'function') {
                        layer.setStyle(getStyle(id));
                    }
                });

                layer.on('click', (e: L.LeafletEvent) => {
                    L.DomEvent.stopPropagation(e);

                    document.select_id(id || feature?.id || '');
                });
            }
        });

        this._currentGeoJsonLayer.addTo(this.map);

        const bounds = this._currentGeoJsonLayer.getBounds();
        if (bounds.isValid()) {
            this.map.fitBounds(bounds, { padding: [50, 50] });
        }
    }
}

customElements.define('asset-map', AssetMap);

declare global {
    interface HTMLElementTagNameMap {
        'asset-map': AssetMap;
    }
}
