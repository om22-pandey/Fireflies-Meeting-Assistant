import { spawn, ChildProcess } from 'child_process';
import path from 'path';

let pythonProcess: ChildProcess | null = null;
let nextProcess: ChildProcess | null = null;

function cleanup() {
  console.log('Shutting down development servers...');
  if (pythonProcess) {
    pythonProcess.kill();
  }
  if (nextProcess) {
    nextProcess.kill();
  }
  process.exit();
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);

async function startServers() {
  console.log('Booting Fireflies Meeting Assistant full-stack server...');

  // 1. Spawn Python FastAPI Backend on Port 8000
  console.log('Starting Python FastAPI Backend on http://localhost:8000 ...');
  pythonProcess = spawn('python3', ['-m', 'uvicorn', 'backend.app.main:app', '--host', '127.0.0.1', '--port', '8000'], {
    stdio: 'inherit',
    shell: true
  });

  pythonProcess.on('error', (err) => {
    console.error('Failed to start Python FastAPI process:', err);
  });

  // Give Python FastAPI a moment to bind to port 8000
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // 2. Spawn Next.js Frontend Server on Port 3000 (which proxies /api/* to 8000)
  const isProd = process.env.NODE_ENV === 'production';
  console.log(`Starting Next.js Frontend Server in ${isProd ? 'production' : 'development'} mode on http://localhost:3000 ...`);
  const frontendPath = path.join(process.cwd(), 'frontend');
  
  nextProcess = spawn('npx', ['next', isProd ? 'start' : 'dev', '-p', '3000'], {
    cwd: frontendPath,
    stdio: 'inherit',
    shell: true
  });

  nextProcess.on('error', (err) => {
    console.error('Failed to start Next.js process:', err);
  });

  nextProcess.on('close', (code) => {
    console.log(`Next.js process exited with code ${code}`);
    cleanup();
  });
}

startServers().catch((err) => {
  console.error('Failed to initialize workspace services:', err);
  cleanup();
});
