[CmdletBinding()]
param()
$ErrorActionPreference = 'Stop'
$root = (Get-Location).Path
$sourceRoot = Join-Path $root 'mrch for avatar'
$targetRoot = Join-Path $root 'public/library/merch-textured'
New-Item -ItemType Directory -Path $targetRoot -Force | Out-Null
Get-ChildItem -LiteralPath $sourceRoot -Directory | ForEach-Object {
  $target = Join-Path $targetRoot $_.Name
  New-Item -ItemType Directory -Path $target -Force | Out-Null
  Get-ChildItem -LiteralPath $_.FullName -File | ForEach-Object { Copy-Item -LiteralPath $_.FullName -Destination $target -Force }
}
