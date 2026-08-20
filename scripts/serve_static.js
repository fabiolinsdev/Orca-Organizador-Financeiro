const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', 'static_orca');
const PORT = process.env.PORT || 3000;

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

function sendError(res, code=500) {
  res.writeHead(code, {'Content-Type':'text/plain'});
  res.end(code === 404 ? 'Not found' : 'Server error');
}

const server = http.createServer((req, res) => {
  try {
    let urlPath = decodeURIComponent(req.url.split('?')[0]);
    if (urlPath === '/' || urlPath === '') urlPath = '/index.html';
    const filePath = path.join(ROOT, urlPath);

    if (!filePath.startsWith(ROOT)) return sendError(res, 404);

    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) return sendError(res, 404);
      const ext = path.extname(filePath).toLowerCase();
      const type = mime[ext] || 'application/octet-stream';
      res.writeHead(200, {'Content-Type': type});
      const stream = fs.createReadStream(filePath);
      stream.pipe(res);
      stream.on('error', () => sendError(res, 500));
    });
  } catch (e) {
    sendError(res, 500);
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`static server listening on http://0.0.0.0:${PORT}`);
});
