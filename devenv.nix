{
  inputs,
  pkgs,
  ...
}: let
  rustledger = inputs.rustledger.packages.${pkgs.stdenv.system}.default;
in {
  packages = [
    pkgs.wasm-pack
    pkgs.esbuild
    rustledger
  ];

  languages = {
    typescript = {
      enable = true;
      lsp.enable = true;
    };
    python.enable = true;
    rust = {
      lsp.enable = true;
      enable = true;
      channel = "nightly";
      targets = ["wasm32-unknown-unknown"];
      components = ["rustc" "cargo" "clippy" "rustfmt" "rust-src"];
    };
  };

  scripts.build-frontend.exec = ''
    wasm-pack build --target web
    esbuild src/script.ts --bundle --outfile=script.js --loader:.wasm=binary --target=es2022
  '';

  processes = {
    frontend = {
      exec = "build-frontend";
      watch = {
        paths = [./src];
        extensions = ["rs" "ts" "css"];
      };
    };
    backend = {
      exec = "python3 server.py";
      watch = {
        paths = [./server.py];
        extensions = ["py"];
      };
    };
  };

  containers."app" = {
    name = "app";
    version = "latest";
    copyToRoot = [
      ./server.py
      ./index.html
      ./style.css
      ./script.js
    ];
    startupCommand = ''
      export RUSTLEDGER=${rustledger}/bin/rledger
      ${pkgs.python3}/bin/python3 server.py
    '';
  };
}
