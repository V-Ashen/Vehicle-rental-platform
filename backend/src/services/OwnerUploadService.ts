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

      // Construct the standard Firebase Storage public URL format (relies on Firebase Security Rules)
      const encodedFilePath = encodeURIComponent(filePath);
      const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedFilePath}?alt=media`;

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
