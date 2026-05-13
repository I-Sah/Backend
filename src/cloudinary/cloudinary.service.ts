import { Injectable } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import { ConfigService } from '@nestjs/config';
import { extname } from 'path';
import { Express } from 'express'; // Assurez-vous d'importer Multer.File

@Injectable()
export class CloudinaryService {
    constructor(private configService: ConfigService) {
        cloudinary.config({
            cloud_name: this.configService.get('CLOUDINARY_CLOUD_NAME'),
            api_key: this.configService.get('CLOUDINARY_API_KEY'),
            api_secret: this.configService.get('CLOUDINARY_API_SECRET'),
        });
    }

    // IMAGES UNIQUEMENT
    async uploadImage(file: Express.Multer.File): Promise<UploadApiResponse> {
        return new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                {
                    folder: 'uploads/images',
                    resource_type: 'image',
                    use_filename: true,
                    unique_filename: true,
                },
                (error, result) => {
                    if (error) return reject(error);
                    if (!result) return reject(new Error('Cloudinary upload failed'));
                    resolve(result);
                },
            ).end(file.buffer);
        });
    }

    //  PDF / EXCEL / ZIP / DOC
    async uploadFile(file: Express.Multer.File): Promise<UploadApiResponse> {
        const extension = extname(file.originalname);
        const nameOnly = file.originalname.replace(extension, '');
        const safeName = nameOnly
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, '-')
            .replace(/[^\w.-]/g, '');

        return new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                {
                    folder: 'uploads/files',
                    resource_type: 'raw',
                    public_id: `${safeName}-${Date.now()}${extension}`,
                },
                (error, result) => {
                    if (error) {
                        console.error('Cloudinary Upload Error:', error);
                        return reject(error);
                    }
                    console.log('Cloudinary Upload Result:', result);
                    if (!result) return reject(new Error('Cloudinary upload failed'));
                    resolve(result);
                },
            ).end(file.buffer);
        });
    }

    async deleteFile(publicId: string): Promise<any> {
        return new Promise((resolve, reject) => {
            cloudinary.uploader.destroy(publicId, (error, result) => {
                if (error) return reject(error);
                resolve(result);
            });
        });
    }
}
