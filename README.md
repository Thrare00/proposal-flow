# Proposal Flow

A modern web application for managing proposal development workflow.

## Requirements

- Node.js 18 or higher (LTS version recommended)

## Features

- Proposal management
- Task tracking
- File organization
- Status tracking
- Deadline management

## Deployment

The application is deployed to GitHub Pages at: https://thrare00.github.io/proposal-flow/

## Installation

1. Clone the repository:
```bash
git clone https://github.com/thrare00/proposal-flow.git
cd proposal-flow
```

2. Install dependencies:
```bash
npm install
```

For CI environments, use:
```bash
npm ci
```

## Development

Start the development server:
```bash
npm run dev
```

The app will open automatically in your browser at `http://localhost:3000`.

## Building

To build the project and deploy:
```bash
npm run build:all
```

This will:
1. Clean the `dist` and `docs` directories
2. Build the application with type declarations
3. Deploy to GitHub Pages

## Deployment

The project is automatically deployed to GitHub Pages. Manual deployment can be done with:
```bash
npm run build:gh
```

## TypeScript Type Declarations

TypeScript declaration files are automatically generated during the main build process using `vite-plugin-dts`. The declarations are generated in the `dist/types` directory and are used for type checking and IDE support.

## Troubleshooting

If you encounter issues with the build:
1. Ensure you're using Node.js ^18.0.0
2. Clean the project:
```bash
npm run clean
```
3. Reinstall dependencies:
```bash
npm ci
```
4. Try building again:
```bash
npm run build:all
```

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
