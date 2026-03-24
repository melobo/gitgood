import { spawn } from 'child_process';
import * as path from 'path';

export default async function globalSetup() {
  const serverPath = path.resolve(__dirname, '../server.ts');

  const server = spawn('npx', ['tsx', serverPath], {
    env: {
      ...process.env, // inherit everything
      NODE_ENV: 'test', // explicitly force test mode
      API_KEY: process.env.API_KEY ?? '',
      PORT: '3000',
      AWS_REGION: 'ap-southeast-2',
      AWS_ACCESS_KEY_ID: 'dummy',
      AWS_SECRET_ACCESS_KEY: 'dummy',
      AWS_SESSION_TOKEN: 'dummy',
      DYNAMO_TABLE: 'invoices-test',
      S3_BUCKET: 'invoices-test',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: false,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).__TEST_SERVER__ = server;

  // Log server stderr so you can see any startup errors
  server.stderr?.on('data', (data: Buffer) => {
    console.error('[server stderr]', data.toString());
  });

  // Wait until the server prints it's ready
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Server failed to start within 10s')), 10000);

    server.stdout?.on('data', (data: Buffer) => {
      const msg = data.toString();
      console.log('[server stdout]', msg);
      if (msg.includes('Server running')) {
        clearTimeout(timeout);
        resolve();
      }
    });

    server.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}
