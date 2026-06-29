$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$tauriConfig = Get-Content (Join-Path $root "src-tauri/tauri.conf.json") -Raw | ConvertFrom-Json
$version = $tauriConfig.version
$mainBinary = $tauriConfig.mainBinaryName

$releaseDir = Join-Path $root "src-tauri/target/release"
$nsisDir = Join-Path $releaseDir "bundle/nsis"
$distDir = Join-Path $root "packages/windows"
$portableFolderName = "Snow-Shot-Mini_${version}_x64-portable"
$portableDir = Join-Path $distDir $portableFolderName

$exePath = Join-Path $releaseDir "$mainBinary.exe"
if (-not (Test-Path $exePath)) {
	Write-Error "Main binary not found: $exePath. Run pnpm build:windows first."
}

New-Item -ItemType Directory -Force -Path $distDir | Out-Null

if (Test-Path $portableDir) {
	Remove-Item -Recurse -Force $portableDir
}
New-Item -ItemType Directory -Force -Path $portableDir | Out-Null

Copy-Item $exePath $portableDir
Get-ChildItem $releaseDir -Filter "*.dll" | ForEach-Object {
	Copy-Item $_.FullName $portableDir
}
New-Item -ItemType File -Path (Join-Path $portableDir "__portable") -Force | Out-Null

$zipPath = Join-Path $distDir "$portableFolderName.zip"
if (Test-Path $zipPath) {
	Remove-Item -Force $zipPath
}
Compress-Archive -Path $portableDir -DestinationPath $zipPath -CompressionLevel Optimal

if (Test-Path $nsisDir) {
	Get-ChildItem $nsisDir -Filter "*-setup.exe" | ForEach-Object {
		if ($_.Name -like "Snow Shot Mini*") {
			Copy-Item $_.FullName (Join-Path $distDir $_.Name) -Force
		}
	}
}

Write-Host "Packaged artifacts in packages/windows/:"
Get-ChildItem $distDir | ForEach-Object {
	Write-Host "  - $($_.Name) ($([math]::Round($_.Length / 1MB, 2)) MB)"
}
