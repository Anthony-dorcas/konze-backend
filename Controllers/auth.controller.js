import asyncHandler from 'express-async-handler';
import User from '../models/User.model.js';
import { generateToken } from '../middleware/auth.middleware.js';
import emailService from '../services/email.service.js';

export const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password, referralCode } = req.body;

  // Check if user exists
  const existingUser = await User.findOne({ 
    $or: [{ email }, { phone }] 
  });

  if (existingUser) {
    res.status(400);
    throw new Error('User already exists with this email or phone');
  }

  // Check referral code if provided
  let referredBy = null;
  if (referralCode) {
    const referrer = await User.findOne({ referralCode });
    if (!referrer) {
      res.status(400);
      throw new Error('Invalid referral code');
    }
    referredBy = referrer._id;
  }

  // Create user
  const user = await User.create({
    name,
    email,
    phone,
    password,
    referredBy,
  });

  // Generate verification code
  const verificationCode = user.generateVerificationCode();
  await user.save();

  // Send verification email
  await emailService.sendVerificationEmail(email, verificationCode, name);

  // Generate token
  const token = generateToken(user._id);

  // Set cookie
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.status(201).json({
    success: true,
    message: 'Registration successful. Please check your email for verification code.',
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      isVerified: user.isVerified,
      referralCode: user.referralCode,
    },
  });
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const { code } = req.body;

  const user = await User.findOne({
    verificationCode: code,
    verificationCodeExpires: { $gt: Date.now() },
  });

  if (!user) {
    res.status(400);
    throw new Error('Invalid or expired verification code');
  }

  user.isVerified = true;
  user.verificationCode = undefined;
  user.verificationCodeExpires = undefined;
  await user.save();

  // Send welcome email
  await emailService.sendWelcomeEmail(user.email, user.name);

  // Generate token
  const token = generateToken(user._id);

  // Set cookie
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.status(200).json({
    success: true,
    message: 'Email verified successfully',
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      isVerified: user.isVerified,
    },
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    res.status(401);
    throw new Error('Invalid credentials');
  }

  // Check password
  const isPasswordMatch = await user.comparePassword(password);
  if (!isPasswordMatch) {
    res.status(401);
    throw new Error('Invalid credentials');
  }

  // Check if verified
  if (!user.isVerified) {
    res.status(403);
    throw new Error('Please verify your email address');
  }

  // Generate token
  const token = generateToken(user._id);

  // Set cookie
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.status(200).json({
    success: true,
    message: 'Login successful',
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      isVerified: user.isVerified,
      referralCode: user.referralCode,
    },
  });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Generate reset code
  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  user.resetPasswordToken = resetCode;
  user.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  await user.save();

  // Send reset email
  await emailService.sendPasswordResetEmail(email, resetCode, user.name);

  res.status(200).json({
    success: true,
    message: 'Password reset code sent to your email',
  });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { code, password } = req.body;

  const user = await User.findOne({
    resetPasswordToken: code,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    res.status(400);
    throw new Error('Invalid or expired reset code');
  }

  // Update password
  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password reset successful',
  });
});

export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id)
    .populate('investments')
    .select('-password');

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  res.status(200).json({
    success: true,
    user,
  });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone } = req.body;
  const user = req.user;

  const updatedUser = await User.findByIdAndUpdate(
    user.id,
    { name, phone },
    { new: true, runValidators: true }
  ).select('-password');

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    user: updatedUser,
  });
});

export const updateProfileImage = asyncHandler(async (req, res) => {
  const user = req.user;
  
  if (!req.file) {
    res.status(400);
    throw new Error('Please upload an image');
  }

  // Upload to Cloudinary
  const cloudinary = (await import('../config/cloudinary')).default;
  const result = await cloudinary.uploadBuffer(req.file.buffer, 'konze/profile');

  // Update user profile image
  const updatedUser = await User.findByIdAndUpdate(
    user.id,
    { profileImage: result.url },
    { new: true }
  ).select('-password');

  res.status(200).json({
    success: true,
    message: 'Profile image updated successfully',
    imageUrl: result.url,
    user: updatedUser,
  });
});

export const logout = asyncHandler(async (req, res) => {
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0),
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});