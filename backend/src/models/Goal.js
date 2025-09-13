const mongoose = require('mongoose');

const milestoneSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['theory', 'practice', 'project', 'assessment'],
    default: 'theory'
  },
  estimatedDuration: {
    type: Number, // in hours
    required: true
  },
  order: {
    type: Number,
    required: true
  },
  dependencies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Milestone'
  }],
  isCompleted: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date
  },
  resources: [{
    title: String,
    url: String,
    type: {
      type: String,
      enum: ['video', 'article', 'book', 'course', 'tool']
    }
  }],
  learningObjectives: [String],
  assessmentCriteria: [String]
}, { timestamps: true });

const goalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Goal title is required'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Goal description is required'],
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  category: {
    type: String,
    required: true,
    enum: [
      'technology', 'business', 'design', 'marketing', 'data-science',
      'programming', 'language', 'health', 'finance', 'creative',
      'education', 'career', 'personal-development', 'other'
    ]
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    default: 'beginner'
  },
  estimatedDuration: {
    value: {
      type: Number,
      required: true
    },
    unit: {
      type: String,
      enum: ['weeks', 'months'],
      required: true
    }
  },
  actualDuration: {
    startedAt: {
      type: Date,
      default: Date.now
    },
    completedAt: {
      type: Date
    },
    totalHours: {
      type: Number,
      default: 0
    }
  },
  status: {
    type: String,
    enum: ['planning', 'active', 'paused', 'completed', 'cancelled'],
    default: 'planning'
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  milestones: [milestoneSchema],
  aiBreakdown: {
    suggestedTimeline: {
      type: String
    },
    learningPath: {
      type: String
    },
    keySkills: [String],
    prerequisites: [String],
    successMetrics: [String]
  },
  checkinSchedule: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'bi-weekly', 'monthly'],
      default: 'weekly'
    },
    nextCheckin: {
      type: Date
    },
    lastCheckin: {
      type: Date
    }
  },
  tags: [String],
  isPublic: {
    type: Boolean,
    default: false
  },
  completedMilestones: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for total milestones
goalSchema.virtual('totalMilestones').get(function() {
  return this.milestones.length;
});

// Virtual for completion percentage
goalSchema.virtual('completionPercentage').get(function() {
  if (this.milestones.length === 0) return 0;
  return Math.round((this.completedMilestones / this.milestones.length) * 100);
});

// Virtual for estimated completion date
goalSchema.virtual('estimatedCompletionDate').get(function() {
  if (this.status === 'completed') return this.actualDuration.completedAt;
  
  const startDate = this.actualDuration.startedAt || this.createdAt;
  const durationInDays = this.estimatedDuration.unit === 'weeks' 
    ? this.estimatedDuration.value * 7 
    : this.estimatedDuration.value * 30;
  
  return new Date(startDate.getTime() + (durationInDays * 24 * 60 * 60 * 1000));
});

// Virtual for days remaining
goalSchema.virtual('daysRemaining').get(function() {
  if (this.status === 'completed') return 0;
  
  const estimatedCompletion = this.estimatedCompletionDate;
  const today = new Date();
  const diffTime = estimatedCompletion - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
});

// Update progress when milestones are completed
goalSchema.methods.updateProgress = function() {
  const completedMilestones = this.milestones.filter(milestone => milestone.isCompleted).length;
  this.completedMilestones = completedMilestones;
  this.progress = this.milestones.length > 0 ? Math.round((completedMilestones / this.milestones.length) * 100) : 0;
  
  // Update status based on progress
  if (this.progress === 100 && this.status !== 'completed') {
    this.status = 'completed';
    this.actualDuration.completedAt = new Date();
  } else if (this.progress > 0 && this.status === 'planning') {
    this.status = 'active';
  }
  
  return this.save();
};

// Calculate next check-in date
goalSchema.methods.calculateNextCheckin = function() {
  const frequencies = {
    daily: 1,
    weekly: 7,
    'bi-weekly': 14,
    monthly: 30
  };
  
  const daysToAdd = frequencies[this.checkinSchedule.frequency] || 7;
  const nextCheckin = new Date();
  nextCheckin.setDate(nextCheckin.getDate() + daysToAdd);
  
  this.checkinSchedule.nextCheckin = nextCheckin;
  return this.save();
};

// Add milestone to goal
goalSchema.methods.addMilestone = function(milestoneData) {
  const order = this.milestones.length;
  const milestone = {
    ...milestoneData,
    order
  };
  
  this.milestones.push(milestone);
  return this.save();
};

// Complete a milestone
goalSchema.methods.completeMilestone = function(milestoneId) {
  const milestone = this.milestones.id(milestoneId);
  if (milestone) {
    milestone.isCompleted = true;
    milestone.completedAt = new Date();
    return this.updateProgress();
  }
  throw new Error('Milestone not found');
};

module.exports = mongoose.model('Goal', goalSchema);
