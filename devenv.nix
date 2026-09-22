{pkgs, ...}: {
  packages = [
    pkgs.wasm-pack
    pkgs.esbuild
  ];

  languages = {
    typescript = {
      enable = true;
      lsp.enable = true;
    };
    python.enable = true;
    rust = {
      enable = true;
      channel = "nightly";
      targets = ["wasm32-unknown-unknown"];
      components = ["rustc" "cargo" "clippy" "rustfmt" "rust-src"];
    };
  };

  processes = {
    frontend = {
      exec = ''
        wasm-pack build --target web
        esbuild src/script.ts --bundle --outfile=script.js --loader:.wasm=binary --target=es2022
      '';
    };
    backend = {
      exec = "python3 server.py";
      watch = {
        paths = [./server.py];
        extensions = ["py"];
      };
    };
  };
}
