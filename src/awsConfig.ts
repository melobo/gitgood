import dotenv from 'dotenv';
dotenv.config();

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { S3Client } from '@aws-sdk/client-s3';

export const dynamoDB = new DynamoDBClient({});
export const s3Client = new S3Client({});

export const DYNAMO_TABLE = process.env.DYNAMO_TABLE!;
export const S3_BUCKET = process.env.S3_BUCKET!;
