import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand
} from '@aws-sdk/client-s3';
import { s3Client, S3_BUCKET } from './awsConfig';

const isTest = process.env.NODE_ENV === 'test';
const store = new Map<string, string>();

export async function saveXMLToS3(invoiceId: string, xmlContent: string): Promise<void> {
  if (isTest) {
    store.set(invoiceId, xmlContent);
    return;
  }

  await s3Client.send(new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: `invoices/${invoiceId}.xml`,
    Body: xmlContent,
    ContentType: 'application/xml'
  }));
}

export async function getXMLFromS3(invoiceId: string): Promise<string> {
  if (isTest) {
    return store.get(invoiceId) ?? '';
  }

  const response = await s3Client.send(new GetObjectCommand({
    Bucket: S3_BUCKET,
    Key: `invoices/${invoiceId}.xml`
  }));

  return await response.Body?.transformToString() || '';
}

export async function deleteXMLFromS3(invoiceId: string): Promise<void> {
  if (isTest) {
    store.delete(invoiceId);
    return;
  }

  await s3Client.send(new DeleteObjectCommand({
    Bucket: S3_BUCKET,
    Key: `invoices/${invoiceId}.xml`
  }));
}

export function clearStore(): void {
  store.clear();
}
