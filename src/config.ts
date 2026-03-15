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
  aws: {
    region: process.env.AWS_REGION ?? 'ap-southeast-2',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
    dynamoTableName: process.env.DYNAMODB_TABLE_NAME ?? 'invoices',
    s3BucketName: process.env.S3_BUCKET_NAME ?? 'invoice-files',
  },
  apiKey: apiKey ?? '',
};
