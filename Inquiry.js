const mongoose = require('mongoose');

const inquirySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email address']
  },
  phone: {
    type: String,
    required: false,
    trim: true,
    match: [/^[\+]?[1-9][\d\-\s\(\)]{0,15}$/, 'Please enter a valid phone number']
  },
  packageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TourPackage',
    required: true
  },
  message: {
    type: String,
    required: true,
    trim: true,
    minlength: 10,
    maxlength: 1000
  },
  status: {
    type: String,
    enum: ['pending', 'contacted', 'booked'],
    default: 'pending'
  },
  travelers: {
    type: Number,
    min: 1,
    default: 1
  },
  preferredDate: {
    type: String,
    required: false
  }
}, {
  timestamps: true
});

// Index for efficient queries
inquirySchema.index({ createdAt: -1 });
inquirySchema.index({ packageId: 1, createdAt: -1 });
inquirySchema.index({ status: 1 });

module.exports = mongoose.model('Inquiry', inquirySchema);
