const mongoose = require('mongoose');

const checkinSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  goal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Goal',
    required: true
  },
  type: {
    type: String,
    enum: ['scheduled', 'reminder'],
    default: 'scheduled'
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'missed'],
    default: 'pending'
  },
  responses: {
    progressRating: {
      type: Number,
      min: 1,
      max: 10,
      required: function() {
        return this.status === 'completed';
      }
    },
    timeSpent: {
      type: Number, // in minutes
      required: function() {
        return this.status === 'completed';
      }
    },
    challenges: [String],
    achievements: [String],
    nextSteps: [String],
    notes: {
      type: String,
      maxlength: [1000, 'Notes cannot be more than 1000 characters']
    },
    mood: {
      type: String,
      enum: ['excited', 'motivated', 'neutral', 'frustrated', 'overwhelmed'],
      required: function() {
        return this.status === 'completed';
      }
    }
  },
  scheduledFor: {
    type: Date,
    required: true
  },
  completedAt: {
    type: Date
  },
  reminderSent: {
    type: Boolean,
    default: false
  },
  reminderSentAt: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for check-in duration
checkinSchema.virtual('duration').get(function() {
  if (this.completedAt && this.createdAt) {
    return Math.round((this.completedAt - this.createdAt) / (1000 * 60)); // in minutes
  }
  return null;
});

// Virtual for days since scheduled
checkinSchema.virtual('daysSinceScheduled').get(function() {
  const today = new Date();
  const diffTime = today - this.scheduledFor;
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for is overdue
checkinSchema.virtual('isOverdue').get(function() {
  return this.status === 'pending' && this.daysSinceScheduled > 0;
});

// Static method to create scheduled check-ins
checkinSchema.statics.createScheduledCheckins = async function(goal) {
  const frequencies = {
    daily: 1,
    weekly: 7,
    'bi-weekly': 14,
    monthly: 30
  };
  
  const frequencyDays = frequencies[goal.checkinSchedule.frequency] || 7;
  const checkins = [];
  
  // Create check-ins for the next 3 months
  for (let i = 0; i < 12; i++) {
    const scheduledFor = new Date(goal.checkinSchedule.nextCheckin);
    scheduledFor.setDate(scheduledFor.getDate() + (i * frequencyDays));
    
    checkins.push({
      user: goal.user,
      goal: goal._id,
      type: 'scheduled',
      scheduledFor
    });
  }
  
  return this.insertMany(checkins);
};

// Method to complete check-in
checkinSchema.methods.complete = function(responses) {
  this.status = 'completed';
  this.responses = responses;
  this.completedAt = new Date();
  return this.save();
};

// Method to mark as missed
checkinSchema.methods.markAsMissed = function() {
  this.status = 'missed';
  return this.save();
};

// Method to send reminder
checkinSchema.methods.sendReminder = function() {
  this.reminderSent = true;
  this.reminderSentAt = new Date();
  return this.save();
};

module.exports = mongoose.model('Checkin', checkinSchema);
