# WPF smoke test — writes its verdict to the path in argv[1]
param([string]$Out = "$env:TEMP\wpf_test.txt")
try {
  Add-Type -AssemblyName PresentationFramework
  Add-Type -AssemblyName PresentationCore
  Add-Type -AssemblyName WindowsBase
  Add-Type -AssemblyName System.Xaml
  $win = New-Object System.Windows.Window
  $win.AllowsTransparency = $true
  $win.Background = [System.Windows.Media.Brushes]::Transparent
  $win.WindowStyle = [System.Windows.WindowStyle]::None
  $win.Topmost = $true
  $win.SizeToContent = [System.Windows.SizeToContent]::WidthAndHeight
  $border = New-Object System.Windows.Controls.Border
  $border.Width = 46
  $border.Height = 46
  $border.CornerRadius = New-Object System.Windows.CornerRadius(13)
  $border.Background = New-Object System.Windows.Media.SolidColorBrush((New-Object System.Windows.Media.ColorConverter).ConvertFromString('#C9101013'))
  $border.BorderBrush = New-Object System.Windows.Media.SolidColorBrush((New-Object System.Windows.Media.ColorConverter).ConvertFromString('#E0A94F'))
  $border.BorderThickness = New-Object System.Windows.Thickness(1)
  $text = New-Object System.Windows.Controls.TextBlock
  $text.Text = 'OK'
  $text.Foreground = [System.Windows.Media.Brushes]::White
  $border.Child = $text
  $win.Content = $border
  $win.Show()
  Start-Sleep -Milliseconds 600
  $line = 'SHOWN visible=' + $win.IsVisible + ' hwnd=' + (New-Object System.Windows.Interop.WindowInteropHelper($win)).Handle
  Set-Content -Path $Out -Value $line -Encoding UTF8
  $win.Close()
} catch {
  Set-Content -Path $Out -Value ('ERR: ' + $_.Exception.ToString()) -Encoding UTF8
}
