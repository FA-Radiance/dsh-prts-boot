param(
  [Parameter(Mandatory = $true)][string]$Query,
  [Parameter(Mandatory = $true)][string]$Out,
  [int]$W = 1712,
  [int]$H = 972,
  [int]$Scale = 2,
  [int]$Budget = 1200,
  [string]$Page = 'index.html'
)

$edge = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
if ($Query -match '^https?://') {
  $url = $Query
} else {
  $url = "file:///D:/%E6%96%87%E4%BB%B6/deepseek-harness/default-workspace/dsh-prts-boot/preview/$Page`?$Query"
}
# Unique profile per shot: a shared user-data-dir makes consecutive runs fail
# silently (the first Edge instance still holds the profile lock).
$profile = Join-Path $env:TEMP ("edge-shot-" + [guid]::NewGuid().ToString('N'))
try {
  & $edge --headless=new --disable-gpu --hide-scrollbars --no-first-run --no-sandbox `
    --user-data-dir="$profile" --force-device-scale-factor=$Scale `
    --window-size="$W,$H" --virtual-time-budget=$Budget --screenshot="$Out" $url 2>$null | Out-Null
} finally {
  if (Test-Path $profile) { Remove-Item -Recurse -Force $profile -ErrorAction SilentlyContinue }
}
if (Test-Path $Out) { Write-Output "ok $Out" } else { Write-Output "FAILED $Out" }
