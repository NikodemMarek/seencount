use wasm_bindgen::prelude::*;

use crate::{asset_item_card::AssetItemCardComponent, assets::Content};

const STYLE: &str = include_str!("./asset_contents_list.css");

pub(crate) struct AssetContentsListComponent;
impl AssetContentsListComponent {
    pub(crate) fn render(contents: &[Content], shadow_contents: &[Content]) -> String {
        let count = contents.len();
        let is_empty = contents.is_empty() && shadow_contents.is_empty();
        let contents = contents
            .iter()
            .enumerate()
            .map(|(index, content)| AssetItemCardComponent::render(content, false, index))
            .collect::<String>();
        let shadow_contents = shadow_contents
            .iter()
            .enumerate()
            .map(|(index, content)| {
                AssetItemCardComponent::render(content, true, contents.len() + index)
            })
            .collect::<String>();

        format!(
            r#"
            <style>{STYLE}</style>
            <div class="asset-contents-list">
                <div class="section-title">
                    <span>Stored Assets</span>
                    <span class="contents-count-badge">{count} {count_label}</span>
                </div>
                <div class="contents-list">{contents}{shadow_contents}</div>
                {empty_state}
            </div>
            "#,
            count_label = if contents.len() == 1 { "item" } else { "items" },
            empty_state = if is_empty {
                "<div class='empty-state'>No items stored in this location</div>"
            } else {
                ""
            },
        )
    }
}
