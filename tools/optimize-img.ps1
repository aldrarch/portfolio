Add-Type -AssemblyName System.Drawing
$dir = "C:\Users\Alexandra\Downloads\portfolio-site\assets\img"
Get-ChildItem $dir -Filter *.jpg | ForEach-Object {
  $img = [System.Drawing.Image]::FromFile($_.FullName)
  $maxW = 1800
  if ($img.Width -gt $maxW) {
    $ratio = $maxW / $img.Width
    $newW = $maxW; $newH = [int]($img.Height * $ratio)
    $bmp = New-Object System.Drawing.Bitmap($newW, $newH)
    $gfx = [System.Drawing.Graphics]::FromImage($bmp)
    $gfx.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $gfx.DrawImage($img, 0, 0, $newW, $newH)
    $gfx.Dispose()
    $enc = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/jpeg" }
    $params = New-Object System.Drawing.Imaging.EncoderParameters(1)
    $params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, 82L)
    $img.Dispose()
    $bmp.Save($_.FullName, $enc, $params)
    $bmp.Dispose()
  } else { $img.Dispose() }
}
Get-ChildItem $dir -Filter *.jpg | ForEach-Object { "{0}  {1:N0} KB" -f $_.Name, ($_.Length/1KB) }
