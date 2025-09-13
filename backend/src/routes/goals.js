const express = require('express');
const { body, validationResult } = require('express-validator');
const Goal = require('../models/Goal');
const Progress = require('../models/Progress');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();
const OpenAI = require('openai');
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
const fetch = require('node-fetch');

// Validation rules
const goalValidation = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters'),
  body('category')
    .isIn([
      'technology', 'business', 'design', 'marketing', 'data-science',
      'programming', 'language', 'health', 'finance', 'creative',
      'education', 'career', 'personal-development', 'other'
    ])
    .withMessage('Invalid category'),
  body('estimatedDuration.value')
    .isInt({ min: 1, max: 52 })
    .withMessage('Duration value must be between 1 and 52'),
  body('estimatedDuration.unit')
    .isIn(['weeks', 'months'])
    .withMessage('Duration unit must be weeks or months')
];

// @route   GET /api/goals
// @desc    Get all goals for user
// @access  Private
router.get('/', asyncHandler(async (req, res) => {
  const { status, category, page = 1, limit = 10 } = req.query;
  
  const query = { user: req.user._id };
  
  if (status) {
    query.status = status;
  }
  
  if (category) {
    query.category = category;
  }

  const goals = await Goal.find(query)
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .populate('user', 'name email');

  const total = await Goal.countDocuments(query);

  res.json({
    success: true,
    data: {
      goals,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    }
  });
}));

// @route   GET /api/goals/:id
// @desc    Get single goal
// @access  Private
router.get('/:id', asyncHandler(async (req, res) => {
  const goal = await Goal.findOne({
    _id: req.params.id,
    user: req.user._id
  }).populate('user', 'name email');

  if (!goal) {
    return res.status(404).json({
      success: false,
      message: 'Goal not found'
    });
  }

  res.json({
    success: true,
    data: { goal }
  });
}));

// @route   POST /api/goals
// @desc    Create new goal
// @access  Private
router.post('/', goalValidation, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const goalData = {
    ...req.body,
    user: req.user._id
  };

  // Generate AI breakdown (simulated)
  const aiBreakdown = await generateAIBreakdown(goalData);
  goalData.aiBreakdown = aiBreakdown;

  // Set initial check-in schedule
  goalData.checkinSchedule = {
    frequency: req.body.checkinFrequency || 'weekly',
    nextCheckin: calculateNextCheckin(req.body.checkinFrequency || 'weekly')
  };

  const goal = new Goal(goalData);
  await goal.save();

  // Create progress tracking
  const progress = new Progress({
    user: req.user._id,
    goal: goal._id,
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
  await progress.save();

  res.status(201).json({
    success: true,
    message: 'Goal created successfully',
    data: { goal }
  });
}));

// @route   PUT /api/goals/:id
// @desc    Update goal
// @access  Private
router.put('/:id', asyncHandler(async (req, res) => {
  const goal = await Goal.findOne({
    _id: req.params.id,
    user: req.user._id
  });

  if (!goal) {
    return res.status(404).json({
      success: false,
      message: 'Goal not found'
    });
  }

  // Update allowed fields
  const allowedUpdates = [
    'title', 'description', 'category', 'difficulty', 'estimatedDuration',
    'tags', 'isPublic', 'checkinSchedule'
  ];

  allowedUpdates.forEach(field => {
    if (req.body[field] !== undefined) {
      goal[field] = req.body[field];
    }
  });

  await goal.save();

  res.json({
    success: true,
    message: 'Goal updated successfully',
    data: { goal }
  });
}));

// @route   DELETE /api/goals/:id
// @desc    Delete goal
// @access  Private
router.delete('/:id', asyncHandler(async (req, res) => {
  const goal = await Goal.findOne({
    _id: req.params.id,
    user: req.user._id
  });

  if (!goal) {
    return res.status(404).json({
      success: false,
      message: 'Goal not found'
    });
  }

  // Delete associated progress tracking
  await Progress.deleteOne({ goal: goal._id });

  await goal.deleteOne();

  res.json({
    success: true,
    message: 'Goal deleted successfully'
  });
}));

// @route   POST /api/goals/:id/milestones
// @desc    Add milestone to goal
// @access  Private
router.post('/:id/milestones', [
  body('title').trim().isLength({ min: 3, max: 100 }).withMessage('Title is required'),
  body('description').trim().isLength({ min: 10, max: 500 }).withMessage('Description is required'),
  body('estimatedDuration').isInt({ min: 1, max: 168 }).withMessage('Duration must be between 1 and 168 hours')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const goal = await Goal.findOne({
    _id: req.params.id,
    user: req.user._id
  });

  if (!goal) {
    return res.status(404).json({
      success: false,
      message: 'Goal not found'
    });
  }

  await goal.addMilestone(req.body);

  res.json({
    success: true,
    message: 'Milestone added successfully',
    data: { goal }
  });
}));

// @route   PUT /api/goals/:id/milestones/:milestoneId
// @desc    Complete milestone
// @access  Private
router.put('/:id/milestones/:milestoneId', asyncHandler(async (req, res) => {
  const goal = await Goal.findOne({
    _id: req.params.id,
    user: req.user._id
  });

  if (!goal) {
    return res.status(404).json({
      success: false,
      message: 'Goal not found'
    });
  }

  const milestone = goal.milestones.id(req.params.milestoneId);
  if (!milestone) {
    return res.status(404).json({
      success: false,
      message: 'Milestone not found'
    });
  }

  // Check if milestone is already completed
  if (milestone.isCompleted) {
    return res.status(400).json({
      success: false,
      message: 'Milestone is already completed'
    });
  }

  // Check dependencies
  const unmetDependencies = [];
  for (const depId of milestone.dependencies) {
    const depMilestone = goal.milestones.id(depId);
    if (!depMilestone || !depMilestone.isCompleted) {
      unmetDependencies.push(depMilestone?.title || depId);
    }
  }

  if (unmetDependencies.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Cannot complete milestone. Unmet dependencies: ' + unmetDependencies.join(', ')
    });
  }

  try {
    await goal.completeMilestone(req.params.milestoneId);
    
    // Add progress entry
    const progress = await Progress.findOne({ goal: goal._id });
    if (progress) {
      await progress.addEntry({
        type: 'milestone',
        value: 1,
        unit: 'count',
        description: 'Milestone completed',
        metadata: {
          goalId: goal._id,
          milestoneId: req.params.milestoneId
        }
      });
    }

    res.json({
      success: true,
      message: 'Milestone completed successfully',
      data: { goal }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
}));

// @route   POST /api/goals/:id/breakdown
// @desc    Generate AI breakdown for goal
// @access  Private
router.post('/:id/breakdown', asyncHandler(async (req, res) => {
  const goal = await Goal.findOne({
    _id: req.params.id,
    user: req.user._id
  });

  if (!goal) {
    return res.status(404).json({
      success: false,
      message: 'Goal not found'
    });
  }

  // Generate new AI breakdown
  const aiBreakdown = await generateAIBreakdown(goal);
  goal.aiBreakdown = aiBreakdown;
  
  // Generate milestones based on breakdown
  const milestones = await generateMilestonesFromBreakdown(aiBreakdown, goal);
  goal.milestones = milestones;

  await goal.save();

  res.json({
    success: true,
    message: 'AI breakdown generated successfully',
    data: { goal }
  });
}));

// @route   PUT /api/goals/:id/milestones/:milestoneId/dependencies
// @desc    Update milestone dependencies
// @access  Private
router.put('/:id/milestones/:milestoneId/dependencies', [
  body('dependencies').isArray().withMessage('Dependencies must be an array'),
  body('dependencies.*').isMongoId().withMessage('Each dependency must be a valid milestone ID')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const goal = await Goal.findOne({
    _id: req.params.id,
    user: req.user._id
  });

  if (!goal) {
    return res.status(404).json({
      success: false,
      message: 'Goal not found'
    });
  }

  const milestone = goal.milestones.id(req.params.milestoneId);
  if (!milestone) {
    return res.status(404).json({
      success: false,
      message: 'Milestone not found'
    });
  }

  // Validate that all dependency IDs exist in the goal
  const { dependencies } = req.body;
  const validDependencies = [];
  
  for (const depId of dependencies) {
    const depMilestone = goal.milestones.id(depId);
    if (depMilestone && depId !== req.params.milestoneId) {
      validDependencies.push(depId);
    }
  }

  milestone.dependencies = validDependencies;
  await goal.save();

  res.json({
    success: true,
    message: 'Dependencies updated successfully',
    data: { milestone }
  });
}));

// @route   GET /api/goals/:id/progress
// @desc    Get goal progress
// @access  Private
router.get('/:id/progress', asyncHandler(async (req, res) => {
  const progress = await Progress.findOne({
    goal: req.params.id,
    user: req.user._id
  });

  if (!progress) {
    return res.status(404).json({
      success: false,
      message: 'Progress not found'
    });
  }

  res.json({
    success: true,
    data: { progress }
  });
}));

// Helper function to generate AI breakdown (OpenAI with fallback)
async function generateAIBreakdown(goalData) {
  // 1) Try Ollama first if configured
  if (process.env.OLLAMA_BASE_URL && process.env.OLLAMA_MODEL) {
    try {
      const base = process.env.OLLAMA_BASE_URL.replace(/\/$/, '')
      const model = process.env.OLLAMA_MODEL
      const system = 'You are an expert learning-path planner. Always output strict minified JSON matching the schema.'
      const user = `Create an AI learning breakdown for a goal.\nGoal title: ${goalData.title}\nCategory: ${goalData.category}\nEstimated duration: ${goalData.estimatedDuration?.value || ''} ${goalData.estimatedDuration?.unit || ''}\nReturn JSON with keys: suggestedTimeline, learningPath, keySkills, prerequisites, successMetrics.`
      const resp = await fetch(`${base}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
          stream: false,
        }),
      })
      if (resp.ok) {
        const data = await resp.json()
        const content = data?.message?.content || data?.choices?.[0]?.message?.content || '{}'
        const jsonStr = content.trim().startsWith('{') ? content : content.replace(/^[^\{]*\{/s, '{').replace(/\}[^\}]*$/s, '}')
        const parsed = JSON.parse(jsonStr)
        return {
          suggestedTimeline: String(parsed.suggestedTimeline || `${goalData.estimatedDuration?.value || ''} ${goalData.estimatedDuration?.unit || ''}`).trim(),
          learningPath: parsed.learningPath || 'Customized learning path based on your goal',
          keySkills: Array.isArray(parsed.keySkills) ? parsed.keySkills.slice(0, 12) : ['Skill 1', 'Skill 2'],
          prerequisites: Array.isArray(parsed.prerequisites) ? parsed.prerequisites.slice(0, 8) : ['Basic knowledge in the field'],
          successMetrics: Array.isArray(parsed.successMetrics) ? parsed.successMetrics.slice(0, 8) : ['Complete all milestones'],
        }
      } else {
        console.warn('Ollama breakdown error:', resp.status, await resp.text())
      }
    } catch (e) {
      console.warn('Ollama breakdown failed, fallback to OpenAI/static:', e?.message)
    }
  }

  if (openai) {
    try {
      const system = 'You are an expert learning-path planner. Always output strict minified JSON matching the schema.'
      const schema = {
        suggestedTimeline: 'string (e.g., "12 weeks" or "3 months")',
        learningPath: 'string sequence (e.g., "Topic A → Topic B → Topic C")',
        keySkills: ['string'],
        prerequisites: ['string'],
        successMetrics: ['string'],
      }
      const user = `Create an AI learning breakdown for a goal.\nGoal title: ${goalData.title}\nCategory: ${goalData.category}\nEstimated duration: ${goalData.estimatedDuration?.value || ''} ${goalData.estimatedDuration?.unit || ''}\nReturn JSON with keys: ${Object.keys(schema).join(', ')}.`
      const resp = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        temperature: 0.4,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      });
      const content = resp.choices?.[0]?.message?.content || '{}'
      const jsonStr = content.trim().startsWith('{') ? content : content.replace(/^[^\{]*\{/s, '{').replace(/\}[^\}]*$/s, '}')
      const parsed = JSON.parse(jsonStr)
      // basic normalization
      return {
        suggestedTimeline: String(parsed.suggestedTimeline || `${goalData.estimatedDuration?.value || ''} ${goalData.estimatedDuration?.unit || ''}`).trim(),
        learningPath: parsed.learningPath || 'Customized learning path based on your goal',
        keySkills: Array.isArray(parsed.keySkills) ? parsed.keySkills.slice(0, 12) : ['Skill 1', 'Skill 2'],
        prerequisites: Array.isArray(parsed.prerequisites) ? parsed.prerequisites.slice(0, 8) : ['Basic knowledge in the field'],
        successMetrics: Array.isArray(parsed.successMetrics) ? parsed.successMetrics.slice(0, 8) : ['Complete all milestones'],
      }
    } catch (e) {
      console.warn('OpenAI breakdown failed, using fallback:', e?.message)
    }
  }

  // Fallback (static)
  const breakdowns = {
    'Learn Machine Learning': {
      suggestedTimeline: '16-20 weeks',
      learningPath: 'Python basics → Statistics → Linear Algebra → ML Algorithms → Deep Learning → Projects',
      keySkills: ['Python', 'Statistics', 'Linear Algebra', 'ML Algorithms', 'Deep Learning', 'Data Analysis'],
      prerequisites: ['Basic programming knowledge', 'High school mathematics'],
      successMetrics: ['Build 3 ML projects', 'Complete Kaggle competition', 'Implement algorithms from scratch']
    },
    'Web Development Mastery': {
      suggestedTimeline: '20-24 weeks',
      learningPath: 'HTML/CSS → JavaScript → React → Node.js → Database → Deployment',
      keySkills: ['HTML', 'CSS', 'JavaScript', 'React', 'Node.js', 'MongoDB', 'Git'],
      prerequisites: ['Basic computer skills', 'Logical thinking'],
      successMetrics: ['Build 5 full-stack applications', 'Deploy applications to cloud', 'Contribute to open source']
    }
  };

  return breakdowns[goalData.title] || {
    suggestedTimeline: `${goalData.estimatedDuration.value} ${goalData.estimatedDuration.unit}`,
    learningPath: 'Customized learning path based on your goal',
    keySkills: ['Skill 1', 'Skill 2', 'Skill 3'],
    prerequisites: ['Basic knowledge in the field'],
    successMetrics: ['Complete all milestones', 'Build practical projects', 'Apply knowledge in real scenarios']
  };
}

// Helper function to generate milestones from AI breakdown (OpenAI with fallback)
async function generateMilestonesFromBreakdown(breakdown, goal) {
  // 1) Try Ollama first if configured
  if (process.env.OLLAMA_BASE_URL && process.env.OLLAMA_MODEL) {
    try {
      const base = process.env.OLLAMA_BASE_URL.replace(/\/$/, '')
      const model = process.env.OLLAMA_MODEL
      const system = 'You create milestone plans. Always output strict minified JSON array of 6-10 items.'
      const user = `Create a milestone plan for the goal "${goal.title}".\nTimeline: ${breakdown.suggestedTimeline}.\nLearning path: ${breakdown.learningPath}.\nKey skills: ${(breakdown.keySkills || []).join(', ')}.\nReturn an array of 6-10 milestones. Each item must be an object with keys: title, description, type(one of theory|practice|project|assessment), estimatedDuration(number of hours), order(index starting at 0), learningObjectives(array of strings), assessmentCriteria(array of strings).`
      const resp = await fetch(`${base}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
          stream: false,
        }),
      })
      if (resp.ok) {
        const data = await resp.json()
        const content = data?.message?.content || data?.choices?.[0]?.message?.content || '[]'
        const jsonStr = content.trim().startsWith('[') ? content : content.replace(/^[^\[]*\[/s, '[').replace(/\][^\]]*$/s, ']')
        const parsed = JSON.parse(jsonStr)
        if (Array.isArray(parsed) && parsed.length) {
          return parsed.map((m, idx) => ({
            title: String(m.title || `Milestone ${idx + 1}`),
            description: String(m.description || 'Learn and practice'),
            type: ['theory', 'practice', 'project', 'assessment'].includes(m.type) ? m.type : 'theory',
            estimatedDuration: Number.isFinite(m.estimatedDuration) ? Math.max(1, Math.floor(m.estimatedDuration)) : 8,
            order: Number.isFinite(m.order) ? m.order : idx,
            learningObjectives: Array.isArray(m.learningObjectives) ? m.learningObjectives : [],
            assessmentCriteria: Array.isArray(m.assessmentCriteria) ? m.assessmentCriteria : [],
          }))
        }
      } else {
        console.warn('Ollama milestones error:', resp.status, await resp.text())
      }
    } catch (e) {
      console.warn('Ollama milestones failed, fallback to OpenAI/static:', e?.message)
    }
  }

  if (openai) {
    try {
      const system = 'You create milestone plans. Always output strict minified JSON array of 6-10 items.'
      const user = `Create a milestone plan for the goal "${goal.title}".\nTimeline: ${breakdown.suggestedTimeline}.\nLearning path: ${breakdown.learningPath}.\nKey skills: ${(breakdown.keySkills || []).join(', ')}.\nReturn an array of 6-10 milestones. Each item must be an object with keys: title, description, type(one of theory|practice|project|assessment), estimatedDuration(number of hours), order(index starting at 0), learningObjectives(array of strings), assessmentCriteria(array of strings).`
      const resp = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        temperature: 0.5,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      });
      const content = resp.choices?.[0]?.message?.content || '[]'
      const jsonStr = content.trim().startsWith('[') ? content : content.replace(/^[^\[]*\[/s, '[').replace(/\][^\]]*$/s, ']')
      const parsed = JSON.parse(jsonStr)
      if (Array.isArray(parsed) && parsed.length) {
        return parsed.map((m, idx) => ({
          title: String(m.title || `Milestone ${idx + 1}`),
          description: String(m.description || 'Learn and practice'),
          type: ['theory', 'practice', 'project', 'assessment'].includes(m.type) ? m.type : 'theory',
          estimatedDuration: Number.isFinite(m.estimatedDuration) ? Math.max(1, Math.floor(m.estimatedDuration)) : 8,
          order: Number.isFinite(m.order) ? m.order : idx,
          learningObjectives: Array.isArray(m.learningObjectives) ? m.learningObjectives : [],
          assessmentCriteria: Array.isArray(m.assessmentCriteria) ? m.assessmentCriteria : [],
        }))
      }
    } catch (e) {
      console.warn('OpenAI milestones failed, using fallback:', e?.message)
    }
  }

  // Fallback: derive from skills list
  const skills = breakdown.keySkills || [];
  const milestones = [];
  skills.forEach((skill, index) => {
    milestones.push({
      title: `Learn ${skill}`,
      description: `Master the fundamentals of ${skill} and apply it practically`,
      type: index < skills.length / 2 ? 'theory' : 'practice',
      estimatedDuration: Math.max(8, Math.floor(168 / Math.max(1, skills.length))),
      order: index,
      learningObjectives: [`Understand ${skill} concepts`, `Apply ${skill} in practice`, `Build ${skill} project`],
      assessmentCriteria: [`Complete ${skill} exercises`, `Build ${skill} project`, `Pass ${skill} assessment`]
    });
  });
  return milestones;
}

// Helper function to calculate next check-in date
function calculateNextCheckin(frequency) {
  const frequencies = {
    daily: 1,
    weekly: 7,
    'bi-weekly': 14,
    monthly: 30
  };

  const daysToAdd = frequencies[frequency] || 7;
  const nextCheckin = new Date();
  nextCheckin.setDate(nextCheckin.getDate() + daysToAdd);
  
  return nextCheckin;
}

module.exports = router;
