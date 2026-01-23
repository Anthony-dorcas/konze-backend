import multer from 'multer';
import { config } from '../config/config.js';

// Configure multer storage
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req, file, cb) => {
  // Check file type
  const allowedImageTypes = config.fileUpload.allowedImageTypes;
  const allowedDocumentTypes = config.fileUpload.allowedDocumentTypes;
  
  const fileExt = file.originalname.split('.').pop()?.toLowerCase() || '';
  
  // Determine if it's an image or document
  if (file.mimetype.startsWith('image/')) {
    if (allowedImageTypes.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error(`Only ${allowedImageTypes.join(', ')} image formats are allowed`));
    }
  } else if (
    file.mimetype === 'application/pdf' ||
    file.mimetype === 'application/msword' ||
    file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    file.mimetype === 'text/plain' ||
    file.mimetype === 'application/rtf'
  ) {
    if (allowedDocumentTypes.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error(`Only ${allowedDocumentTypes.join(', ')} document formats are allowed`));
    }
  } else {
    cb(new Error('Invalid file type. Only images and documents are allowed'));
  }
};

// Configure multer
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

// Upload multiple files with different fields
export const uploadFiles = upload.fields([
  { name: 'images', maxCount: 5 },
  { name: 'documents', maxCount: 5 },
  { name: 'profileImage', maxCount: 1 },
]);

// Single file upload
export const uploadSingle = (fieldName) => {
  return upload.single(fieldName);
};

// Multiple files upload
export const uploadMultiple = (fieldName, maxCount = 5) => {
  return upload.array(fieldName, maxCount);
};