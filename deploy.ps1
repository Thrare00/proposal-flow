# Clean up existing docs folder
if (Test-Path .\docs) {
    Remove-Item .\docs -Recurse -Force
}

# Create new docs folder
New-Item -ItemType Directory .\docs

# Copy all files from build-temp to docs
Copy-Item .\build-temp\* .\docs -Recurse

# Add, commit, and push changes
git add docs
git commit -m '📦 Deploy to GitHub Pages'
git push origin main
