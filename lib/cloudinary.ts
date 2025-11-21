// Cloudinary Integration for File Storage
// Upload images and videos to Cloudinary and get shareable links

import { v2 as cloudinary } from 'cloudinary';

// Initialize Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function validateCloudinaryConfig() {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    throw new Error('Cloudinary credentials not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in .env');
  }
}

// Upload file to Cloudinary
export async function uploadToCloudinary(
  file: Buffer,
  fileName: string,
  mimeType: string,
  folder: string = 'lnc-admin'
): Promise<{
  publicId: string;
  fileName: string;
  url: string;
  secureUrl: string;
  thumbnailUrl?: string;
  resourceType: string;
}> {
  try {
    validateCloudinaryConfig();

    // Convert buffer to base64 data URI
    const base64File = `data:${mimeType};base64,${file.toString('base64')}`;

    // Determine resource type
    const resourceType = isVideoFile(mimeType) ? 'video' : 'image';

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(base64File, {
      folder,
      resource_type: resourceType,
      public_id: fileName.replace(/\.[^/.]+$/, ''), // Remove extension
      overwrite: false,
      use_filename: true,
    });

    // Generate thumbnail for videos
    let thumbnailUrl;
    if (resourceType === 'video') {
      thumbnailUrl = cloudinary.url(result.public_id, {
        resource_type: 'video',
        format: 'jpg',
        transformation: [
          { width: 400, height: 300, crop: 'fill' },
        ],
      });
    } else {
      thumbnailUrl = cloudinary.url(result.public_id, {
        resource_type: 'image',
        transformation: [
          { width: 400, height: 300, crop: 'fill' },
        ],
      });
    }

    return {
      publicId: result.public_id,
      fileName: result.original_filename || fileName,
      url: result.url,
      secureUrl: result.secure_url,
      thumbnailUrl,
      resourceType: result.resource_type,
    };
  } catch (error: any) {
    console.error('Cloudinary upload error:', error);
    throw new Error(`Failed to upload to Cloudinary: ${error.message}`);
  }
}

// Get file from Cloudinary
export async function getCloudinaryFile(publicId: string): Promise<any> {
  try {
    validateCloudinaryConfig();
    const result = await cloudinary.api.resource(publicId);
    return result;
  } catch (error: any) {
    console.error('Cloudinary fetch error:', error);
    throw new Error(`Failed to fetch from Cloudinary: ${error.message}`);
  }
}

// Delete file from Cloudinary
export async function deleteCloudinaryFile(publicId: string, resourceType: string = 'image'): Promise<void> {
  try {
    validateCloudinaryConfig();
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (error: any) {
    console.error('Cloudinary delete error:', error);
    throw new Error(`Failed to delete from Cloudinary: ${error.message}`);
  }
}

// Helper functions
export function isImageFile(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

export function isVideoFile(mimeType: string): boolean {
  return mimeType.startsWith('video/');
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
