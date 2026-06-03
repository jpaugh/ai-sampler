{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  packages = with pkgs; [
    (python3.withPackages (py: [
      py.pandas
      py.pip
      # py.venv
      py.torch
      #py.pymupdf
      py.virtualenv
      py.tqdm
      py.transformers
      py.sentence-transformers
      py.appdirs
      py.accelerate
    ]))

    stdenv
    gcc
    zlib
  ];

  shellHook = ''
    export ZLIB_PATH="${pkgs.zlib}"
    export GCC_PATH="${pkgs.gcc}"
    export LD_LIBRARY_PATH="/nix/store/7c0v0kbrrdc2cqgisi78jdqxn73n3401-gcc-14.2.1.20250322-lib/lib:$ZLIB_PATH/lib:$LD_LIBRARY_PATH"
    source .venv/bin/activate
  '';
}
