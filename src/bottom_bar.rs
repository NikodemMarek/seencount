use wasm_bindgen::prelude::*;

use crate::{
    AppStateService,
    assets::{AssetsService, Content},
};

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

#[wasm_bindgen]
pub fn copy_directives() {
    let directives = AssetsService::get_directives();
    crate::copyToClipboard(&directives);

    AppStateService::set_copied(true);
    crate::dispatchUiChanged();

    let clipboard_cb = Closure::wrap(Box::new(move || {
        AppStateService::set_copied(false);
        crate::dispatchUiChanged();
    }));
    crate::sleepCb(1000, &clipboard_cb);
    clipboard_cb.forget();
}

pub(crate) struct BottomBarComponent;
impl BottomBarComponent {
    pub(crate) fn render(location_id: &str, location_name: &str, is_copied: bool) -> String {
        format!(
            r#"
            <style>{STYLE}</style>
            <div class="bottom-bar">
                <button id="change-location-btn" class="btn-secondary" onclick="change_location()">📍 Change Location</button>
                <button id="contents-btn" class="btn-secondary" onclick="select_id('{location_id}')">📦 Contents</button>
                <button id="directives-btn" class="btn-secondary" onclick="copy_directives()">{directives}</button>
                <span class="active-location-name" id="current-location-label">{location_name}</span>
            </div>
            "#,
            directives = if is_copied {
                "✅ Copied"
            } else {
                "📋 Directives"
            },
        )
    }
}
