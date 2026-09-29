use serde_json::Value;
use std::process::Command;

use crate::config::AppState;

const ACCOUNTS_METADATA_COMMAND: &str =
    "SELECT accounts, meta FROM #entries WHERE type = 'open' and accounts ~ 'Assets:Locations'";

fn query_beancount(state: &AppState, query: &str) -> Option<Value> {
    let output = Command::new("sh")
        .arg("-c")
        .arg(format!(
            r#""{}" query -f json "{}" "{}""#,
            state.rledger_bin,
            state.beancount_file.display(),
            query
        ))
        .output()
        .ok()?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    serde_json::from_str(stdout.trim()).ok()
}

fn get_balance(state: &AppState, account: &str) -> Vec<Value> {
    let query = format!("BALANCES WHERE account = '{account}'");
    let balance_raw = query_beancount(state, &query).unwrap_or_default();

    let rows = balance_raw.get("rows").and_then(Value::as_array).cloned().unwrap_or_default();
    if rows.is_empty() {
        return vec![];
    }

    rows[0]
        .get(1)
        .and_then(|v| v.get("positions"))
        .and_then(Value::as_array)
        .cloned()
        .unwrap_or_default()
        .into_iter()
        .filter_map(|pos| {
            let currency = pos.get("currency")?.as_str()?.to_owned();
            let number: f64 = pos.get("number")?.as_str()?.parse().ok()?;
            Some(serde_json::json!({ "asset": currency, "quantity": number }))
        })
        .collect()
}

pub fn handle_assets(state: &AppState) -> Option<Value> {
    let accounts_raw = query_beancount(state, ACCOUNTS_METADATA_COMMAND)?;
    let rows = accounts_raw.get("rows").and_then(Value::as_array).cloned().unwrap_or_default();

    let mut accounts = serde_json::Map::new();
    for row in &rows {
        let row_arr = row.as_array()?;
        let account_id = row_arr
            .first()
            .and_then(|v| v.as_array())
            .and_then(|a| a.first())
            .and_then(Value::as_str)
            .unwrap_or("")
            .to_owned();

        let mut entry = match row_arr.get(1).cloned().unwrap_or_default() {
            Value::Object(m) => m,
            _ => Default::default(),
        };
        entry.remove("filename");
        entry.remove("lineno");
        entry.insert("id".into(), Value::String(account_id.clone()));
        entry.insert("contents".into(), Value::Array(get_balance(state, &account_id)));
        accounts.insert(account_id, Value::Object(entry));
    }

    Some(Value::Object(accounts))
}
