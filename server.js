const http = require('http');
const fs = require('fs');
const path = require('path');

// ✅ FIX: Use process.cwd() on Vercel, __dirname locally
const ROOT = process.env.VERCEL ? path.join(process.cwd(), 'assets') : __dirname;

// ✅ For Vercel, the files are in assets/the-watch/
// So we need to serve from the correct location
const PUBLIC_DIR = process.env.VERCEL 
  ? path.join(process.cwd(), 'assets', 'the-watch') 
  : __dirname;

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
      console.log(`❌ File not found: ${filePath}`);
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
  
  // ✅ FIX: Handle root path
  let filePath;
  if (urlPath === '/') {
    // On Vercel, index.html is at root
    filePath = path.join(process.cwd(), 'index.html');
  } else if (urlPath.startsWith('/assets/')) {
    // Assets are in assets/the-watch/
    filePath = path.join(process.cwd(), urlPath);
  } else {
    // For everything else, try from root
    filePath = path.join(process.cwd(), urlPath);
  }

  console.log(`📂 Looking for: ${filePath}`);

  // Security check
  if (!filePath.startsWith(process.cwd())) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stat) => {
    if (!err && stat.isFile()) {
      sendFile(res, filePath);
      return;
    }

    // SPA fallback: serve index.html for any unknown path
    console.log(`🔄 Fallback to index.html for: ${urlPath}`);
    const indexFile = path.join(process.cwd(), 'index.html');
    sendFile(res, indexFile, 200);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`🚀 Server running at http://${HOST}:${PORT}`);
  console.log(`📁 Root directory: ${process.cwd()}`);
  
  // Debug: List files to help troubleshoot
  try {
    const files = fs.readdirSync(process.cwd());
    console.log(`📄 Files in root:`, files.filter(f => !f.startsWith('.')));
    
    // Check if index.html exists
    if (fs.existsSync(path.join(process.cwd(), 'index.html'))) {
      console.log('✅ index.html found!');
    } else {
      console.log('❌ index.html NOT found!');
    }
    
    // Check assets directory
    if (fs.existsSync(path.join(process.cwd(), 'assets'))) {
      console.log('✅ assets directory found!');
      const assets = fs.readdirSync(path.join(process.cwd(), 'assets'));
      console.log(`📄 assets/:`, assets);
    } else {
      console.log('❌ assets directory NOT found!');
    }
  } catch (err) {
    console.log('⚠️ Error listing files:', err.message);
  }
});