use wasm_bindgen::prelude::*;

use crate::{
    AppStateService,
    assets::Content,
    location::{Location, Locations},
    location_item::LocationItemComponent,
    service::Service,
};

const STYLE: &str = include_str!("./location_selector.css");

#[wasm_bindgen]
pub fn preview_location() {
    AppStateService::set_previewed()
        .map(|index| Locations::get_location(index))
        .flatten()
        .map(|location| location.filename)
        .inspect(|filename| {
            crate::dispatchUiChanged();
            crate::dispatchPreviewChanged(&filename);
        });
}

pub(crate) struct LocationSelectorComponent;
impl LocationSelectorComponent {
    pub(crate) fn render(selected: Option<usize>) -> String {
        let is_empty = Locations::is_empty();
        let location_items = Locations::with(|service| {
            service
                .0
                .iter()
                .enumerate()
                .map(|(index, location)| {
                    LocationItemComponent::render(location, Some(index) == selected, index)
                })
                .collect::<String>()
        });

        format!(
            r#"
            <style>{STYLE}</style>
            <div class="overlay">
                <div class="modal-card">
                    <div class="modal-header">
                        <h2>Select Location</h2>
                    </div>
                    <div id="locations-list" class="locations-list">
                        {location_items}
                        {empty_state}
                    </div>
                    <button id="preview-btn" class="btn-primary" onclick="preview_location()" {disabled}>Preview Location</button>
                </div>
            </div>
            "#,
            empty_state = if is_empty {
                "<div class='empty-state'>Loading available locations...</div>"
            } else {
                ""
            },
            disabled = if selected.is_some() { "" } else { "disabled" },
        )
    }
}
