import http from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { dirname, extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const projectRoot = normalize(join(dirname(__filename), '..'));
const docsDir = join(projectRoot, 'docs');
const basePath = '/proposal-flow';
const host = '0.0.0.0';
const port = Number(process.env.PORT || 5010);

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function sendFile(res, filePath) {
  const ext = extname(filePath).toLowerCase();
  const type = contentTypes[ext] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': type });
  createReadStream(filePath).pipe(res);
}

function sendIndex(res) {
  sendFile(res, join(docsDir, 'index.html'));
}

function resolveRequestPath(urlPath) {
  let requestPath = decodeURIComponent(urlPath.split('?')[0]);
  if (requestPath === '/') {
    return join(docsDir, 'index.html');
  }
  if (requestPath === basePath || requestPath === `${basePath}/`) {
    return join(docsDir, 'index.html');
  }
  if (requestPath.startsWith(`${basePath}/`)) {
    requestPath = requestPath.slice(basePath.length);
  }
  const safePath = normalize(requestPath).replace(/^(\.\.[/\\])+/, '');
  return join(docsDir, safePath);
}

const server = http.createServer((req, res) => {
  const filePath = resolveRequestPath(req.url || '/');

  if (existsSync(filePath) && statSync(filePath).isFile()) {
    sendFile(res, filePath);
    return;
  }

  sendIndex(res);
});

server.listen(port, host, () => {
  console.log(`Preview server running at http://localhost:${port}/`);
  console.log(`Also available at http://localhost:${port}${basePath}`);
});
