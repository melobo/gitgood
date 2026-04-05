export default async function globalTeardown() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const server = (global as any).__TEST_SERVER__;
  if (server) {
    server.kill();
  }
}
