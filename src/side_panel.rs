use wasm_bindgen::prelude::*;

use crate::{AppStateService, asset_card::AssetCardTemplate};

const STYLE: &str = include_str!("./side_panel.css");

pub(crate) struct SidePanelComponent;
impl SidePanelComponent {
    pub(crate) fn render() -> String {
        let asset_cards = AppStateService::get_selected_ids()
            .iter()
            .map(|id| AssetCardTemplate::render(id))
            .collect::<String>();
        format!("<style>{STYLE}</style><div class='side-panel'>{asset_cards}</div>")
    }
}
