jest.spyOn(console, 'log').mockImplementation(() => {});

import dotenv from 'dotenv';
import path from 'path';
import { server } from '../server';

dotenv.config({
  path: path.resolve(__dirname, '../.env.test'),
  quiet: true,
});

afterAll(async () => {
  await new Promise<void>(resolve => server.close(() => resolve()));
});
