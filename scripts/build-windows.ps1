$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $root

Write-Host "==> Building frontend..."
pnpm build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "==> Building Tauri app (installer + binaries)..."
pnpm tauri build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "==> Packaging portable build..."
pnpm package:windows
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
