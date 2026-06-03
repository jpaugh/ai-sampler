{ pkgs ? import <nixpkgs> { config = { allowUnfree = true; }; } }:

with pkgs;
mkShell {
  buildInputs = [
    nodejs_20
    pnpm
    butler
    vscode-fhs
    playwright
    playwright-driver.browsers
  ];
  shellHook = ''
    alias p=pnpm
    export PLAYWRIGHT_BROWSERS_PATH=${pkgs.playwright-driver.browsers}
    export PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=true
    export PLAYWRIGHT_HOST_PLATFORM_OVERRIDE="ubuntu-24.04"
  '';
}
