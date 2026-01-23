import asyncHandler from 'express-async-handler';
import Contact from '../models/Contact.model.js';
import emailService from '../services/email.service.js';
import cloudinaryService from '../config/cloudinary.js';

export const sendContactMessage = asyncHandler(async (req, res) => {
  const { name, email, phone, subject, message } = req.body;

  // Get IP and user agent
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];

  let attachments = [];

  // Handle file uploads if any
  if (req.files && req.files.attachments) {
    const files = req.files.attachments;
    
    for (const file of files) {
      const result = await cloudinaryService.uploadBuffer(
        file.buffer,
        'konze/contacts',
        file.mimetype.startsWith('image/') ? 'image' : 'raw'
      );

      attachments.push({
        url: result.url,
        publicId: result.public_id,
        name: file.originalname,
        type: file.mimetype,
        size: file.size,
      });
    }
  }

  // Save contact message
  const contact = await Contact.create({
    name,
    email,
    phone,
    subject,
    message,
    ipAddress,
    userAgent,
    attachments,
  });

  // Send confirmation email
  await emailService.sendContactConfirmation(email, name, subject);

  res.status(201).json({
    success: true,
    message: 'Message sent successfully. We will get back to you soon.',
    contactId: contact._id,
  });
});

export const getContactMessages = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const page = parseInt(String(req.query.page || '1'), 10);
  const limit = parseInt(String(req.query.limit || '20'), 10);
  const skip = (page - 1) * limit;

  const filter = {};
  if (status) {
    filter.status = status;
  }

  const contacts = await Contact.find(filter)
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const total = await Contact.countDocuments(filter);

  res.status(200).json({
    success: true,
    count: contacts.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    contacts,
  });
});

export const getContactMessageById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const contact = await Contact.findById(id);

  if (!contact) {
    res.status(404);
    throw new Error('Contact message not found');
  }

  // Mark as read if status is new
  if (contact.status === 'new') {
    contact.status = 'read';
    await contact.save();
  }

  res.status(200).json({
    success: true,
    contact,
  });
});

export const updateContactStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['new', 'read', 'replied', 'archived'].includes(status)) {
    res.status(400);
    throw new Error('Invalid status');
  }

  const contact = await Contact.findByIdAndUpdate(
    id,
    { status },
    { new: true }
  );

  if (!contact) {
    res.status(404);
    throw new Error('Contact message not found');
  }

  res.status(200).json({
    success: true,
    message: 'Status updated successfully',
    contact,
  });
});

export const deleteContactMessage = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const contact = await Contact.findById(id);

  if (!contact) {
    res.status(404);
    throw new Error('Contact message not found');
  }

  // Delete attachments from Cloudinary
  if (contact.attachments && contact.attachments.length > 0) {
    for (const attachment of contact.attachments) {
      try {
        await cloudinaryService.deleteFile(
          attachment.publicId,
          attachment.type.startsWith('image/') ? 'image' : 'raw'
        );
      } catch (error) {
        console.error('Failed to delete attachment:', error);
      }
    }
  }

  await contact.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Contact message deleted successfully',
  });
});

export const getContactStats = asyncHandler(async (req, res) => {
  const stats = await Contact.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  const total = await Contact.countDocuments();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayCount = await Contact.countDocuments({
    createdAt: { $gte: today },
  });

  const thisWeek = new Date();
  thisWeek.setDate(thisWeek.getDate() - 7);
  
  const thisWeekCount = await Contact.countDocuments({
    createdAt: { $gte: thisWeek },
  });

  res.status(200).json({
    success: true,
    stats: {
      total,
      today: todayCount,
      thisWeek: thisWeekCount,
      byStatus: stats,
    },
  });
});