# Build and Deployment

- Uses GitHub Actions for CI/CD
- Caches npm dependencies for faster builds
- Automatically deploys to GitHub Pages

## Dependency Management

When updating dependencies:

1. Run `npm install` to update dependencies
2. Commit the updated `package-lock.json`:
   ```bash
   git add package-lock.json
   git commit -m "chore: update dependencies"
   ```

This ensures:
- Consistent builds across environments
- Proper caching in CI
- Reliable dependency resolution
