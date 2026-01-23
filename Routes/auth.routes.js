import express from 'express';
import {
  register,
  login,
  logout,
  getProfile,
  updateProfile,
  updateProfileImage,
  verifyEmail,
  forgotPassword,
  resetPassword,
} from '../Controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { uploadSingle } from '../middleware/upload.middleware.js';
import {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
  handleValidationErrors,
} from '../utils/validation.js';

const router = express.Router();

router.post(
  '/register',
  // validateRegister,
  // handleValidationErrors,
  register
);

router.post(
  '/login',
  validateLogin,
  handleValidationErrors,
  login
);

router.post(
  '/verify-email',
  validateResetPassword,
  handleValidationErrors,
  verifyEmail
);

router.post(
  '/forgot-password',
  validateForgotPassword,
  handleValidationErrors,
  forgotPassword
);

router.post(
  '/reset-password',
  validateResetPassword,
  handleValidationErrors,
  resetPassword
);

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.post(
  '/profile/image',
  protect,
  uploadSingle('profileImage'),
  updateProfileImage
);
router.post('/logout', protect, logout);

export default router;