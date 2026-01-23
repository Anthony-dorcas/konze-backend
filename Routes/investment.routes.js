import express from 'express';
import {
  createInvestment,
  getInvestments,
  getInvestmentById,
  updateInvestment,
  uploadInvestmentDocuments,
  getInvestmentStats,
  deleteInvestmentDocument,
} from '../Controllers/investment.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { uploadFiles } from '../middleware/upload.middleware.js';
import { validateInvestment, handleValidationErrors } from '../utils/validation.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

router.post(
  '/',
  validateInvestment,
  handleValidationErrors,
  createInvestment
);

router.get('/', getInvestments);
router.get('/stats', getInvestmentStats);
router.get('/:id', getInvestmentById);
router.put('/:id', updateInvestment);
router.post(
  '/:id/documents',
  uploadFiles,
  uploadInvestmentDocuments
);
router.delete('/:id/documents/:docId', deleteInvestmentDocument);

export default router;