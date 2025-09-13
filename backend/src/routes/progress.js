const express = require('express');
const { body, validationResult } = require('express-validator');
const Progress = require('../models/Progress');
const Goal = require('../models/Goal');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// @route   GET /api/progress
// @desc    Get user's progress data
// @access  Private
router.get('/', asyncHandler(async (req, res) => {
  const { goalId } = req.query;
  
  const query = { user: req.user._id };
  if (goalId) {
    query.goal = goalId;
  }

  const progressData = await Progress.find(query)
    .populate('goal', 'title description')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: { progressData }
  });
}));

// @route   GET /api/progress/overview
// @desc    Get progress overview
// @access  Private
router.get('/overview', asyncHandler(async (req, res) => {
  const overallProgress = await Progress.getUserOverallProgress(req.user._id);

  // Get recent entries
  const recentEntries = await Progress.aggregate([
    { $match: { user: req.user._id } },
    { $unwind: '$entries' },
    { $sort: { 'entries.date': -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: 'goals',
        localField: 'goal',
        foreignField: '_id',
        as: 'goal'
      }
    },
    { $unwind: '$goal' },
    {
      $project: {
        date: '$entries.date',
        type: '$entries.type',
        value: '$entries.value',
        unit: '$entries.unit',
        description: '$entries.description',
        goalTitle: '$goal.title'
      }
    }
  ]);

  // Get weekly progress for current month
  const currentMonth = new Date();
  currentMonth.setDate(1);
  
  const monthlyProgress = await Progress.aggregate([
    { $match: { user: req.user._id } },
    { $unwind: '$entries' },
    { 
      $match: { 
        'entries.date': { $gte: currentMonth },
        'entries.type': 'study'
      }
    },
    {
      $group: {
        _id: {
          week: { $week: '$entries.date' },
          year: { $year: '$entries.date' }
        },
        totalMinutes: { $sum: '$entries.value' },
        sessions: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.week': 1 } }
  ]);

  res.json({
    success: true,
    data: {
      overall: overallProgress,
      recentEntries,
      monthlyProgress
    }
  });
}));

// @route   POST /api/progress/entries
// @desc    Add progress entry
// @access  Private
router.post('/entries', [
  body('goalId').isMongoId().withMessage('Valid goal ID is required'),
  body('type').isIn(['study', 'practice', 'checkin', 'tutor', 'milestone']).withMessage('Valid type is required'),
  body('value').isNumeric().withMessage('Value must be a number'),
  body('unit').isIn(['minutes', 'hours', 'percent', 'count']).withMessage('Valid unit is required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { goalId, type, value, unit, description, metadata } = req.body;

  // Verify goal belongs to user
  const goal = await Goal.findOne({
    _id: goalId,
    user: req.user._id
  });

  if (!goal) {
    return res.status(404).json({
      success: false,
      message: 'Goal not found'
    });
  }

  // Find or create progress record
  let progress = await Progress.findOne({
    user: req.user._id,
    goal: goalId
  });

  if (!progress) {
    progress = new Progress({
      user: req.user._id,
      goal: goalId,
      entries: [],
      metrics: {
        totalStudyTime: 0,
        averageSessionDuration: 0,
        consistencyScore: 0,
        learningVelocity: 0,
        streak: {
          current: 0,
          longest: 0
        }
      }
    });
  }

  // Add entry
  await progress.addEntry({
    type,
    value: parseFloat(value),
    unit,
    description,
    metadata: metadata || {}
  });

  // Generate insights
  await progress.generateInsights();

  res.status(201).json({
    success: true,
    message: 'Progress entry added successfully',
    data: { progress }
  });
}));

// @route   GET /api/progress/insights
// @desc    Get progress insights
// @access  Private
router.get('/insights', asyncHandler(async (req, res) => {
  const { goalId } = req.query;
  
  const query = { user: req.user._id };
  if (goalId) {
    query.goal = goalId;
  }

  const progressData = await Progress.find(query)
    .populate('goal', 'title description')
    .select('insights goal');

  // Combine all insights
  const allInsights = progressData.flatMap(p => 
    p.insights.map(insight => ({
      ...insight,
      goalTitle: p.goal.title
    }))
  ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json({
    success: true,
    data: { insights: allInsights }
  });
}));

// @route   GET /api/progress/analytics
// @desc    Get detailed analytics
// @access  Private
router.get('/analytics', asyncHandler(async (req, res) => {
  const { goalId, period = 'month' } = req.query;
  
  const query = { user: req.user._id };
  if (goalId) {
    query.goal = goalId;
  }

  // Calculate date range based on period
  const endDate = new Date();
  const startDate = new Date();
  
  switch (period) {
    case 'week':
      startDate.setDate(endDate.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(endDate.getMonth() - 1);
      break;
    case 'quarter':
      startDate.setMonth(endDate.getMonth() - 3);
      break;
    case 'year':
      startDate.setFullYear(endDate.getFullYear() - 1);
      break;
    default:
      startDate.setMonth(endDate.getMonth() - 1);
  }

  // Get progress entries in date range
  const progressData = await Progress.aggregate([
    { $match: query },
    { $unwind: '$entries' },
    {
      $match: {
        'entries.date': { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$entries.date' } },
          type: '$entries.type'
        },
        totalValue: { $sum: '$entries.value' },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.date': 1 } }
  ]);

  // Get study time by day
  const dailyStudyTime = await Progress.aggregate([
    { $match: query },
    { $unwind: '$entries' },
    {
      $match: {
        'entries.date': { $gte: startDate, $lte: endDate },
        'entries.type': 'study'
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$entries.date' } },
        totalMinutes: { $sum: '$entries.value' }
      }
    },
    { $sort: { '_id': 1 } }
  ]);

  // Get learning velocity trends
  const velocityTrends = await Progress.aggregate([
    { $match: query },
    {
      $project: {
        learningVelocity: '$metrics.learningVelocity',
        week: { $week: '$updatedAt' },
        year: { $year: '$updatedAt' }
      }
    },
    {
      $group: {
        _id: { week: '$week', year: '$year' },
        avgVelocity: { $avg: '$learningVelocity' }
      }
    },
    { $sort: { '_id.year': 1, '_id.week': 1 } }
  ]);

  res.json({
    success: true,
    data: {
      period,
      dateRange: { startDate, endDate },
      progressData,
      dailyStudyTime,
      velocityTrends
    }
  });
}));

// @route   GET /api/progress/streak
// @desc    Get learning streak information
// @access  Private
router.get('/streak', asyncHandler(async (req, res) => {
  const progressData = await Progress.find({ user: req.user._id })
    .select('metrics.streak entries')
    .sort({ updatedAt: -1 });

  const currentStreak = Math.max(...progressData.map(p => p.metrics.streak.current), 0);
  const longestStreak = Math.max(...progressData.map(p => p.metrics.streak.longest), 0);

  // Calculate streak history for the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const streakHistory = await Progress.aggregate([
    { $match: { user: req.user._id } },
    { $unwind: '$entries' },
    {
      $match: {
        'entries.date': { $gte: thirtyDaysAgo },
        'entries.type': 'study'
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$entries.date' } },
        hasActivity: { $sum: 1 }
      }
    },
    { $sort: { '_id': 1 } }
  ]);

  res.json({
    success: true,
    data: {
      currentStreak,
      longestStreak,
      streakHistory
    }
  });
}));

module.exports = router;
