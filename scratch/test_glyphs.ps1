Add-Type -AssemblyName PresentationCore

$star = [char]::ConvertToUtf32('★', 0)
$heart = [char]::ConvertToUtf32('♥', 0)

$fonts = @('Times New Roman', 'Arial', 'Segoe UI', 'Segoe UI Symbol', 'Segoe UI Emoji', 'Courier New', 'Georgia', 'Consolas', 'Plus Jakarta Sans', 'Inter')

foreach ($fn in $fonts) {
    try {
        $fontFamily = New-Object System.Windows.Media.FontFamily($fn)
        $typefaces = $fontFamily.GetTypefaces()
        $found = $false
        foreach ($tf in $typefaces) {
            $glyphTypeface = $null
            if ($tf.TryGetGlyphTypeface([ref]$glyphTypeface)) {
                $hasStar = $glyphTypeface.CharacterToGlyphMap.ContainsKey($star)
                $hasHeart = $glyphTypeface.CharacterToGlyphMap.ContainsKey($heart)
                Write-Output ("Font: {0,-20} | Has Star: {1,-5} | Has Heart: {2,-5}" -f $fn, $hasStar, $hasHeart)
                $found = $true
                break
            }
        }
        if (-not $found) {
            Write-Output ("Font: {0,-20} | Not installed or no glyph typeface" -f $fn)
        }
    } catch {
        Write-Output ("Error checking " + $fn)
    }
}
