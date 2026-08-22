[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$root = (Get-Location).Path
$source = Join-Path $root 'library/clothes/_extracted/tripo'
$destination = Join-Path $root 'public/library/wardrobe/tripo'
New-Item -ItemType Directory -Path $destination -Force | Out-Null
Get-ChildItem -LiteralPath $source -Directory | ForEach-Object {
  $target = Join-Path $destination $_.Name
  if (-not (Test-Path $target)) { New-Item -ItemType Directory -Path $target -Force | Out-Null }
  Get-ChildItem -LiteralPath $_.FullName -Force | ForEach-Object {
    Copy-Item -LiteralPath $_.FullName -Destination $target -Recurse -Force
  }
}
