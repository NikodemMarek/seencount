mod asset_card;
mod asset_contents_list;
mod asset_item_card;
mod assets;
mod bottom_bar;
mod contents_manipulation_service;
mod location;
mod location_item;
mod location_selector;
mod service;
mod side_panel;

use std::{
    cell::RefCell,
    collections::{HashMap, HashSet},
    thread::LocalKey,
};

use wasm_bindgen::prelude::*;

use crate::{
    assets::{Asset, Assets, ContainerAsset, Content},
    bottom_bar::BottomBarComponent,
    location::Locations,
    location_selector::LocationSelectorComponent,
    service::Service,
    side_panel::SidePanelComponent,
};

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

#[wasm_bindgen(inline_js = r#"
export function dispatchUiChanged() {
    document.dispatchEvent(new CustomEvent('ui-changed', {
        bubbles: true,
        cancelable: true,
        composed: true
    }));
}
export function dispatchPreviewChanged(filename) {
    document.dispatchEvent(new CustomEvent('preview-changed', {
        bubbles: true,
        cancelable: true,
        composed: true,
        detail: filename
    }));
}

export function fetchCb(res, cb) {
    fetch(res)
        .then(res => res.json())
        .then(data => cb(data))
        .catch(err => console.error(err));
}
"#)]
extern "C" {
    fn dispatchUiChanged();
    fn dispatchPreviewChanged(filename: &str);

    fn fetchCb(res: &str, cb: &Closure<dyn FnMut(JsValue)>);
}

#[wasm_bindgen]
pub fn load() {
    let locations_cb = Closure::wrap(Box::new(move |data: JsValue| {
        let locations = serde_wasm_bindgen::from_value::<Locations>(data).unwrap();
        if !locations.0.is_empty() {
            AppStateService::set_selected(0);
        }
        Locations::set_locations(locations);
        crate::dispatchUiChanged();
    }));
    let assets_cb = Closure::wrap(Box::new(move |data: JsValue| {
        let assets = serde_wasm_bindgen::from_value::<Assets>(data).unwrap();
        Assets::set_assets(assets);
        crate::dispatchUiChanged();
    }));

    fetchCb("/locations", &locations_cb);
    fetchCb("/assets", &assets_cb);

    locations_cb.forget();
    assets_cb.forget();
}

#[wasm_bindgen]
pub fn render() -> String {
    match AppStateService::get_location_state() {
        LocationState::NotSelected => LocationSelectorComponent::render(None),
        LocationState::Selected(index) => LocationSelectorComponent::render(Some(index)),
        LocationState::Previewed(index) => {
            let location = Locations::get_location(index).unwrap();
            SidePanelComponent::render().to_string()
                + &BottomBarComponent::render(&location.beancount_id, &location.name)
        }
    }
}

#[wasm_bindgen]
pub fn get_type_by_id(id: &str) -> String {
    Assets::get_asset_by_id(id)
        .map(|asset| asset.get_type())
        .unwrap_or("")
        .into()
}
#[wasm_bindgen]
pub fn get_details_by_id(id: &str) -> String {
    Assets::get_asset_by_id(id)
        .map(|asset| asset.get_details().into())
        .unwrap_or("".into())
}
#[wasm_bindgen]
pub fn select_id(id: &str) {
    AppStateService::select_id(id);
    crate::dispatchUiChanged();
}

#[derive(Clone, Copy, Default)]
enum LocationState {
    #[default]
    NotSelected,
    Selected(usize),
    Previewed(usize),
}
#[derive(Default)]
pub(crate) struct AppStateService {
    location_state: LocationState,
    selected_ids: HashSet<Box<str>>,
}
impl AppStateService {
    pub(crate) fn get_selected_ids() -> HashSet<Box<str>> {
        Self::with(|service| service.selected_ids.clone())
    }
    pub(crate) fn select_id(id: &str) {
        Self::with_mut(|service| service.selected_ids.insert(id.into()));
    }

    pub(crate) fn get_location_state() -> LocationState {
        Self::with(|service| service.location_state)
    }
    pub(crate) fn set_selected(index: usize) {
        Self::with_mut(|service| service.location_state = LocationState::Selected(index))
    }
    pub(crate) fn set_previewed() -> Option<usize> {
        Self::with_mut(|service| match service.location_state {
            LocationState::Selected(index) => {
                service.location_state = LocationState::Previewed(index);
                Some(index)
            }
            s @ LocationState::NotSelected | s @ LocationState::Previewed(_) => None,
        })
    }
}
