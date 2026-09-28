use wasm_bindgen::prelude::*;

use crate::{AppStateService, assets::Content, location::Location};

const STYLE: &str = include_str!("./location_item.css");

#[wasm_bindgen]
pub fn select_location(index: usize) {
    AppStateService::set_selected(index);
    crate::dispatchUiChanged();
}

pub(crate) struct LocationItemComponent;
impl LocationItemComponent {
    pub(crate) fn render(
        Location {
            beancount_id,
            name,
            filename,
        }: &Location,
        is_selected: bool,
        index: usize,
    ) -> String {
        format!(
            r#"
            <style>{STYLE}</style>
            <div class="location-item {selected}" onclick="select_location({index})">
                <div class="location-info">
                    <div class="location-icon">🏠</div>
                    <div class="location-details">
                        <span class="location-name">{name}</span>
                        <span class="location-file">{filename}</span>
                    </div>
                </div>
                <span class="badge">GeoJSON</span>
            </div>
            "#,
            selected = if is_selected { "selected" } else { "" }
        )
    }
}
