use wasm_bindgen::prelude::*;

use crate::{AppStateService, assets::Content};

const STYLE: &str = include_str!("./bottom_bar.css");

#[wasm_bindgen]
pub fn change_location() {
    match AppStateService::get_location_state() {
        crate::LocationState::NotSelected => {}
        crate::LocationState::Selected(index) | crate::LocationState::Previewed(index) => {
            AppStateService::set_selected(index);
            crate::dispatchUiChanged();
        }
    };
}

pub(crate) struct BottomBarComponent;
impl BottomBarComponent {
    pub(crate) fn render(location_id: &str, location_name: &str) -> String {
        format!(
            r#"
            <style>{STYLE}</style>
            <div class="bottom-bar">
                <button id="change-location-btn" class="btn-secondary" onclick="change_location()">📍 Change Location</button>
                <button id="contents-btn" class="btn-secondary" onclick="select_id('{location_id}')">📦 Contents</button>
                <span class="active-location-name" id="current-location-label">{location_name}</span>
            </div>
            "#,
        )
    }
}
