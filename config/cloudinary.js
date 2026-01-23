import { v2 as cloudinary } from 'cloudinary';
import { config } from './config.js';
import streamifier from 'streamifier';

/**
 * @typedef {Object} UploadResult
 * @property {string} url
 * @property {string} public_id
 * @property {string} format
 * @property {number} bytes
 * @property {number} [width]
 * @property {number} [height]
 */

// Configure Cloudinary
cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

class CloudinaryService {
  /**
   * Upload buffer to Cloudinary
   * @param {Buffer} buffer
   * @param {string} [folder='konze']
   * @param {'image'|'raw'} [resourceType='image']
   * @returns {Promise<UploadResult>}
   */
  async uploadBuffer(buffer, folder = 'konze', resourceType = 'image') {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: resourceType,
          timeout: 60000,
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else if (result) {
            resolve({
              url: result.secure_url,
              public_id: result.public_id,
              format: result.format || '',
              bytes: result.bytes,
              width: result.width,
              height: result.height,
            });
          }
        }
      );

      streamifier.createReadStream(buffer).pipe(uploadStream);
    });
  }

  /**
   * Upload file from path
   * @param {string} filePath
   * @param {string} [folder='konze']
   * @param {'image'|'raw'} [resourceType='image']
   * @returns {Promise<UploadResult>}
   */
  async uploadFile(filePath, folder = 'konze', resourceType = 'image') {
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder,
        resource_type: resourceType,
        timeout: 60000,
      });

      return {
        url: result.secure_url,
        public_id: result.public_id,
        format: result.format || '',
        bytes: result.bytes,
        width: result.width,
        height: result.height,
      };
    } catch (error) {
      throw new Error(`Upload failed: ${error}`);
    }
  }

  /**
   * Delete file from Cloudinary
   * @param {string} publicId
   * @param {'image'|'raw'} [resourceType='image']
   * @returns {Promise<void>}
   */
  async deleteFile(publicId, resourceType = 'image') {
    try {
      await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
      });
    } catch (error) {
      throw new Error(`Delete failed: ${error}`);
    }
  }

  /**
   * Generate optimized image URL
   * @param {string} publicId
   * @param {{width?: number, height?: number, quality?: number, format?: 'webp'|'jpg'|'png'}} [options={}]
   * @returns {string}
   */
  generateOptimizedUrl(publicId, options = {}) {
    const transformations = [];
    
    if (options.width || options.height) {
      transformations.push(`c_fill,w_${options.width || 'auto'},h_${options.height || 'auto'}`);
    }
    
    if (options.quality) {
      transformations.push(`q_${options.quality}`);
    }
    
    if (options.format) {
      transformations.push(`f_${options.format}`);
    }
    
    const transformString = transformations.length > 0 
      ? transformations.join(',') + '/' 
      : '';
    
    return `https://res.cloudinary.com/${config.cloudinary.cloudName}/image/upload/${transformString}${publicId}`;
  }
}

export default new CloudinaryService();