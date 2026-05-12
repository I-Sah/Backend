import { Injectable } from '@nestjs/common';
import cloudinary from '../config/cloudinary.config';
import { Request } from 'express';
import { Multer } from 'multer';

@Injectable()
export class CloudinaryService {
  async uploadFile(file: Express.Multer.File): Promise<string> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: 'filesUpload' },
        (error, result) => {
          if (error) return reject(error);
          if (!result?.secure_url) return reject(new Error('Upload failed: no URL returned'));
          resolve(result.secure_url);
        },
      ).end(file.buffer);
    });
  }

  async deleteFile(publicId: string) {
    return cloudinary.uploader.destroy(publicId);
  }
}