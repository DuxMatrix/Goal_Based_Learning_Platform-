const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      user: req.user.profile
    }
  });
}));

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('preferences.checkinFrequency')
    .optional()
    .isIn(['daily', 'weekly', 'bi-weekly', 'monthly'])
    .withMessage('Invalid check-in frequency'),
  body('preferences.learningStyle')
    .optional()
    .isIn(['visual', 'auditory', 'kinesthetic', 'reading'])
    .withMessage('Invalid learning style')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const allowedUpdates = ['name', 'avatar', 'preferences'];
  
  allowedUpdates.forEach(field => {
    if (req.body[field] !== undefined) {
      req.user[field] = req.body[field];
    }
  });

  await req.user.save();

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user: req.user.profile
    }
  });
}));

// @route   PUT /api/users/password
// @desc    Change password
// @access  Private
router.put('/password', [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one lowercase letter, one uppercase letter, and one number')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { currentPassword, newPassword } = req.body;

  // Get user with password
  const user = await User.findById(req.user._id).select('+password');

  // Check current password
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    return res.status(400).json({
      success: false,
      message: 'Current password is incorrect'
    });
  }

  // Update password
  user.password = newPassword;
  await user.save();

  res.json({
    success: true,
    message: 'Password changed successfully'
  });
}));

// @route   DELETE /api/users/account
// @desc    Delete user account
// @access  Private
router.delete('/account', [
  body('password').notEmpty().withMessage('Password is required for account deletion')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { password } = req.body;

  // Get user with password
  const user = await User.findById(req.user._id).select('+password');

  // Check password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(400).json({
      success: false,
      message: 'Password is incorrect'
    });
  }

  // Deactivate account instead of deleting
  user.isActive = false;
  await user.save();

  res.json({
    success: true,
    message: 'Account deactivated successfully'
  });
}));

// @route   GET /api/users/stats
// @desc    Get user statistics
// @access  Private
router.get('/stats', asyncHandler(async (req, res) => {
  const Goal = require('../models/Goal');
  const Progress = require('../models/Progress');
  const TutorSession = require('../models/TutorSession');
  const Checkin = require('../models/Checkin');

  // Get basic stats
  const [goals, progress, sessions, checkins] = await Promise.all([
    Goal.find({ user: req.user._id }),
    Progress.find({ user: req.user._id }),
    TutorSession.find({ user: req.user._id }),
    Checkin.find({ user: req.user._id })
  ]);

  // Calculate statistics
  const stats = {
    goals: {
      total: goals.length,
      active: goals.filter(g => g.status === 'active').length,
      completed: goals.filter(g => g.status === 'completed').length,
      averageProgress: goals.length > 0 ? 
        Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / goals.length) : 0
    },
    study: {
      totalHours: progress.reduce((sum, p) => sum + p.metrics.totalStudyTime, 0) / 60,
      currentStreak: progress.length > 0 ? 
        Math.max(...progress.map(p => p.metrics.streak.current)) : 0,
      longestStreak: progress.length > 0 ? 
        Math.max(...progress.map(p => p.metrics.streak.longest)) : 0
    },
    sessions: {
      total: sessions.length,
      totalDuration: sessions.reduce((sum, s) => sum + s.duration.totalMinutes, 0),
      averageRating: sessions.filter(s => s.feedback.userRating).length > 0 ?
        sessions.reduce((sum, s) => sum + (s.feedback.userRating || 0), 0) / 
        sessions.filter(s => s.feedback.userRating).length : 0
    },
    checkins: {
      total: checkins.length,
      completed: checkins.filter(c => c.status === 'completed').length,
      missed: checkins.filter(c => c.status === 'missed').length,
      completionRate: checkins.length > 0 ? 
        Math.round((checkins.filter(c => c.status === 'completed').length / checkins.length) * 100) : 0
    }
  };

  res.json({
    success: true,
    data: { stats }
  });
}));

module.exports = router;
