import express from 'express';
import {
  sendContactMessage,
  getContactMessages,
  getContactMessageById,
  updateContactStatus,
  deleteContactMessage,
  getContactStats,
} from '../Controllers/contact.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { uploadFiles } from '../middleware/upload.middleware.js';
import { validateContact, handleValidationErrors } from '../utils/validation.js';

const router = express.Router();

// Public route for sending contact messages
router.post(
  '/',
  uploadFiles,
  validateContact,
  handleValidationErrors,
  sendContactMessage
);

// Protected routes (admin only)
router.use(protect);
// router.use(authorize('admin'));

router.get('/', getContactMessages);
router.get('/stats', getContactStats);
router.get('/:id', getContactMessageById);
router.put('/:id/status', updateContactStatus);
router.delete('/:id', deleteContactMessage);

export default router;