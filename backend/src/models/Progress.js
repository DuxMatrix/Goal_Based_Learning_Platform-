const mongoose = require('mongoose');

const progressEntrySchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  type: {
    type: String,
    enum: ['study', 'practice', 'checkin', 'tutor', 'milestone'],
    required: true
  },
  value: {
    type: Number,
    required: true
  },
  unit: {
    type: String,
    enum: ['minutes', 'hours', 'percent', 'count'],
    required: true
  },
  description: String,
  metadata: {
    goalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Goal'
    },
    milestoneId: mongoose.Schema.Types.ObjectId,
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TutorSession'
    }
  }
});

const progressSchema = new mongoose.Schema({
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
  entries: [progressEntrySchema],
  metrics: {
    totalStudyTime: {
      type: Number,
      default: 0 // in minutes
    },
    averageSessionDuration: {
      type: Number,
      default: 0 // in minutes
    },
    consistencyScore: {
      type: Number,
      default: 0 // 0-100
    },
    learningVelocity: {
      type: Number,
      default: 0 // progress per hour
    },
    streak: {
      current: {
        type: Number,
        default: 0
      },
      longest: {
        type: Number,
        default: 0
      },
      lastActivity: Date
    }
  },
  weeklyGoals: [{
    week: {
      type: String, // YYYY-WW format
      required: true
    },
    targetHours: {
      type: Number,
      required: true
    },
    actualHours: {
      type: Number,
      default: 0
    },
    completed: {
      type: Boolean,
      default: false
    }
  }],
  insights: [{
    type: {
      type: String,
      enum: ['achievement', 'warning', 'suggestion', 'milestone'],
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
    data: mongoose.Schema.Types.Mixed,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for current week's progress
progressSchema.virtual('currentWeekProgress').get(function() {
  const currentWeek = this.getCurrentWeek();
  const weekGoal = this.weeklyGoals.find(wg => wg.week === currentWeek);
  return weekGoal ? weekGoal.actualHours : 0;
});

// Virtual for current week's target
progressSchema.virtual('currentWeekTarget').get(function() {
  const currentWeek = this.getCurrentWeek();
  const weekGoal = this.weeklyGoals.find(wg => wg.week === currentWeek);
  return weekGoal ? weekGoal.targetHours : 0;
});

// Virtual for progress percentage this week
progressSchema.virtual('weeklyProgressPercentage').get(function() {
  const target = this.currentWeekTarget;
  const actual = this.currentWeekProgress;
  return target > 0 ? Math.min(100, Math.round((actual / target) * 100)) : 0;
});

// Method to get current week string
progressSchema.methods.getCurrentWeek = function() {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now - startOfYear) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
};

// Method to add progress entry
progressSchema.methods.addEntry = function(entryData) {
  const entry = {
    ...entryData,
    date: entryData.date || new Date()
  };
  
  this.entries.push(entry);
  
  // Update metrics based on entry type
  if (entry.type === 'study' && entry.unit === 'minutes') {
    this.metrics.totalStudyTime += entry.value;
    this.updateStreak();
  }
  
  // Update weekly goals
  this.updateWeeklyGoals(entry);
  
  // Update learning velocity
  this.updateLearningVelocity();
  
  return this.save();
};

// Method to update streak
progressSchema.methods.updateStreak = function() {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const todayEntries = this.entries.filter(entry => 
    entry.date.toDateString() === today.toDateString() && entry.type === 'study'
  );
  
  const yesterdayEntries = this.entries.filter(entry => 
    entry.date.toDateString() === yesterday.toDateString() && entry.type === 'study'
  );
  
  if (todayEntries.length > 0) {
    if (yesterdayEntries.length > 0 || this.metrics.streak.current === 0) {
      this.metrics.streak.current += 1;
    }
    this.metrics.streak.lastActivity = today;
    
    if (this.metrics.streak.current > this.metrics.streak.longest) {
      this.metrics.streak.longest = this.metrics.streak.current;
    }
  }
  
  return this.save();
};

// Method to update weekly goals
progressSchema.methods.updateWeeklyGoals = function(entry) {
  if (entry.type !== 'study' || entry.unit !== 'minutes') return;
  
  const week = this.getCurrentWeek();
  const hours = entry.value / 60;
  
  let weekGoal = this.weeklyGoals.find(wg => wg.week === week);
  if (!weekGoal) {
    weekGoal = {
      week,
      targetHours: 10, // Default 10 hours per week
      actualHours: 0,
      completed: false
    };
    this.weeklyGoals.push(weekGoal);
  }
  
  weekGoal.actualHours += hours;
  weekGoal.completed = weekGoal.actualHours >= weekGoal.targetHours;
  
  return this.save();
};

// Method to update learning velocity
progressSchema.methods.updateLearningVelocity = function() {
  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 7);
  
  const recentEntries = this.entries.filter(entry => 
    entry.date >= lastWeek && entry.type === 'study'
  );
  
  const totalTime = recentEntries.reduce((sum, entry) => 
    sum + (entry.unit === 'minutes' ? entry.value : entry.value * 60), 0
  );
  
  // Calculate progress made in the last week
  const progressEntries = this.entries.filter(entry => 
    entry.date >= lastWeek && entry.type === 'milestone'
  );
  
  const progressMade = progressEntries.reduce((sum, entry) => sum + entry.value, 0);
  
  this.metrics.learningVelocity = totalTime > 0 ? (progressMade / totalTime) * 60 : 0; // progress per hour
  
  return this.save();
};

// Method to generate insights
progressSchema.methods.generateInsights = function() {
  const insights = [];
  
  // Check for achievements
  if (this.metrics.streak.current >= 7) {
    insights.push({
      type: 'achievement',
      title: '7-Day Learning Streak!',
      description: `You've been consistent for ${this.metrics.streak.current} days. Keep it up!`,
      data: { streak: this.metrics.streak.current }
    });
  }
  
  // Check for warnings
  if (this.weeklyProgressPercentage < 50) {
    insights.push({
      type: 'warning',
      title: 'Behind on Weekly Goal',
      description: `You're at ${this.weeklyProgressPercentage}% of your weekly target. Consider adjusting your schedule.`,
      data: { percentage: this.weeklyProgressPercentage }
    });
  }
  
  // Check for suggestions
  if (this.metrics.averageSessionDuration < 30) {
    insights.push({
      type: 'suggestion',
      title: 'Consider Longer Sessions',
      description: 'Your average session is quite short. Longer sessions might help with deeper learning.',
      data: { averageDuration: this.metrics.averageSessionDuration }
    });
  }
  
  this.insights = [...this.insights, ...insights];
  return this.save();
};

// Static method to get user's overall progress
progressSchema.statics.getUserOverallProgress = async function(userId) {
  const progress = await this.aggregate([
    { $match: { user: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalStudyTime: { $sum: '$metrics.totalStudyTime' },
        totalSessions: { $sum: { $size: '$entries' } },
        averageConsistency: { $avg: '$metrics.consistencyScore' },
        currentStreak: { $max: '$metrics.streak.current' },
        longestStreak: { $max: '$metrics.streak.longest' }
      }
    }
  ]);
  
  return progress[0] || {
    totalStudyTime: 0,
    totalSessions: 0,
    averageConsistency: 0,
    currentStreak: 0,
    longestStreak: 0
  };
};

module.exports = mongoose.model('Progress', progressSchema);
