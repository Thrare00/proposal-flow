// Simple postbuild script to make GitHub Pages serve SPA routes
// Copies docs/index.html to docs/404.html so page refreshes on deep routes work
import { promises as fs } from 'fs';
import path from 'path';

async function main() {
  try {
    const outDir = path.resolve('docs');
    const indexPath = path.join(outDir, 'index.html');
    const notFoundPath = path.join(outDir, '404.html');

    // Ensure index.html exists
    await fs.access(indexPath);

    // Read index and write 404.html
    const html = await fs.readFile(indexPath, 'utf8');
    await fs.writeFile(notFoundPath, html, 'utf8');

    console.log(`[postbuild] 404.html created at: ${notFoundPath}`);
  } catch (err) {
    console.error('[postbuild] Failed to create 404.html:', err?.message || err);
    process.exitCode = 0; // do not fail the build
  }
}

main();
