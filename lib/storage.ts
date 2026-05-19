import crypto from 'crypto';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { logger } from './logger';

export interface NormalizedAttachmentMetadata {
  fileName: string;
  fileSize: number;
  mimeType: string;
  storageProvider: 's3' | 'local';
  key: string;
  fileUrl: string;
}

export class CloudStorageEngine {
  private static getS3Config() {
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    const bucketName = process.env.S3_BUCKET_NAME;
    const region = process.env.S3_REGION || 'us-east-1';
    const endpoint = process.env.S3_ENDPOINT; // For R2, Minio, etc.

    if (accessKeyId && secretAccessKey && bucketName) {
      return { accessKeyId, secretAccessKey, bucketName, region, endpoint };
    }
    return null;
  }

  /**
   * Generates a secure, tenant-isolated upload destination.
   * If S3 credentials are set, compiles a real presigned PUT signature.
   * Otherwise, maps it to a high-fidelity local endpoint upload route.
   */
  public static async getPresignedUploadUrl(
    companyId: string,
    userId: string,
    fileName: string,
    mimeType: string
  ): Promise<{ uploadUrl: string; fileUrl: string; token: string; key: string }> {
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const timestamp = Date.now();
    const key = `company_${companyId}/user_${userId}/${timestamp}_${cleanFileName}`;

    const s3Config = this.getS3Config();

    const payload = JSON.stringify({
      companyId,
      userId,
      key,
      expiresAt: Date.now() + 60 * 60 * 1000,
    });
    const secret = process.env.NEXTAUTH_SECRET || 'secret-key';
    const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    const verificationToken = Buffer.from(`${payload}.${signature}`).toString('base64');

    let uploadUrl = '';
    let fileUrl = '';

    if (s3Config) {
      logger.info(`[Storage Presign] Provisioning AWS S3 URL: ${s3Config.bucketName}`, {
        companyId,
        userId,
      });
      const client = new S3Client({
        region: s3Config.region,
        credentials: {
          accessKeyId: s3Config.accessKeyId,
          secretAccessKey: s3Config.secretAccessKey,
        },
        endpoint: s3Config.endpoint,
        forcePathStyle: !!s3Config.endpoint,
      });

      const command = new PutObjectCommand({
        Bucket: s3Config.bucketName,
        Key: key,
        ContentType: mimeType,
      });

      uploadUrl = await getSignedUrl(client, command, { expiresIn: 3600 });
      fileUrl = s3Config.endpoint
        ? `${s3Config.endpoint}/${s3Config.bucketName}/${key}`
        : `https://${s3Config.bucketName}.s3.${s3Config.region}.amazonaws.com/${key}`;
    } else {
      logger.info(`[Storage Presign] Local fallback activated.`, { companyId, userId });
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      uploadUrl = `${baseUrl}/api/storage/local?token=${encodeURIComponent(verificationToken)}`;
      fileUrl = `/uploads/${key}`;
    }

    return {
      uploadUrl,
      fileUrl,
      key,
      token: verificationToken,
    };
  }

  public static normalizeMetadata(
    fileName: string,
    fileSize: number,
    mimeType: string,
    key: string,
    fileUrl: string
  ): NormalizedAttachmentMetadata {
    const s3Config = this.getS3Config();
    return {
      fileName,
      fileSize,
      mimeType,
      storageProvider: s3Config ? 's3' : 'local',
      key,
      fileUrl,
    };
  }
}
