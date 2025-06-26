Write-Host "Cleaning previous build..."
Remove-Item -Recurse -Force './dist' -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force './docs' -ErrorAction SilentlyContinue

Write-Host "Building Vite..."
try {
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Vite build failed. Exiting..."
        exit 1
    }
} catch {
    Write-Host "Error during build: $_"
    exit 1
}

Write-Host "Copying to docs folder..."
if (Test-Path './dist') {
    if (-not (Test-Path './docs')) {
        New-Item -ItemType Directory -Force -Path './docs'
    }
    Copy-Item -Path './dist/*' -Destination './docs' -Recurse -Force
    Write-Host "Successfully copied files to docs folder"
} else {
    Write-Host "Error: dist directory not found. Build may have failed."
    exit 1
}

Write-Host "Build completed successfully!"
