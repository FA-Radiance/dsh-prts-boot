# Capture the DeepSeek Harness window to a PNG for visual verification.
# PrintWindow with PW_RENDERFULLCONTENT works for Chromium/Electron windows.
param(
  [string]$Out = "D:\文件\deepseek-harness\default-workspace\dsh-prts-boot\.shots\app.png",
  [int]$ProcessId = 0,
  [string]$TitleLike = "DeepSeek Harness"
)
Add-Type -AssemblyName System.Drawing
$src = @'
using System;
using System.Runtime.InteropServices;
public class PrtsShot {
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECT r);
  [DllImport("user32.dll")] public static extern bool PrintWindow(IntPtr h, IntPtr dc, uint f);
  [DllImport("user32.dll")] public static extern bool SetProcessDPIAware();
  [StructLayout(LayoutKind.Sequential)] public struct RECT { public int L,T,R,B; }
}
'@
if (-not ("PrtsShot" -as [type])) { Add-Type -TypeDefinition $src }
[PrtsShot]::SetProcessDPIAware() | Out-Null

if ($ProcessId -eq 0) {
  $proc = Get-Process | Where-Object { $_.MainWindowTitle -like "*$TitleLike*" } | Select-Object -First 1
} else {
  $proc = Get-Process -Id $ProcessId
}
if (-not $proc) { Write-Error "window not found: $TitleLike"; exit 1 }

$h = $proc.MainWindowHandle
$r = New-Object PrtsShot+RECT
[PrtsShot]::GetWindowRect($h, [ref]$r) | Out-Null
$w = $r.R - $r.L; $ht = $r.B - $r.T
Write-Output "window $($w)x$($ht) pid=$($proc.Id) title=$($proc.MainWindowTitle)"

$bmp = New-Object System.Drawing.Bitmap($w, $ht)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$dc = $g.GetHdc()
$ok = [PrtsShot]::PrintWindow($h, $dc, 2)
$g.ReleaseHdc($dc)
$g.Dispose()
$dir = Split-Path -Parent $Out
if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir | Out-Null }
$bmp.Save($Out, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
Write-Output "printwindow=$ok saved=$Out"
