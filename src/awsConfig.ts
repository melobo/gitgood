import dotenv from 'dotenv';
dotenv.config({ quiet: true });

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { S3Client } from '@aws-sdk/client-s3';

const awsConfig = {
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
};

export const dynamoDB = new DynamoDBClient(awsConfig);
export const s3Client = new S3Client(awsConfig);

export const DYNAMO_TABLE = process.env.DYNAMO_TABLE!;
export const USER_TABLE = process.env.USER_TABLE!;
export const SESSION_TABLE = process.env.SESSION_TABLE!;
export const S3_BUCKET = process.env.S3_BUCKET!;
