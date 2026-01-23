import express from 'express';
import {
  createService,
  getServices,
  getServiceById,
  updateService,
  deleteService,
  uploadServiceImages,
  getServiceCategories,
  deleteServiceImage,
} from '../Controllers/service.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { uploadFiles } from '../middleware/upload.middleware.js';
import { validateService, handleValidationErrors } from '../utils/validation.js';

const router = express.Router();

// Public routes
router.get('/', getServices);
router.get('/categories', getServiceCategories);
router.get('/:id', getServiceById);

// Protected routes (admin only)
router.use(protect);
// router.use(authorize('admin'));

router.post(
  '/',
  validateService,
  handleValidationErrors,
  createService
);

router.put('/:id', updateService);
router.delete('/:id', deleteService);
router.post(
  '/:id/images',
  uploadFiles,
  uploadServiceImages
);
router.delete('/:id/images/:imageId', deleteServiceImage);

export default router;