import mongoose, { Schema, Document } from 'mongoose';

/**
 * @typedef {Object} Attachment
 * @property {string} url
 * @property {string} publicId
 * @property {string} name
 * @property {string} type
 * @property {number} size
 */

/**
 * @typedef {Object} IContact
 * @property {string} name
 * @property {string} email
 * @property {string} [phone]
 * @property {string} subject
 * @property {string} message
 * @property {'new'|'read'|'replied'|'archived'} status
 * @property {string} [ipAddress]
 * @property {string} [userAgent]
 * @property {Attachment[]} [attachments]
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */

const ContactSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    phone: String,
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['new', 'read', 'replied', 'archived'],
      default: 'new',
    },
    ipAddress: String,
    userAgent: String,
    attachments: [{
      url: String,
      publicId: String,
      name: String,
      type: String,
      size: Number,
    }],
  },
  {
    timestamps: true,
  }
);

// Indexes
ContactSchema.index({ email: 1 });
ContactSchema.index({ status: 1 });
ContactSchema.index({ createdAt: -1 });

export default mongoose.model('Contact', ContactSchema);