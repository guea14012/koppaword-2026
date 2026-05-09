# KOPPAWORD 2026 - Windows Build Script
# Run from project root:  .\scripts\build.ps1

param(
  [switch]$SkipIcons,
  [switch]$DevBuild,
  [string]$Target = "win"
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path $PSScriptRoot -Parent

Write-Host ""
Write-Host "  ╔══════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "  ║   KOPPAWORD 2026  Build System       ║" -ForegroundColor Cyan
Write-Host "  ╚══════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

Set-Location $ProjectRoot

# ── 1. Install dependencies ───────────────────────────────────────────────────
Write-Host "► Installing dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) { throw "npm install failed" }

# ── 2. Generate icons ─────────────────────────────────────────────────────────
if (-not $SkipIcons) {
  Write-Host "► Generating icons..." -ForegroundColor Yellow
  node scripts/make-icons.js

  # Convert PNG to ICO using png-to-ico if available
  $pngToIco = Get-Command "png-to-ico" -ErrorAction SilentlyContinue
  if ($pngToIco) {
    Write-Host "  Converting to ICO..." -ForegroundColor DarkGray
    & png-to-ico assets/icon-256.png | Set-Content -Encoding Byte assets/icon.ico
    & png-to-ico assets/kwdoc.png    | Set-Content -Encoding Byte assets/kwdoc.ico
    Write-Host "  ✓ ICO files created" -ForegroundColor Green
  } else {
    Write-Host "  ⚠ png-to-ico not found. Install: npm i -g png-to-ico" -ForegroundColor DarkYellow
    Write-Host "    Build will continue but Windows icon may be default." -ForegroundColor DarkGray
    # Create a minimal placeholder if ICO missing
    if (-not (Test-Path "assets/icon.ico")) {
      Copy-Item "assets/icon.png" "assets/icon.ico" -ErrorAction SilentlyContinue
    }
  }
}

# ── 3. TypeScript check ───────────────────────────────────────────────────────
Write-Host "► Type checking..." -ForegroundColor Yellow
npx tsc --noEmit
if ($LASTEXITCODE -ne 0) { Write-Host "  ⚠ Type errors found (continuing)" -ForegroundColor DarkYellow }

# ── 4. Build renderer (Vite) ──────────────────────────────────────────────────
Write-Host "► Building renderer..." -ForegroundColor Yellow
npx vite build
if ($LASTEXITCODE -ne 0) { throw "Vite build failed" }

# ── 5. Package with electron-builder ─────────────────────────────────────────
Write-Host "► Packaging with electron-builder ($Target)..." -ForegroundColor Yellow
switch ($Target) {
  "win"   { npx electron-builder --win }
  "linux" { npx electron-builder --linux }
  "mac"   { npx electron-builder --mac }
  "all"   { npx electron-builder -wl }
}
if ($LASTEXITCODE -ne 0) { throw "electron-builder failed" }

# ── 6. Done ───────────────────────────────────────────────────────────────────
$version = (Get-Content "package.json" | ConvertFrom-Json).version
$releaseDir = "release\$version"

Write-Host ""
Write-Host "  ══════════════════════════════════════" -ForegroundColor Green
Write-Host "  ✅  Build complete!" -ForegroundColor Green
Write-Host "  📦  Output: $releaseDir\" -ForegroundColor Green
Write-Host ""

if (Test-Path $releaseDir) {
  Write-Host "  Files:" -ForegroundColor White
  Get-ChildItem $releaseDir | Where-Object { !$_.PSIsContainer } | ForEach-Object {
    $size = [math]::Round($_.Length / 1MB, 1)
    Write-Host "    $($_.Name)  ($size MB)" -ForegroundColor Gray
  }
}
Write-Host ""
