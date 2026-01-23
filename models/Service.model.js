import mongoose, { Schema } from 'mongoose';

export const ServiceCategory = {
  PHOTOCOPY: 'photocopy',
  COMPUTER_TRAINING: 'computer_training',
  PROJECT_MANAGEMENT: 'project_management',
  DIGITAL_MARKETING: 'digital_marketing',
  WEB_DEVELOPMENT: 'web_development',
  SOCIAL_MEDIA: 'social_media',
  MARKETING: 'marketing',
  VIDEO_EDITING: 'video_editing',
  VIDEO_COVERAGE: 'video_coverage',
  OTHER: 'other',
};

const ServiceSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: Object.values(ServiceCategory),
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: [0, 'Price must be positive'],
    },
    currency: {
      type: String,
      enum: ['NGN', 'USD'],
      default: 'NGN',
    },
    duration: String,
    features: [String],
    images: [{
      url: String,
      publicId: String,
      caption: String,
    }],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
ServiceSchema.index({ category: 1, isActive: 1 });
ServiceSchema.index({ title: 'text', description: 'text' });
ServiceSchema.index({ isActive: 1 });
ServiceSchema.index({ createdAt: -1 });

export default mongoose.model('Service', ServiceSchema);