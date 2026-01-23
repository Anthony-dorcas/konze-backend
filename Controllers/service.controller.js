import asyncHandler from 'express-async-handler';
import Service, { ServiceCategory } from '../models/Service.model.js';
import cloudinaryService from '../config/cloudinary.js';

export const createService = asyncHandler(async (req, res) => {
  const { title, description, category, price, currency = 'NGN', duration, features } = req.body;

  // Parse features if it's a string
  const featuresArray = Array.isArray(features) 
    ? features 
    : typeof features === 'string' 
      ? features.split(',').map(f => f.trim())
      : [];

  // Create service
  const service = await Service.create({
    title,
    description,
    category,
    price: parseFloat(price),
    currency,
    duration,
    features: featuresArray,
  });

  res.status(201).json({
    success: true,
    message: 'Service created successfully',
    service,
  });
});

export const getServices = asyncHandler(async (req, res) => {
  const { category, search } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const filter = { isActive: true };

  if (category) {
    filter.category = category;
  }

  if (search) {
    filter.$text = { $search: search };
  }

  const services = await Service.find(filter)
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const total = await Service.countDocuments(filter);

  res.status(200).json({
    success: true,
    count: services.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    services,
  });
});

export const getServiceById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const service = await Service.findById(id);

  if (!service) {
    res.status(404);
    throw new Error('Service not found');
  }

  res.status(200).json({
    success: true,
    service,
  });
});

export const updateService = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const service = await Service.findByIdAndUpdate(
    id,
    updates,
    { new: true, runValidators: true }
  );

  if (!service) {
    res.status(404);
    throw new Error('Service not found');
  }

  res.status(200).json({
    success: true,
    message: 'Service updated successfully',
    service,
  });
});

export const deleteService = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const service = await Service.findByIdAndUpdate(
    id,
    { isActive: false },
    { new: true }
  );

  if (!service) {
    res.status(404);
    throw new Error('Service not found');
  }

  res.status(200).json({
    success: true,
    message: 'Service deleted successfully',
  });
});

export const uploadServiceImages = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  if (!req.files || !req.files.images) {
    res.status(400);
    throw new Error('Please upload images');
  }

  const service = await Service.findById(id);

  if (!service) {
    res.status(404);
    throw new Error('Service not found');
  }

  const files = Array.isArray(req.files.images) ? req.files.images : [req.files.images];
  const uploadedImages = [];

  // Upload each image to Cloudinary
  for (const file of files) {
    const result = await cloudinaryService.uploadBuffer(
      file.buffer,
      'konze/services'
    );

    uploadedImages.push({
      url: result.url,
      publicId: result.public_id,
      caption: file.originalname,
    });
  }

  // Add images to service
  service.images.push(...uploadedImages);
  await service.save();

  res.status(200).json({
    success: true,
    message: 'Images uploaded successfully',
    images: uploadedImages,
  });
});

export const getServiceCategories = asyncHandler(async (req, res) => {
  const categories = Object.values(ServiceCategory).map(category => ({
    value: category,
    label: category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
  }));

  // Get count for each category
  const categoryStats = await Service.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
      },
    },
  ]);

  res.status(200).json({
    success: true,
    categories: categories.map(cat => ({
      ...cat,
      count: categoryStats.find(stat => stat._id === cat.value)?.count || 0,
    })),
  });
});

export const deleteServiceImage = asyncHandler(async (req, res) => {
  const { id, imageId } = req.params;

  const service = await Service.findById(id);

  if (!service) {
    res.status(404);
    throw new Error('Service not found');
  }

  // Find and remove image
  const image = service.images.id(imageId);
  if (!image) {
    res.status(404);
    throw new Error('Image not found');
  }

  // Delete from Cloudinary
  await cloudinaryService.deleteFile(image.publicId);

  // Remove from array
  service.images.pull(imageId);
  await service.save();

  res.status(200).json({
    success: true,
    message: 'Image deleted successfully',
  });
});