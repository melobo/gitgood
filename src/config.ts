export default {
  ip: process.env.IP ?? '0.0.0.0',       // must be 0.0.0.0 on Render, not 127.0.0.1
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
  apiKey: process.env.API_KEY ?? '',
};