# This script is intended to be run in GitHub Actions
# It will set up GitHub Pages settings using the GitHub CLI

# Install GitHub CLI if not already installed
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Host "Installing GitHub CLI..."
    Invoke-WebRequest -Uri "https://github.com/cli/cli/releases/download/v2.35.0/gh_2.35.0_windows_amd64.msi" -OutFile "gh.msi"
    Start-Process msiexec.exe -Wait -ArgumentList "/i gh.msi /quiet"
    Remove-Item gh.msi
}

# Authenticate with GitHub CLI
Write-Host "Authenticating with GitHub CLI..."
gh auth login --with-token <<< "${{ secrets.GITHUB_TOKEN }}"

# Set up GitHub Pages
Write-Host "Setting up GitHub Pages..."
gh repo edit --pages-source main:/ --pages https://${{ github.actor }}.github.io/proposal-flow
