{
  inputs,
  pkgs,
  ...
}: let
  rustledger = inputs.rustledger.packages.${pkgs.stdenv.system}.default;
  server = pkgs.stdenv.mkDerivation {
    name = "seencount-server";
    src = ./.;
    buildInputs = [ pkgs.cargo ];
    buildPhase = "cargo build --release --bin server";
    installPhase = "install -Dm755 target/release/server $out/bin/server";
  };
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
      exec = "cargo run --bin server";
      watch = {
        paths = [./src/server];
        extensions = ["rs"];
      };
    };
  };

  containers."app" = {
    name = "app";
    version = "latest";
    copyToRoot = [
      ./index.html
      ./style.css
      ./script.js
    ];
    startupCommand = ''
      export RUSTLEDGER=${rustledger}/bin/rledger
      ${server}/bin/server
    '';
  };
}
