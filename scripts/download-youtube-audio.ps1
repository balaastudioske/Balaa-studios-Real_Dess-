[CmdletBinding()]
param(
  [string]$OutputDirectory = "public/library/songs/youtube",
  [switch]$SkipExisting
)

$ErrorActionPreference = 'Stop'
$ytDlp = Get-Command yt-dlp -ErrorAction Stop
$ffmpeg = Get-Command ffmpeg -ErrorAction Stop
$node = Get-Command node -ErrorAction Stop
$catalog = Join-Path $PSScriptRoot '..\src\lib\balaa-catalog.ts'
$destination = Join-Path (Get-Location) $OutputDirectory
New-Item -ItemType Directory -Path $destination -Force | Out-Null

# The catalogue is the source of truth: download only IDs registered in it.
$catalogText = Get-Content -LiteralPath $catalog -Raw
$entries = [regex]::Matches($catalogText, "media\('([^']+)',\s*[^,]+,\s*'([^']+)'") | ForEach-Object {
  [PSCustomObject]@{ Id = $_.Groups[1].Value; VideoId = $_.Groups[2].Value }
}
if (-not $entries) { throw 'No REAL DESS media entries found in balaa-catalog.ts.' }
$failed = @()
foreach ($entry in $entries) {
  $target = Join-Path $destination "$($entry.Id).m4a"
  if ($SkipExisting -and (Test-Path $target)) { Write-Host "Skipping $($entry.Id)"; continue }
  & $ytDlp.Source --no-playlist --js-runtimes "node:$($node.Source)" --extract-audio --audio-format m4a --audio-quality 0 --ffmpeg-location $ffmpeg.Source --retries 3 --output (Join-Path $destination "$($entry.Id).%(ext)s") "https://www.youtube.com/watch?v=$($entry.VideoId)"
  if ($LASTEXITCODE -ne 0) { Write-Warning "yt-dlp failed for $($entry.Id); continuing."; $failed += $entry.Id }
}
if ($failed.Count) { $failed | Set-Content -LiteralPath (Join-Path $destination '_failed.txt') -Encoding utf8; Write-Warning "$($failed.Count) catalogue entries require a retry." }
