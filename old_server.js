const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = process.env.PORT || 5173;
const HOST = process.env.HOST || '0.0.0.0';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.bin': 'application/octet-stream',
  '.exr': 'image/x-exr',
  '.hdr': 'image/vnd.radiance',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mp3': 'audio/mpeg',
};

function sendFile(res, filePath, status = 200) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(status, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Content-Length': data.length,
    });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  const filePath = path.join(ROOT, urlPath === '/' ? 'index.html' : urlPath);

  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stat) => {
    if (!err && stat.isFile()) {
      sendFile(res, filePath);
      return;
    }

    // SPA fallback: replicate the origin behaviour of serving index.html
    // for any unknown path.
    const indexFile = path.join(ROOT, 'index.html');
    sendFile(res, indexFile, 200);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`FS 60P watch site serving at http://${HOST}:${PORT}`);
});
