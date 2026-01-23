import mongoose from 'mongoose';
const { Schema } = mongoose;
import bcrypt from 'bcryptjs';

const UserSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    // referralCode: {
    //   type: String,
    //   unique: true,
    //   sparse: true,
    // },
    // referredBy: {
    //   type: Schema.Types.ObjectId,
    //   ref: 'User',
    // },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationCode: String,
    verificationCodeExpires: Date,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    profileImage: String,
    investments: [{
      type: Schema.Types.ObjectId,
      ref: 'Investment',
    }],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// // Generate referral code before saving
// UserSchema.pre('save', async function (next) {
//   if (!this.isNew) return next();
  
//   // Generate unique referral code
//   if (!this.referralCode) {
//     const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
//     let code = '';
//     let isUnique = false;
    
//     while (!isUnique) {
//       code = 'KONZE-';
//       for (let i = 0; i < 6; i++) {
//         code += chars.charAt(Math.floor(Math.random() * chars.length));
//       }
      
//       const existingUser = await mongoose.model('User').findOne({ referralCode: code });
//       isUnique = !existingUser;
//     }
    
//     this.referralCode = code;
//   }
  
//   next();
// });

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to generate verification code
UserSchema.methods.generateVerificationCode = function () {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  this.verificationCode = code;
  this.verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  return code;
};

// Indexes
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ phone: 1 }, { unique: true });
UserSchema.index({ referralCode: 1 }, { unique: true, sparse: true });
UserSchema.index({ isVerified: 1 });
UserSchema.index({ createdAt: 1 });

export default mongoose.model('User', UserSchema);