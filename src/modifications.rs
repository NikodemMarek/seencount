use crate::assets::{Assets, Content};

#[derive(Default)]
pub struct ModificationHistory(Vec<Modification>);
impl ModificationHistory {
    pub fn push(&mut self, mut current: Modification) {
        while let Some(prev) = self.0.pop() {
            match reduce_modifications(prev, current) {
                ReductionResult::Nullified => {
                    return;
                }
                ReductionResult::Reduced(reduced) => {
                    current = reduced;
                }
                ReductionResult::Unmodified(prev, curr) => {
                    self.0.push(prev);
                    self.0.push(curr);
                    return;
                }
            }
        }

        self.0.push(current);
    }
}
impl Into<Box<str>> for &ModificationHistory {
    fn into(self) -> Box<str> {
        self.0
            .iter()
            .map(to_directive)
            .collect::<Vec<_>>()
            .join("\n\n")
            .into()
    }
}
fn to_directive(modification: &Modification) -> Box<str> {
    match modification {
        Modification::Move {
            from_id,
            to_id,
            contents,
        } => format!(
            "{date} * \"asset moved\"\n  {from_id} {content}\n  {to_id}",
            date = "2026-01-01",
            content = to_content(&contents[0]),
        )
        .into(),
    }
}
fn to_content(Content { asset, quantity }: &Content) -> Box<str> {
    format!("{quantity} {asset}").into()
}

#[derive(Clone)]
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

enum ReductionResult {
    Nullified,
    Reduced(Modification),
    Unmodified(Modification, Modification),
}
fn reduce_modifications(previous: Modification, current: Modification) -> ReductionResult {
    match (&previous, &current) {
        (
            Modification::Move {
                from_id: p_from,
                to_id: p_to,
                contents: p_cnt,
            },
            Modification::Move {
                from_id: c_from,
                to_id: c_to,
                contents: c_cnt,
            },
        ) if p_from == c_to && p_to == c_from && p_cnt == c_cnt => {
            if p_cnt == c_cnt {
                ReductionResult::Nullified
            } else {
                // TODO: This can be reduced more. Skipping for now due to complexity.
                ReductionResult::Unmodified(previous, current)
            }
        }

        (
            Modification::Move {
                from_id: p_from,
                to_id: p_to,
                contents: p_cnt,
            },
            Modification::Move {
                from_id: c_from,
                to_id: c_to,
                contents: c_cnt,
            },
        ) if p_to == c_from && p_cnt == c_cnt => ReductionResult::Reduced(Modification::Move {
            from_id: p_from.clone(),
            to_id: c_to.clone(),
            contents: p_cnt.clone(),
        }),

        _ => ReductionResult::Unmodified(previous, current),
    }
}
