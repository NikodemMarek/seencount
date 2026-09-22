use wasm_bindgen::prelude::*;

use std::cell::RefCell;

use crate::{
    asset_item_card::AssetItemCardComponent,
    assets::{Asset, Assets, Content},
    service::Service,
};

pub(crate) const MOVING_ACCOUNT: &str = "Equity:Inventory:Tracking";

#[derive(Default)]
pub(crate) struct ContentManipulationService {
    origin_id: Option<Box<str>>,
    hovering_id: Option<Box<str>>,
}
impl ContentManipulationService {
    fn is_dragging() -> bool {
        Self::with(|service| service.origin_id.is_some())
    }
    fn get_origin() -> Option<Box<str>> {
        Self::with(|service| service.origin_id.clone())
    }
    fn set_origin(id: Option<&str>) {
        Self::with_mut(|service| {
            service.origin_id = id.map(|id| id.into());
        });
    }

    fn is_hovering(id: &str) -> bool {
        Self::with(|service| service.hovering_id == Some(id.into()))
    }
    fn set_hovering(id: Option<&str>) {
        Self::with_mut(|service| {
            service.hovering_id = id.map(|id| id.into());
        });
    }
}

pub(crate) fn get_shadow_contents(id: &str) -> Option<Box<[Content]>> {
    if !ContentManipulationService::is_hovering(id) {
        return None;
    }
    Assets::get_asset_by_id(MOVING_ACCOUNT).map(|asset| asset.contents().into())
}

#[wasm_bindgen]
pub fn handle_content_drag(id: &str, index: usize) -> String {
    Assets::move_contents(id, MOVING_ACCOUNT, index);
    ContentManipulationService::set_origin(Some(id));

    Assets::get_asset_by_id(MOVING_ACCOUNT)
        .map(|asset| AssetItemCardComponent::render(&asset.contents()[0], true, 0))
        .map(|rendered| format!("<draggable-element>{rendered}</draggable-element>"))
        .inspect(|_| crate::dispatchUiChanged())
        .unwrap_or("".into())
}

#[wasm_bindgen]
pub fn handle_content_hover(id: &str, hovering: bool) {
    if !ContentManipulationService::is_dragging()
        || (ContentManipulationService::is_hovering(id) && hovering)
    {
        return;
    }
    if hovering {
        ContentManipulationService::set_hovering(Some(id));
    } else {
        ContentManipulationService::get_origin()
            .map(|org_id| ContentManipulationService::set_hovering(Some(&*org_id)));
    }
    crate::dispatchUiChanged()
}

#[wasm_bindgen]
pub fn handle_content_drop(id: &str) {
    if !ContentManipulationService::is_dragging() {
        return;
    }

    let origin_id = ContentManipulationService::get_origin().unwrap_or("".into());
    Assets::move_contents(
        MOVING_ACCOUNT,
        if id.is_empty() { &origin_id } else { id.into() },
        0,
    );
    ContentManipulationService::set_origin(None);
    ContentManipulationService::set_hovering(None);
    crate::dispatchUiChanged();
}
