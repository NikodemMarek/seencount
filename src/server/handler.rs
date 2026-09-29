use serde_json::Value;
use std::collections::HashSet;
use tiny_http::Method;

use crate::{
    beancount::handle_assets,
    config::AppState,
    locations::get_available_locations,
    response::{send_file, send_forbidden, send_json, send_not_found},
};

const STATIC_FILES: &[&str] = &["", "index.html", "script.js", "style.css", "favicon.ico"];

pub fn handle_request(req: tiny_http::Request, state: &AppState) {
    if *req.method() != Method::Get {
        send_not_found(req);
        return;
    }

    // Strip query string
    let full_path = req.url().to_owned();
    let path = full_path.split('?').next().unwrap_or("/");

    match path {
        "/assets" => {
            let value = handle_assets(state).unwrap_or(Value::Object(Default::default()));
            send_json(req, &value);
        }
        "/locations" => {
            let locations = Value::Array(get_available_locations(&state.asset_dir));
            send_json(req, &locations);
        }
        p => {
            let rel = p.trim_start_matches('/');

            if STATIC_FILES.contains(&rel) {
                let name = if rel.is_empty() { "index.html" } else { rel };
                send_file(req, &state.program_dir.join(name));
                return;
            }

            // No path traversal
            if rel.contains('/') || rel.contains('\\') {
                send_forbidden(req);
                return;
            }

            let allowed: HashSet<String> = get_available_locations(&state.asset_dir)
                .into_iter()
                .filter_map(|loc| loc.get("filename").and_then(Value::as_str).map(str::to_owned))
                .collect();

            if allowed.contains(rel) {
                send_file(req, &state.asset_dir.join(rel));
            } else {
                send_forbidden(req);
            }
        }
    }
}
