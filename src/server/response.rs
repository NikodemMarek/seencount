use serde_json::Value;
use std::{fs, io::Cursor, path::Path};
use tiny_http::{Header, Response, StatusCode};

pub fn json_header() -> Header {
    Header::from_bytes("Content-Type", "application/json").unwrap()
}

pub fn content_type_for(filename: &str) -> &'static str {
    match filename.rsplit('.').next() {
        Some("html") => "text/html; charset=utf-8",
        Some("js")   => "application/javascript",
        Some("css")  => "text/css",
        Some("ico")  => "image/x-icon",
        Some("json") => "application/json",
        _            => "application/octet-stream",
    }
}

pub fn send_json(req: tiny_http::Request, value: &Value) {
    let body = serde_json::to_vec(value).unwrap_or_default();
    let len = body.len();
    let _ = req.respond(Response::new(
        StatusCode(200),
        vec![json_header()],
        Cursor::new(body),
        Some(len),
        None,
    ));
}

pub fn send_forbidden(req: tiny_http::Request) {
    let body = b"403 Forbidden: Access restricted to allowed locations and static assets.";
    let _ = req.respond(Response::new(
        StatusCode(403),
        vec![],
        Cursor::new(body.as_slice()),
        Some(body.len()),
        None,
    ));
}

pub fn send_not_found(req: tiny_http::Request) {
    let body = b"404 Not Found";
    let _ = req.respond(Response::new(
        StatusCode(404),
        vec![],
        Cursor::new(body.as_slice()),
        Some(body.len()),
        None,
    ));
}

pub fn send_file(req: tiny_http::Request, path: &Path) {
    let mime = content_type_for(&path.to_string_lossy());
    match fs::read(path) {
        Ok(bytes) => {
            let len = bytes.len();
            let ct = Header::from_bytes("Content-Type", mime).unwrap();
            let _ = req.respond(Response::new(
                StatusCode(200),
                vec![ct],
                Cursor::new(bytes),
                Some(len),
                None,
            ));
        }
        Err(_) => send_not_found(req),
    }
}
