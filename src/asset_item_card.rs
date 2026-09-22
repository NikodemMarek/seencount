use wasm_bindgen::prelude::*;

use crate::assets::Content;

const STYLE: &str = include_str!("./asset_item_card.css");

pub(crate) struct AssetItemCardComponent;
impl AssetItemCardComponent {
    pub(crate) fn render(
        Content {
            asset: name,
            quantity,
        }: &Content,
        is_ghost: bool,
        index: usize,
    ) -> String {
        format!(
            r#"
            <style>{STYLE}</style>
            <div class="asset-item-card {ghost}" draggable="{draggable}" data-index={index}>
                <div class="item-info">
                    <div class="item-icon">📦</div>
                    <span class="item-name">{name}</span>
                </div>
                <span class="item-qty-badge">{quantity}</span>
            </div>
            "#,
            ghost = if is_ghost { "ghost" } else { "" },
            draggable = !is_ghost,
        )
    }
}
