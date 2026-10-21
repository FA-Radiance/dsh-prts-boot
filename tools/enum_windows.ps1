param([int]$TargetPid)
Add-Type -Namespace PrtsWin -Name Enum -MemberDefinition @'
[DllImport("user32.dll")] public static extern bool EnumWindows(EnumWindowsProc cb, IntPtr l);
public delegate bool EnumWindowsProc(IntPtr h, IntPtr l);
[DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
[DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr h);
[DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECT r);
[StructLayout(LayoutKind.Sequential)] public struct RECT { public int L; public int T; public int R; public int B; }
'@
$found = New-Object System.Collections.ArrayList
$cb = [PrtsWin.Enum+EnumWindowsProc]{
  param($h, $l)
  $pidOut = [uint32]0
  [PrtsWin.Enum]::GetWindowThreadProcessId($h, [ref]$pidOut) | Out-Null
  if ($pidOut -eq $TargetPid) {
    $r = New-Object PrtsWin.Enum+RECT
    [PrtsWin.Enum]::GetWindowRect($h, [ref]$r) | Out-Null
    $vis = [PrtsWin.Enum]::IsWindowVisible($h)
    [void]$found.Add(("hwnd=" + $h + " vis=" + $vis + " rect=(" + $r.L + "," + $r.T + "," + $r.R + "," + $r.B + ")"))
  }
  return $true
}
[PrtsWin.Enum]::EnumWindows($cb, [IntPtr]::Zero) | Out-Null
if ($found.Count -eq 0) { 'NO WINDOWS' } else { $found -join "`r`n" }
