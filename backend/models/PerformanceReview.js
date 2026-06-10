const mongoose = require('mongoose');

const PerformanceReviewSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please specify the employee being reviewed']
  },
  reviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please specify the reviewer']
  },
  technicalSkills: {
    type: Number,
    min: 1,
    max: 5,
    required: [true, 'Please rate technical skills (1-5)']
  },
  communication: {
    type: Number,
    min: 1,
    max: 5,
    required: [true, 'Please rate communication (1-5)']
  },
  teamwork: {
    type: Number,
    min: 1,
    max: 5,
    required: [true, 'Please rate teamwork (1-5)']
  },
  problemSolving: {
    type: Number,
    min: 1,
    max: 5,
    required: [true, 'Please rate problem solving (1-5)']
  },
  leadership: {
    type: Number,
    min: 1,
    max: 5,
    required: [true, 'Please rate leadership (1-5)']
  },
  comments: {
    type: String,
    required: [true, 'Please add review comments'],
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('PerformanceReview', PerformanceReviewSchema);
