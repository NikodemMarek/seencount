import init, { handle_content_drag, handle_content_hover, handle_content_drop, select_location, change_location, preview_location, select_id, copy_directives, get_type_by_id, get_details_by_id, render, load } from '../pkg/seencount';
import wasmBytes from '../pkg/seencount_bg.wasm';
import './AssetMap.ts';
import './DraggableElement';

async function fetchGeoJson(source: string): Promise<any> {
    const res = await fetch(source);
    return res.json();
}

async function run() {
    await init({ module_or_path: wasmBytes });

    load();

    const ui = document.body.querySelector("#ui")!;
    ui.innerHTML = render();
    document.addEventListener('ui-changed', () => {
        ui.innerHTML = render();
    });

    const map = document.body.querySelector("asset-map")!;
    document.addEventListener('preview-changed', async (ev) => {
        map.geojson = await fetchGeoJson(ev.detail);
    });

    document.addEventListener('mouseup', (ev) => {
        const [id_dsm] = ev.composedPath()
            .map(e => e?.['dataset'] as DOMStringMap)
            .filter(dsm => !!dsm && !!dsm.id);

        ev.preventDefault();
        handle_content_drop(id_dsm?.id || '')
    });
    document.addEventListener('dragstart', (ev) => {
        const [index_dsm, id_dsm] = ev.composedPath()
            .map(e => e?.['dataset'] as DOMStringMap)
            .filter(dsm => !!dsm && (!!dsm.id || !!dsm.index));
        if (!index_dsm || !index_dsm.index || !id_dsm || !id_dsm.id) return;

        ev.preventDefault();
        const visual = handle_content_drag(id_dsm.id, Number(index_dsm.index));
        document.body.insertAdjacentHTML('beforeend', visual);
    });
}

document.handle_content_hover = handle_content_hover;
document.select_location = select_location;
document.change_location = change_location;
document.select_id = select_id;
document.preview_location = preview_location;
document.copy_directives = copy_directives;
document.get_type_by_id = get_type_by_id;
document.get_details_by_id = get_details_by_id;

run();
