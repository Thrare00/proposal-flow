# Script to rename UI component files to lowercase
# Run this in PowerShell

$uiDir = "src/components/ui"

# List of files to rename (from -> to)
$filesToRename = @(
    @("Input.jsx", "input.jsx"),
    @("Button.jsx", "button.jsx"),
    @("Label.jsx", "label.jsx"),
    @("Select.jsx", "select.jsx")
)

foreach ($filePair in $filesToRename) {
    $oldPath = Join-Path $uiDir $filePair[0]
    $newPath = Join-Path $uiDir $filePair[1]
    
    if (Test-Path $oldPath) {
        Write-Host "Renaming $($filePair[0]) to $($filePair[1])"
        git mv -f $oldPath $newPath
    } else {
        Write-Host "Skipping $($filePair[0]) - file not found"
    }
}

# Also ensure the index.js is lowercase
git mv -f "$uiDir/Index.js" "$uiDir/index.js" 2>$null

Write-Host "\nRenaming complete. Please verify the changes with 'git status' and commit them."
