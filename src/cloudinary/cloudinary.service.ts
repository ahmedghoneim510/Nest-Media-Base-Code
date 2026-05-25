import { Injectable } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import * as streamifier from 'streamifier';

@Injectable()
export class CloudinaryService {
  upload(
    file: Express.Multer.File,
    folder: string = 'uploads',
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'auto',
        },
        (error: UploadApiErrorResponse, result: UploadApiResponse) => {
          if (error) return reject(error);
          resolve(result);
        },
      );

      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }

  async delete(publicId: string): Promise<any> {
    return cloudinary.uploader.destroy(publicId);
  }

  getUrl(publicId: string, options?: object): string {
    return cloudinary.url(publicId, {
      secure: true,
      ...options,
    });
  }

  getTransformedUrl(publicId: string, width: number, height: number): string {
    return cloudinary.url(publicId, {
      secure: true,
      width,
      height,
      crop: 'fill',
      gravity: 'face',
    });
  }
}
