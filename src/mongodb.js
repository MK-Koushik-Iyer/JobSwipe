const mongoose = require("mongoose");

async function connectToDatabase() {
  try {
    await mongoose.connect("mongodb://localhost:27017/jobswipe");
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
  }
}

// Call the connection function
connectToDatabase();

// User Schema - Base for both Hirers and Job Seekers
const userSchema = new mongoose.Schema({
  fname: {
    type: String,
    required: true,
    trim: true
  },
  lname: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['hirer', 'seeker'],
    required: true
  },
  profileComplete: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastActive: {
    type: Date
  },
  // Common profile fields
  phone: String,
  location: {
    city: String,
    state: String,
    country: String
  },
  profilePicture: String,
  // Role-specific fields
  hirerProfile: {
    companyName: String,
    industry: String,
    companySize: String,
    companyDescription: String,
    website: String
  },
  seekerProfile: {
    title: String,
    experience: Number,
    skills: [String],
    education: [{
      degree: String,
      institution: String,
      year: Number
    }],
    resume: String,
    preferredLocations: [String],
    expectedSalary: {
      min: Number,
      max: Number,
      currency: String
    }
  }
});

// Add indexes for better query performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ 'seekerProfile.skills': 1 });
userSchema.index({ 'hirerProfile.industry': 1 });

// Add methods to the schema
userSchema.methods.updateLastActive = function() {
  this.lastActive = new Date();
  return this.save();
};

// Middleware to handle pre-save operations
userSchema.pre('save', function(next) {
  if (!this.lastActive) {
    this.lastActive = new Date();
  }
  next();
});

// Create Job Posting Schema
const jobPostingSchema = new mongoose.Schema({
  hirer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  requirements: [String],
  location: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['full-time', 'part-time', 'contract', 'internship'],
    required: true
  },
  salary: {
    min: Number,
    max: Number,
    currency: String
  },
  skills: [String],
  experience: {
    min: Number,
    max: Number
  },
  status: {
    type: String,
    enum: ['active', 'closed', 'draft'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: Date,
  applicants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'shortlisted', 'rejected'],
      default: 'pending'
    },
    appliedAt: {
      type: Date,
      default: Date.now
    }
  }]
});

// Add indexes for job postings
jobPostingSchema.index({ 'skills': 1 });
jobPostingSchema.index({ 'status': 1 });
jobPostingSchema.index({ 'createdAt': -1 });

// Create models
const User = mongoose.model('User', userSchema);
const JobPosting = mongoose.model('JobPosting', jobPostingSchema);

module.exports = {
  User,
  JobPosting
};