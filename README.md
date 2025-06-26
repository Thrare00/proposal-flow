# Proposal Flow

A modern web application for managing proposal development workflow.

## Requirements

- Node.js 18.0.0 or higher

## Features

- Proposal management
- Task tracking
- File organization
- Status tracking
- Deadline management

## Deployment

The application is deployed to GitHub Pages at: https://thrare00.github.io/proposal-flow/

## Development

1. Install Node.js 18.0.0 or higher from https://nodejs.org/

2. Install dependencies:
```bash
# First, clean up any existing modules
npx rimraf node_modules package-lock.json

# Install all dependencies
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

5. Build everything (including type declarations and GitHub Pages):
```bash
npm run build:all
```

Note: The `build:all` script performs all build steps:
- Cleans previous builds
- Builds production assets
- Generates TypeScript declarations (using `npx vite-plugin-dts`)
- Builds for GitHub Pages

## TypeScript Type Declarations

The `build:dts` script generates TypeScript declaration files using `vite-plugin-dts`. This is automatically invoked as part of `build:all` but can also be run independently:
```bash
npm run build:dts
```

The declarations are generated in the `dist` directory and are used for type checking and IDE support.

## Troubleshooting

If you encounter any dependency issues:

1. Remove stale modules:
```bash
npx rimraf node_modules package-lock.json
```

2. Reinstall dependencies:
```bash
npm install
```

Note: The project uses Vite as its build tool. If you encounter any Vite-related errors, ensure you have the latest version installed by running `npm install`.
