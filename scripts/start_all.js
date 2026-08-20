const { spawn, exec } = require('child_process');
const path = require('path');

function spawnCommand(cmd, args, opts = {}) {
  const p = spawn(cmd, args, Object.assign({ stdio: 'inherit', shell: false }, opts));
  p.on('error', (err) => console.error(`Failed to start ${cmd}:`, err && err.message));
  return p;
}

const net = require('net');

function portIsListening(port, host = '127.0.0.1', timeout = 500) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let resolved = false;
    socket.setTimeout(timeout);
    socket.once('connect', () => { resolved = true; socket.destroy(); resolve(true); });
    socket.once('timeout', () => { if (!resolved) { resolved = true; socket.destroy(); resolve(false); } });
    socket.once('error', () => { if (!resolved) { resolved = true; socket.destroy(); resolve(false); } });
    socket.connect(port, host);
  });
}

let apiProcess = null;
let staticProcess = null;

(async () => {
  // Start API if not running (port check avoids EADDRINUSE)
  const apiUp = await portIsListening(3333);
  if (apiUp) {
    console.log('API already running at http://localhost:3333 — skipping start');
  } else {
    console.log('Starting API...');
    apiProcess = spawnCommand('npm', ['run', 'start', '--workspace=@orca/api']);
  }

  // Start static server if not running
  const staticUp = await portIsListening(3000);
  if (staticUp) {
    console.log('Static server already running at http://localhost:3000 — skipping start');
  } else {
    console.log('Starting static server...');
    staticProcess = spawnCommand('node', [path.join(__dirname, 'serve_static.js')]);
  }

  // After short delay, try to open browser and import Insomnia
  setTimeout(() => {
    console.log('Opening browser at http://localhost:3000');
    exec('xdg-open http://localhost:3000 || true', (err) => { if (err) console.log('xdg-open failed or not available'); });
    exec('command -v insomnia || command -v insomnia-app || command -v insomnia-core', (err, stdout) => {
      const bin = stdout && stdout.toString().trim();
      if (bin) {
        console.log('Found Insomnia at', bin, '- attempting to import insomnia.json');
        exec(`${bin} import insomnia.json || true`, (e) => { if (e) console.log('Insomnia import failed (non-fatal)'); });
      } else {
        console.log('Insomnia not found; skipping import');
      }
    });
  }, 1000);
})();

// After short delay, try to open browser
setTimeout(() => {
  console.log('Opening browser at http://localhost:3000');
  exec('xdg-open http://localhost:3000 || true', (err) => {
    if (err) console.log('xdg-open failed or not available');
  });

  // Try to import Insomnia collection if insomnia is available
  exec('command -v insomnia || command -v insomnia-app || command -v insomnia-core', (err, stdout) => {
    const bin = stdout && stdout.toString().trim();
    if (bin) {
      console.log('Found Insomnia at', bin, '- attempting to import insomnia.json');
      exec(`${bin} import insomnia.json || true`, (e) => { if (e) console.log('Insomnia import failed (non-fatal)'); });
    } else {
      console.log('Insomnia not found; skipping import');
    }
  });
}, 1000);

// On exit, kill spawned children
function shutdown() {
  try { api.kill(); } catch (e) {}
  try { staticServer.kill(); } catch (e) {}
  process.exit();
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
