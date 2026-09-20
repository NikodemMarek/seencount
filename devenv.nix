{pkgs, ...}: {
  packages = [
    pkgs.esbuild
  ];

  languages = {
    typescript = {
      enable = true;
      lsp.enable = true;
    };
    python.enable = true;
  };

  processes = {
    frontend = {
      exec = "esbuild src/script.ts --bundle --outfile=script.js --watch=forever";
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
