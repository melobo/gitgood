import dotenv from 'dotenv';
dotenv.config({ path: '.env.test', quiet: true });

process.env.NODE_ENV = 'test';
process.env.API_KEY = 'test-key';
process.env.PORT = '3000';
process.env.IP = '127.0.0.1';
process.env.SERVER_URL = 'http://127.0.0.1:3000';
process.env.AWS_REGION = 'ap-southeast-2';
process.env.AWS_ACCESS_KEY_ID = 'dummy';
process.env.AWS_SECRET_ACCESS_KEY = 'dummy';
process.env.AWS_SESSION_TOKEN = 'dummy';
process.env.DYNAMO_TABLE = 'invoices-test';
process.env.USER_TABLE = 'users-test';
process.env.SESSION_TABLE = 'sessions-test';
process.env.S3_BUCKET = 'invoices-test';
