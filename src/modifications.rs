use crate::assets::{Assets, Content};

pub enum Modification {
    Move {
        from_id: Box<str>,
        to_id: Box<str>,
        contents: Box<[Content]>,
    },
}
impl Assets {
    pub fn apply(&mut self, modification: Modification) -> bool {
        match modification {
            Modification::Move {
                from_id,
                to_id,
                contents,
            } => {
                if let Some(from_asset) = self.0.get_mut(&from_id) {
                    from_asset.remove(&contents);
                }
                if let Some(to_asset) = self.0.get_mut(&to_id) {
                    to_asset.add(contents);
                }
                true
            }
        }
    }
}
