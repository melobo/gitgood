const apiKey = process.env.API_KEY;
if (!apiKey) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('API_KEY environment variable is not set.');
  } else {
    console.warn('WARNING: API_KEY is not set. Authentication will reject all requests until it is configured in .env.');
  }
}

export default {
  ip: process.env.IP ?? '0.0.0.0', // must be 0.0.0.0 on Render, not 127.0.0.1
  port: parseInt(process.env.PORT ?? '3000'),
  debug: process.env.NODE_ENV !== 'production',
  showDocs: true,
  apiKey: apiKey ?? '',
};