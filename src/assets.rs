use std::{
    cell::RefCell,
    collections::{HashMap, HashSet},
};

use serde::Deserialize;
use wasm_bindgen::{JsValue, prelude::wasm_bindgen};

use crate::{AppStateService, contents_manipulation_service::MOVING_ACCOUNT, service::Service};

#[derive(Deserialize, Debug)]
pub(crate) struct Assets(pub HashMap<Box<str>, Asset>);
impl Default for Assets {
    fn default() -> Self {
        let mut assets = Self(HashMap::new());
        assets.0.insert(
            MOVING_ACCOUNT.into(),
            Asset::Container(ContainerAsset {
                id: MOVING_ACCOUNT.into(),
                name: "".into(),
                contents: Vec::new(),
            }),
        );
        assets
    }
}
impl Assets {
    fn set_assets(&mut self, new_assets: Assets) {
        self.0 = Assets::default().0;
        self.0.extend(new_assets.0);
    }

    fn get_asset_by_id(&self, id: &str) -> Option<&Asset> {
        self.0.get(id)
    }

    fn move_contents(&mut self, from_id: &str, to_id: &str, content_index: usize) {
        self.0
            .get_mut(from_id)
            .map(|asset| asset.remove(content_index))
            .inspect(|content| {
                self.0
                    .entry(to_id.into())
                    .and_modify(|asset| asset.add_contents([content.clone()]));
            });
    }
}

#[derive(Clone, Deserialize, Debug)]
pub(crate) struct PropertyAsset {
    id: Box<str>,
    country: Box<str>,
    city: Box<str>,
    street: Box<str>,
    number: Box<str>,
    #[serde(rename = "postal-code")]
    postal_code: Box<str>,
    ownership: Box<str>,
    contents: Vec<Content>,
}
#[derive(Clone, Deserialize, Debug)]
pub(crate) struct AreaAsset {
    id: Box<str>,
    name: Box<str>,
    contents: Vec<Content>,
}
#[derive(Clone, Deserialize, Debug)]
pub struct ContainerAsset {
    pub(crate) id: Box<str>,
    pub(crate) name: Box<str>,
    pub(crate) contents: Vec<Content>,
}

#[derive(Clone, Deserialize, Debug)]
#[serde(tag = "type")]
pub(crate) enum Asset {
    Property(PropertyAsset),
    Area(AreaAsset),
    Container(ContainerAsset),
    Basic {
        id: Box<str>,
        name: Option<Box<str>>,
    },
}
impl Asset {
    pub fn contents(&self) -> &[Content] {
        match self {
            Asset::Property(container) => container.contents(),
            Asset::Area(container) => container.contents(),
            Asset::Container(container) => container.contents(),
            Asset::Basic { id, name } => &[],
        }
    }
    pub(crate) fn add_contents(&mut self, contents: impl IntoIterator<Item = Content>) {
        match self {
            Asset::Property(container) => container.add_contents(contents),
            Asset::Area(container) => container.add_contents(contents),
            Asset::Container(container) => container.add_contents(contents),
            Asset::Basic { id, name } => todo!(),
        }
    }
    pub(crate) fn remove(&mut self, index: usize) -> Content {
        match self {
            Asset::Property(container) => container.remove(index),
            Asset::Area(container) => container.remove(index),
            Asset::Container(container) => container.remove(index),
            Asset::Basic { id, name } => todo!(),
        }
    }

    pub(crate) fn get_type(&self) -> &'static str {
        match self {
            Asset::Property(_) => "property",
            Asset::Area(_) => "area",
            Asset::Container(_) => "container",
            Asset::Basic { .. } => "asset",
        }
    }
    pub(crate) fn get_details(&self) -> Box<str> {
        match self {
            Asset::Property(PropertyAsset {
                country,
                city,
                street,
                number,
                postal_code,
                ..
            }) => format!("{street}/{number}<br>{postal_code} {city}<br>{country}").into(),
            Asset::Area(AreaAsset { name, .. }) | Asset::Container(ContainerAsset { name, .. }) => {
                name.clone()
            }
            Asset::Basic { name, .. } => name.to_owned().unwrap_or("Asset".into()),
        }
    }
}

trait Container {
    fn contents(&self) -> &[Content];
    fn add_contents(&mut self, contents: impl IntoIterator<Item = Content>);
    fn remove(&mut self, index: usize) -> Content;
}
impl Container for PropertyAsset {
    fn contents(&self) -> &[Content] {
        &self.contents
    }
    fn add_contents(&mut self, contents: impl IntoIterator<Item = Content>) {
        self.contents.extend(contents);
    }
    fn remove(&mut self, index: usize) -> Content {
        self.contents.remove(index)
    }
}
impl Container for AreaAsset {
    fn contents(&self) -> &[Content] {
        &self.contents
    }
    fn add_contents(&mut self, contents: impl IntoIterator<Item = Content>) {
        self.contents.extend(contents);
    }
    fn remove(&mut self, index: usize) -> Content {
        self.contents.remove(index)
    }
}
impl Container for ContainerAsset {
    fn contents(&self) -> &[Content] {
        &self.contents
    }
    fn add_contents(&mut self, contents: impl IntoIterator<Item = Content>) {
        self.contents.extend(contents);
    }
    fn remove(&mut self, index: usize) -> Content {
        self.contents.remove(index)
    }
}

#[derive(Clone, Deserialize, Debug)]
pub struct Content {
    pub(crate) asset: Box<str>,
    pub(crate) quantity: usize,
}

#[derive(Default)]
pub(crate) struct AssetsService {
    assets: Assets,
}
impl AssetsService {
    pub(crate) fn set_assets(new_assets: Assets) {
        Self::with_mut(|service| service.assets.set_assets(new_assets));
    }

    pub(crate) fn get_asset_by_id(id: &str) -> Option<Asset> {
        Self::with(|service| service.assets.get_asset_by_id(id).cloned())
    }

    pub(crate) fn move_contents(from_id: &str, to_id: &str, content_index: usize) {
        Self::with_mut(|service| {
            service.assets.move_contents(from_id, to_id, content_index);
        });
    }
}
