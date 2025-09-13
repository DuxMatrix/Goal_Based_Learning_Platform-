const express = require('express');
const { body, validationResult } = require('express-validator');
const Checkin = require('../models/Checkin');
const Goal = require('../models/Goal');
const { asyncHandler } = require('../middleware/errorHandler');
const notificationService = require('../services/notificationService');
const schedulerService = require('../services/schedulerService');

const router = express.Router();

// @route   GET /api/checkins
// @desc    Get user's check-ins
// @access  Private
router.get('/', asyncHandler(async (req, res) => {
  const { status, goalId, page = 1, limit = 10 } = req.query;
  
  const query = { user: req.user._id };
  
  if (status) {
    query.status = status;
  }
  
  if (goalId) {
    query.goal = goalId;
  }

  const checkins = await Checkin.find(query)
    .populate('goal', 'title description')
    .sort({ scheduledFor: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Checkin.countDocuments(query);

  res.json({
    success: true,
    data: {
      checkins,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    }
  });
}));

// @route   GET /api/checkins/:id
// @desc    Get single check-in
// @access  Private
router.get('/:id', asyncHandler(async (req, res) => {
  const checkin = await Checkin.findOne({
    _id: req.params.id,
    user: req.user._id
  }).populate('goal', 'title description');

  if (!checkin) {
    return res.status(404).json({
      success: false,
      message: 'Check-in not found'
    });
  }

  res.json({
    success: true,
    data: { checkin }
  });
}));


// @route   PUT /api/checkins/:id
// @desc    Update check-in
// @access  Private
router.put('/:id', [
  body('progressRating').optional().isInt({ min: 1, max: 10 }).withMessage('Progress rating must be between 1 and 10'),
  body('timeSpent').optional().isInt({ min: 0 }).withMessage('Time spent must be a positive number'),
  body('mood').optional().isIn(['excited', 'motivated', 'neutral', 'frustrated', 'overwhelmed']).withMessage('Valid mood is required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const checkin = await Checkin.findOne({
    _id: req.params.id,
    user: req.user._id
  });

  if (!checkin) {
    return res.status(404).json({
      success: false,
      message: 'Check-in not found'
    });
  }

  // Update responses
  if (req.body.progressRating !== undefined) {
    checkin.responses.progressRating = req.body.progressRating;
  }
  if (req.body.timeSpent !== undefined) {
    checkin.responses.timeSpent = req.body.timeSpent;
  }
  if (req.body.mood !== undefined) {
    checkin.responses.mood = req.body.mood;
  }
  if (req.body.challenges !== undefined) {
    checkin.responses.challenges = req.body.challenges;
  }
  if (req.body.achievements !== undefined) {
    checkin.responses.achievements = req.body.achievements;
  }
  if (req.body.nextSteps !== undefined) {
    checkin.responses.nextSteps = req.body.nextSteps;
  }
  if (req.body.notes !== undefined) {
    checkin.responses.notes = req.body.notes;
  }

  await checkin.save();

  res.json({
    success: true,
    message: 'Check-in updated successfully',
    data: { checkin }
  });
}));

// @route   PUT /api/checkins/:id/complete
// @desc    Complete scheduled check-in
// @access  Private
router.put('/:id/complete', [
  body('progressRating').isInt({ min: 1, max: 10 }).withMessage('Progress rating must be between 1 and 10'),
  body('timeSpent').isInt({ min: 0 }).withMessage('Time spent must be a positive number'),
  body('mood').isIn(['excited', 'motivated', 'neutral', 'frustrated', 'overwhelmed']).withMessage('Valid mood is required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const checkin = await Checkin.findOne({
    _id: req.params.id,
    user: req.user._id
  });

  if (!checkin) {
    return res.status(404).json({
      success: false,
      message: 'Check-in not found'
    });
  }

  if (checkin.status === 'completed') {
    return res.status(400).json({
      success: false,
      message: 'Check-in already completed'
    });
  }

  const { progressRating, timeSpent, mood, challenges, achievements, nextSteps, notes } = req.body;

  await checkin.complete({
    progressRating,
    timeSpent,
    mood,
    challenges: challenges || [],
    achievements: achievements || [],
    nextSteps: nextSteps || [],
    notes
  });

  // Update goal's last check-in
  const goal = await Goal.findById(checkin.goal);
  if (goal) {
    goal.checkinSchedule.lastCheckin = new Date();
    await goal.save();
  }

  res.json({
    success: true,
    message: 'Check-in completed successfully',
    data: { checkin }
  });
}));

// @route   PUT /api/checkins/:id/miss
// @desc    Mark check-in as missed
// @access  Private
router.put('/:id/miss', asyncHandler(async (req, res) => {
  const checkin = await Checkin.findOne({
    _id: req.params.id,
    user: req.user._id
  });

  if (!checkin) {
    return res.status(404).json({
      success: false,
      message: 'Check-in not found'
    });
  }

  if (checkin.status === 'completed') {
    return res.status(400).json({
      success: false,
      message: 'Cannot mark completed check-in as missed'
    });
  }

  await checkin.markAsMissed();

  res.json({
    success: true,
    message: 'Check-in marked as missed',
    data: { checkin }
  });
}));

// @route   POST /api/checkins/schedule
// @desc    Schedule check-ins for a goal
// @access  Private
router.post('/schedule', [
  body('goalId').isMongoId().withMessage('Valid goal ID is required'),
  body('frequency').isIn(['daily', 'weekly', 'bi-weekly', 'monthly']).withMessage('Valid frequency is required'),
  body('startDate').optional().isISO8601().withMessage('Valid start date is required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { goalId, frequency, startDate } = req.body;

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

  // Update goal's check-in schedule
  goal.checkinSchedule.frequency = frequency;
  goal.checkinSchedule.nextCheckin = startDate ? new Date(startDate) : new Date();
  await goal.save();

  // Create scheduled check-ins
  const checkins = await Checkin.createScheduledCheckins(goal);

  res.json({
    success: true,
    message: 'Check-ins scheduled successfully',
    data: {
      checkins: checkins.slice(0, 5), // Return first 5 for preview
      total: checkins.length
    }
  });
}));

// @route   GET /api/checkins/upcoming
// @desc    Get upcoming check-ins
// @access  Private
router.get('/upcoming', asyncHandler(async (req, res) => {
  const { limit = 5 } = req.query;
  
  const upcomingCheckins = await Checkin.find({
    user: req.user._id,
    status: 'pending',
    scheduledFor: { $gte: new Date() }
  })
    .populate('goal', 'title description')
    .sort({ scheduledFor: 1 })
    .limit(parseInt(limit));

  res.json({
    success: true,
    data: { upcomingCheckins }
  });
}));

// @route   GET /api/checkins/overdue
// @desc    Get overdue check-ins
// @access  Private
router.get('/overdue', asyncHandler(async (req, res) => {
  const overdueCheckins = await Checkin.find({
    user: req.user._id,
    status: 'pending',
    scheduledFor: { $lt: new Date() }
  })
    .populate('goal', 'title description')
    .sort({ scheduledFor: 1 });

  res.json({
    success: true,
    data: { overdueCheckins }
  });
}));

// @route   POST /api/checkins/:id/send-reminder
// @desc    Manually send reminder for a check-in
// @access  Private
router.post('/:id/send-reminder', asyncHandler(async (req, res) => {
  const checkin = await Checkin.findOne({
    _id: req.params.id,
    user: req.user._id
  }).populate('user goal');

  if (!checkin) {
    return res.status(404).json({
      success: false,
      message: 'Check-in not found'
    });
  }

  if (checkin.reminderSent) {
    return res.status(400).json({
      success: false,
      message: 'Reminder already sent for this check-in'
    });
  }

  const result = await notificationService.sendCheckinReminder(checkin, checkin.user, checkin.goal);
  
  if (result.success) {
    checkin.reminderSent = true;
    checkin.reminderSentAt = new Date();
    await checkin.save();
  }

  res.json({
    success: result.success,
    message: result.success ? 'Reminder sent successfully' : 'Failed to send reminder',
    data: result
  });
}));

// @route   GET /api/checkins/notifications/test
// @desc    Test notification service
// @access  Private
router.get('/notifications/test', asyncHandler(async (req, res) => {
  const result = await notificationService.testEmailService();
  
  res.json({
    success: result.success,
    message: result.success ? 'Notification service is working' : 'Notification service error',
    data: result
  });
}));

// @route   GET /api/checkins/scheduler/status
// @desc    Get scheduler status
// @access  Private
router.get('/scheduler/status', asyncHandler(async (req, res) => {
  const status = schedulerService.getStatus();
  
  res.json({
    success: true,
    data: status
  });
}));

// @route   POST /api/checkins/scheduler/restart
// @desc    Restart scheduler service
// @access  Private
router.post('/scheduler/restart', asyncHandler(async (req, res) => {
  schedulerService.restart();
  
  res.json({
    success: true,
    message: 'Scheduler restarted successfully'
  });
}));

module.exports = router;
