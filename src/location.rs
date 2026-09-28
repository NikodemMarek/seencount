use std::cell::RefCell;

use crate::AppStateService;
use crate::service::Service;

use serde::Deserialize;
use wasm_bindgen::JsValue;
use wasm_bindgen::prelude::*;

#[derive(Deserialize, Debug, Default, Clone)]
pub(crate) struct Location {
    pub(crate) beancount_id: Box<str>,
    pub(crate) name: Box<str>,
    pub(crate) filename: Box<str>,
}

#[derive(Deserialize, Debug, Default)]
pub(crate) struct Locations(pub(crate) Vec<Location>);
impl Locations {
    pub(crate) fn set_locations(new_locations: Locations) {
        Self::with_mut(|service| service.0 = new_locations.0)
    }
    pub(crate) fn is_empty() -> bool {
        Self::with(|service| service.0.is_empty())
    }

    pub(crate) fn get_location(index: usize) -> Option<Location> {
        Self::with(|service| service.0.get(index).cloned())
    }
}
