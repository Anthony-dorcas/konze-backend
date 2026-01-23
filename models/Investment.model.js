import mongoose from 'mongoose';

const { Schema } = mongoose;

// Investment types
export const InvestmentType = {
  REAL_ESTATE: 'real_estate',
  EUROBONDS: 'eurobonds',
  AGRI_TECH: 'agri_tech',
  US_STOCKS: 'us_stocks',
  SAVINGS: 'savings',
  EDUCATION: 'education',
};

// Investment statuses
export const InvestmentStatus = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  PENDING: 'pending',
  CANCELLED: 'cancelled',
};

const InvestmentSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(InvestmentType),
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [0, 'Amount must be positive'],
    },
    currency: {
      type: String,
      enum: ['NGN', 'USD'],
      default: 'NGN',
    },
    status: {
      type: String,
      enum: Object.values(InvestmentStatus),
      default: InvestmentStatus.PENDING,
    },
    expectedReturn: {
      type: Number,
      required: true,
    },
    actualReturn: {
      type: Number,
      default: 0,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: true,
    },
    documents: [
      {
        url: String,
        publicId: String,
        name: String,
        type: String,
        size: Number,
      },
    ],
    transactionId: {
      type: String,
      required: true,
      unique: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for remaining days
InvestmentSchema.virtual('remainingDays').get(function () {
  const now = new Date();
  const end = new Date(this.endDate);
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
});

// Virtual for progress percentage
InvestmentSchema.virtual('progress').get(function () {
  const start = new Date(this.startDate).getTime();
  const end = new Date(this.endDate).getTime();
  const now = Date.now();

  if (now >= end) return 100;
  if (now <= start) return 0;

  const total = end - start;
  const elapsed = now - start;
  return Math.min(100, Math.round((elapsed / total) * 100));
});

// Indexes
InvestmentSchema.index({ user: 1, status: 1 });
InvestmentSchema.index({ type: 1, status: 1 });
InvestmentSchema.index({ transactionId: 1 }, { unique: true });
InvestmentSchema.index({ endDate: 1 });
InvestmentSchema.index({ createdAt: -1 });

export default mongoose.model('Investment', InvestmentSchema);