/**
 * db/s3.ts
 *
 * Initialises and exports the S3 client using credentials from config.
 * Used for storing and retrieving finalised UBL XML invoice files.
 */

import { S3Client } from '@aws-sdk/client-s3';
import config from '../config';

export const s3Client = new S3Client({
  region: config.aws.region,
  credentials: {
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey,
  },
});

export const BUCKET_NAME = config.aws.s3BucketName;