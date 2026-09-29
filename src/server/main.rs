mod beancount;
mod config;
mod handler;
mod locations;
mod response;

use std::sync::Arc;
use tiny_http::Server;

use config::AppState;
use handler::handle_request;

fn main() {
    let state = Arc::new(AppState::from_env());
    let port: u16 = std::env::var("PORT")
        .ok()
        .and_then(|p| p.parse().ok())
        .unwrap_or(8000);

    println!(
        "Serving program from {} and assets from {} on http://localhost:{port}",
        state.program_dir.display(),
        state.asset_dir.display()
    );

    let server = Arc::new(
        Server::http(format!("0.0.0.0:{port}")).expect("Failed to start server"),
    );

    let threads: Vec<_> = (0..std::thread::available_parallelism().map_or(4, |n| n.get()))
        .map(|_| {
            let server = server.clone();
            let state = state.clone();
            std::thread::spawn(move || {
                for req in server.incoming_requests() {
                    handle_request(req, &state);
                }
            })
        })
        .collect();

    for t in threads {
        let _ = t.join();
    }
}
