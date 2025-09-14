const { spawn } = require('child_process');
const path = require('path');

const ports = [3000, 3001, 3002, 3003];
const processes = [];

console.log('🚀 Starting Evently Backend Cluster...');

ports.forEach((port, index) => {
  const env = { ...process.env, PORT: port, INSTANCE_ID: `instance-${index}` };
  
  const child = spawn('node', ['src/app.js'], {
    env,
    stdio: 'inherit',
    cwd: __dirname
  });
  
  child.on('error', (err) => {
    console.error(`❌ Instance ${index} (port ${port}) error:`, err);
  });
  
  child.on('exit', (code) => {
    console.log(`🔴 Instance ${index} (port ${port}) exited with code ${code}`);
  });
  
  processes.push(child);
  console.log(`✅ Instance ${index} started on port ${port}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down cluster...');
  processes.forEach((child, index) => {
    console.log(`Stopping instance ${index}...`);
    child.kill('SIGTERM');
  });
  process.exit(0);
});

console.log(`\n🎉 Cluster started with ${ports.length} instances`);
console.log('Press Ctrl+C to stop all instances');
