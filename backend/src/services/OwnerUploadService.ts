import { storage } from '../config/firebase';
import { AppError } from '../utils/AppError';

export class OwnerUploadService {
  async generateSignedUrl(tenantId: string, fileName: string, contentType: string, fileCategory: string) {
    try {
      // Enforce strict path isolating tenants
      const filePath = `tenants/${tenantId}/${fileCategory}/${Date.now()}_${fileName}`;
      const bucket = storage.bucket();
      const file = bucket.file(filePath);

      // Generate a V4 signed write URL, valid for 15 minutes
      const [signedUrl] = await file.getSignedUrl({
        version: 'v4',
        action: 'write',
        expires: Date.now() + 15 * 60 * 1000, // 15 mins
        contentType
      });

      // Google Cloud Storage public URL format (assuming bucket is public readable, or you get via token)
      // Since it's Firebase storage, the standard public URL without a download token might require bucket rules
      // For simplicity in this spec, we return the path so they can query it later or standard GCS url
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

      return {
        signedUrl,
        publicUrl,
        filePath
      };
    } catch (e: any) {
      throw new AppError(`Failed to generate signed URL: ${e.message}`, 'INTERNAL_SERVER_ERROR', 500);
    }
  }
}
