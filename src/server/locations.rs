use serde_json::Value;
use std::{fs, path::Path};

pub fn get_available_locations(asset_dir: &Path) -> Vec<Value> {
    let mut items = Vec::new();

    let Ok(read_dir) = fs::read_dir(asset_dir) else { return items };

    for entry in read_dir.flatten() {
        let path = entry.path();
        if path.extension().and_then(|e| e.to_str()) != Some("json") || !path.is_file() {
            continue;
        }

        let Ok(contents) = fs::read_to_string(&path) else { continue };
        let Ok(data) = serde_json::from_str::<Value>(&contents) else { continue };
        if data.get("type").and_then(Value::as_str) != Some("FeatureCollection") {
            continue;
        }

        let filename = path.file_name().unwrap().to_string_lossy().into_owned();
        let fallback_name = filename
            .strip_suffix(".json")
            .unwrap_or(&filename)
            .replace('_', " ")
            .split_whitespace()
            .map(|w| {
                let mut c = w.chars();
                match c.next() {
                    None => String::new(),
                    Some(f) => f.to_uppercase().to_string() + c.as_str(),
                }
            })
            .collect::<Vec<_>>()
            .join(" ");

        let beancount_id = data
            .get("properties")
            .and_then(|p| p.get("beancount_id"))
            .cloned()
            .unwrap_or(Value::Null);

        let name = data
            .get("name")
            .and_then(Value::as_str)
            .filter(|s| !s.is_empty())
            .map(|s| Value::String(s.to_owned()))
            .unwrap_or_else(|| Value::String(fallback_name));

        items.push(serde_json::json!({
            "filename": filename,
            "data": data,
            "beancount_id": beancount_id,
            "name": name,
        }));
    }

    items
}
