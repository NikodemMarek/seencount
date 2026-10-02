use std::path::PathBuf;

pub struct AppState {
    pub asset_dir: PathBuf,
    pub program_dir: PathBuf,
    pub beancount_file: PathBuf,
}

impl AppState {
    pub fn from_env() -> Self {
        let asset_dir: PathBuf = std::env::var("ASSET_DIR")
            .or_else(|_| std::env::var("ASSETS_DIR"))
            .unwrap_or_else(|_| ".".into())
            .into();

        let program_dir: PathBuf = std::env::var("PROGRAM_DIR")
            .or_else(|_| std::env::var("STATIC_DIR"))
            .or_else(|_| std::env::var("WEB_DIR"))
            .unwrap_or_else(|_| ".".into())
            .into();

        let beancount_file = std::env::var("BEANCOUNT_FILE")
            .map(PathBuf::from)
            .unwrap_or_else(|_| asset_dir.join("main.beancount"));

        Self { asset_dir, program_dir, beancount_file }
    }
}
