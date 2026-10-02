use rustledger_core::{Decimal, Directive, IncompleteAmount, meta_json::meta_value_to_json};
use rustledger_loader::{LoadOptions, load};
use serde_json::Value;
use std::collections::{BTreeMap, HashMap};

use crate::config::AppState;

const LOCATIONS_ACCOUNT_PREFIX: &str = "Assets:Locations";

pub fn handle_assets(state: &AppState) -> Option<Value> {
    let options = LoadOptions { validate: true, ..Default::default() };
    let ledger = load(&state.beancount_file, &options).ok()?;

    let mut accounts = serde_json::Map::new();
    let mut balances: HashMap<String, BTreeMap<String, Decimal>> = HashMap::new();

    for directive in &ledger.directives {
        match &directive.value {
            Directive::Open(open) if open.account.starts_with(LOCATIONS_ACCOUNT_PREFIX) => {
                let account_id = open.account.to_string();
                let mut entry: serde_json::Map<String, Value> = open
                    .meta
                    .iter()
                    .map(|(key, value)| (key.clone(), meta_value_to_json(value)))
                    .collect();
                entry.insert("id".into(), Value::String(account_id.clone()));
                accounts.insert(account_id, Value::Object(entry));
            }
            Directive::Transaction(tx) => {
                for posting in &tx.postings {
                    let Some(IncompleteAmount::Complete(amount)) = &posting.value.units else {
                        continue;
                    };
                    *balances
                        .entry(posting.value.account.to_string())
                        .or_default()
                        .entry(amount.currency.to_string())
                        .or_default() += amount.number;
                }
            }
            _ => {}
        }
    }

    for (account_id, entry) in accounts.iter_mut() {
        let contents: Vec<Value> = balances
            .get(account_id)
            .into_iter()
            .flatten()
            .filter(|(_, number)| !number.is_zero())
            .filter_map(|(currency, number)| {
                let quantity: f64 = number.to_string().parse().ok()?;
                Some(serde_json::json!({ "asset": currency, "quantity": quantity }))
            })
            .collect();
        entry.as_object_mut()?.insert("contents".into(), Value::Array(contents));
    }

    Some(Value::Object(accounts))
}
