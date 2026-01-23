import asyncHandler from 'express-async-handler';
import Investment, { InvestmentType, InvestmentStatus } from '../models/Investment.model.js';
import { v4 as uuidv4 } from 'uuid';
import cloudinaryService from '../config/cloudinary.js';

export const createInvestment = asyncHandler(async (req, res) => {
  const { type, amount, currency = 'NGN', duration } = req.body;
  const userId = req.user.id;

  // Validate investment type
  if (!Object.values(InvestmentType).includes(type)) {
    res.status(400);
    throw new Error('Invalid investment type');
  }

  // Calculate end date based on duration (in months)
  const startDate = new Date();
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + parseInt(duration || '12'));

  // Calculate expected return based on type
  let expectedReturn = 0;
  switch (type) {
    case InvestmentType.REAL_ESTATE:
      expectedReturn = amount * 0.18; // 18% p.a.
      break;
    case InvestmentType.EUROBONDS:
      expectedReturn = amount * 0.085; // 8.5% p.a.
      break;
    case InvestmentType.AGRI_TECH:
      expectedReturn = amount * 0.22; // 22% p.a.
      break;
    case InvestmentType.US_STOCKS:
      expectedReturn = amount * 0.12; // 12% p.a. average
      break;
    case InvestmentType.SAVINGS:
      expectedReturn = amount * 0.15; // 15% p.a.
      break;
    case InvestmentType.EDUCATION:
      expectedReturn = amount * 0.10; // 10% p.a.
      break;
  }

  // Create transaction ID
  const transactionId = `KONZE-${uuidv4().split('-')[0].toUpperCase()}`;

  // Create investment
  const investment = await Investment.create({
    user: userId,
    type,
    amount: parseFloat(amount),
    currency,
    expectedReturn,
    startDate,
    endDate,
    transactionId,
  });

  // Update user's investments array
  const User = (await import('../models/User.model')).default;
  await User.findByIdAndUpdate(userId, {
    $push: { investments: investment._id },
  });

  res.status(201).json({
    success: true,
    message: 'Investment created successfully',
    investment,
  });
});

export const getInvestments = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { type, status } = req.query;

  const filter = { user: userId };

  if (type) {
    filter.type = type;
  }

  if (status) {
    filter.status = status;
  }

  const investments = await Investment.find(filter)
    .sort({ createdAt: -1 })
    .populate('user', 'name email');

  res.status(200).json({
    success: true,
    count: investments.length,
    investments,
  });
});

export const getInvestmentById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const investment = await Investment.findOne({
    _id: id,
    user: userId,
  }).populate('user', 'name email phone');

  if (!investment) {
    res.status(404);
    throw new Error('Investment not found');
  }

  res.status(200).json({
    success: true,
    investment,
  });
});

export const updateInvestment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const { status } = req.body;

  const investment = await Investment.findOne({
    _id: id,
    user: userId,
  });

  if (!investment) {
    res.status(404);
    throw new Error('Investment not found');
  }

  // Only allow status updates
  if (status && Object.values(InvestmentStatus).includes(status)) {
    investment.status = status;
    await investment.save();
  }

  res.status(200).json({
    success: true,
    message: 'Investment updated successfully',
    investment,
  });
});

export const uploadInvestmentDocuments = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  
  if (!req.files || !req.files.documents) {
    res.status(400);
    throw new Error('Please upload documents');
  }

  const investment = await Investment.findOne({
    _id: id,
    user: userId,
  });

  if (!investment) {
    res.status(404);
    throw new Error('Investment not found');
  }

  const files = Array.isArray(req.files.documents) ? req.files.documents : [req.files.documents];
  const uploadedDocuments = [];

  // Upload each document to Cloudinary
  for (const file of files) {
    const result = await cloudinaryService.uploadBuffer(
      file.buffer,
      'konze/investments',
      'raw'
    );

    uploadedDocuments.push({
      url: result.url,
      publicId: result.public_id,
      name: file.originalname,
      type: file.mimetype,
      size: file.size,
    });
  }

  // Add documents to investment
  investment.documents.push(...uploadedDocuments);
  await investment.save();

  res.status(200).json({
    success: true,
    message: 'Documents uploaded successfully',
    documents: uploadedDocuments,
  });
});

export const getInvestmentStats = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const stats = await Investment.aggregate([
    { $match: { user: userId } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        totalReturn: { $sum: '$actualReturn' },
      },
    },
  ]);

  const totalInvestments = await Investment.countDocuments({ user: userId });
  const totalAmount = await Investment.aggregate([
    { $match: { user: userId } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);

  const activeInvestments = await Investment.find({
    user: userId,
    status: InvestmentStatus.ACTIVE,
  });

  const totalExpectedReturn = activeInvestments.reduce(
    (sum, inv) => sum + inv.expectedReturn,
    0
  );

  res.status(200).json({
    success: true,
    stats: {
      totalInvestments,
      totalAmount: totalAmount[0]?.total || 0,
      totalExpectedReturn,
      statusBreakdown: stats,
    },
  });
});

export const deleteInvestmentDocument = asyncHandler(async (req, res) => {
  const { id, docId } = req.params;
  const userId = req.user.id;

  const investment = await Investment.findOne({
    _id: id,
    user: userId,
  });

  if (!investment) {
    res.status(404);
    throw new Error('Investment not found');
  }

  // Find and remove document
  const document = investment.documents.id(docId);
  if (!document) {
    res.status(404);
    throw new Error('Document not found');
  }

  // Delete from Cloudinary
  await cloudinaryService.deleteFile(document.publicId, 'raw');

  // Remove from array
  investment.documents.pull(docId);
  await investment.save();

  res.status(200).json({
    success: true,
    message: 'Document deleted successfully',
  });
});