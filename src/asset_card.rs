use wasm_bindgen::prelude::*;

use crate::{
    asset_contents_list::AssetContentsListComponent, assets::Assets,
    contents_manipulation_service::get_shadow_contents,
};

const STYLE: &str = include_str!("./asset_card.css");

pub(crate) struct AssetCardTemplate;
impl AssetCardTemplate {
    pub(crate) fn render(id: &str) -> String {
        let Some(asset) = Assets::get_asset_by_id(id) else {
            return "".into();
        };
        let details = asset.get_details();
        let asset_type = asset.get_type();
        let shadow_contents = get_shadow_contents(id).unwrap_or_default();

        format!(
            r#"
            <style>{STYLE}</style>
            <div class="asset-card" data-id="{id}"
                onmouseenter="handle_content_hover('{id}', true)"
                onmouseleave="handle_content_hover('{id}', false)">
                <div class="panel-header">
                    <div class="panel-title-container">
                        <span class="panel-type-badge {asset_type}" id="panel-type-badge">{asset_type}</span>
                        <h3 class="panel-title" id="panel-title">{details}</h3>
                        <span class="panel-subtitle" id="panel-subtitle">{id}</span>
                    </div>
                    <button id="close-panel-btn" class="close-btn" title="Close Panel" onclick="dispatchCloseCard()">&times;</button>
                </div>
                {asset_contents_list}
            </div>
            "#,
            asset_contents_list =
                AssetContentsListComponent::render(asset.contents(), &shadow_contents)
        )
    }
}
