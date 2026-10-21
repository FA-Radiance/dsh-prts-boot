# Partial-name resolution test — writes verdict to argv[1]
param([string]$Out = "$env:TEMP\wpf_partial.txt")
$lines = @()
try {
  $w = New-Object Windows.Window
  $lines += 'Window partial OK'
} catch {
  $lines += 'Window partial ERR: ' + $_.Exception.Message
}
try {
  $b = New-Object Windows.Controls.Border
  $lines += 'Border partial OK'
} catch {
  $lines += 'Border partial ERR: ' + $_.Exception.Message
}
try {
  $b2 = New-Object Windows.Media.SolidColorBrush((New-Object Windows.Media.ColorConverter).ConvertFromString('#C9101013'))
  $lines += 'Brush partial OK'
} catch {
  $lines += 'Brush partial ERR: ' + $_.Exception.Message
}
Set-Content -Path $Out -Value ($lines -join "`r`n") -Encoding UTF8
