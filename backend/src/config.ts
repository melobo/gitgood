const getApiKey = (): string => {
  const key = process.env.API_KEY;
  if (!key) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('API_KEY is required in production.');
    }
    console.warn('WARNING: using temporary test key.');
    return 'test-key'; // safe fallback for dev/test
  }
  return key;
};

export default {
  ip: process.env.IP ?? '0.0.0.0',
  port: parseInt(process.env.PORT ?? '3000'),
  debug: process.env.NODE_ENV !== 'production',
  showDocs: process.env.SHOW_DOCS !== 'false',
  get apiKey() {
    return getApiKey();
  },
};
