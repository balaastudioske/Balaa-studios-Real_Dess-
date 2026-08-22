[CmdletBinding()]
param([string]$Destination = 'library/clothes/_extracted/tripo')

$ErrorActionPreference = 'Stop'
$root = (Get-Location).Path
$source = Join-Path $root 'library/clothes'
$destinationRoot = Join-Path $root $Destination
New-Item -ItemType Directory -Path $destinationRoot -Force | Out-Null
Get-ChildItem -LiteralPath $source -Filter '*.zip' -File | ForEach-Object {
  $name = [IO.Path]::GetFileNameWithoutExtension($_.Name) -replace '[^A-Za-z0-9]+', '-'
  $destination = Join-Path $destinationRoot $name
  if (-not (Test-Path $destination)) {
    Expand-Archive -LiteralPath $_.FullName -DestinationPath $destination -Force
  }
}
Get-ChildItem -LiteralPath $destinationRoot -Recurse -File |
  Select-Object FullName, Extension, Length |
  ConvertTo-Json -Depth 3 |
  Set-Content -LiteralPath (Join-Path $destinationRoot 'inventory.json') -Encoding utf8
