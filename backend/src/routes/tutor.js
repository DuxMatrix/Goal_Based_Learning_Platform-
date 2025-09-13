const express = require('express');
const { body, validationResult } = require('express-validator');
const TutorSession = require('../models/TutorSession');
const Goal = require('../models/Goal');
const { asyncHandler } = require('../middleware/errorHandler');
const OpenAI = require('openai');
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
const fetch = require('node-fetch');

const router = express.Router();

// @route   GET /api/tutor/sessions
// @desc    Get user's tutor sessions
// @access  Private
router.get('/sessions', asyncHandler(async (req, res) => {
  const { goalId, status, page = 1, limit = 10 } = req.query;
  
  const query = { user: req.user._id };
  
  if (goalId) {
    query.goal = goalId;
  }
  
  if (status) {
    query.status = status;
  }

  const sessions = await TutorSession.find(query)
    .populate('goal', 'title description')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await TutorSession.countDocuments(query);

  res.json({
    success: true,
    data: {
      sessions,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    }
  });
}));

// @route   GET /api/tutor/sessions/:id
// @desc    Get single tutor session
// @access  Private
router.get('/sessions/:id', asyncHandler(async (req, res) => {
  const session = await TutorSession.findOne({
    _id: req.params.id,
    user: req.user._id
  }).populate('goal', 'title description');

  if (!session) {
    return res.status(404).json({
      success: false,
      message: 'Session not found'
    });
  }

  res.json({
    success: true,
    data: { session }
  });
}));

// @route   POST /api/tutor/sessions
// @desc    Create new tutor session
// @access  Private
router.post('/sessions', [
  body('goalId').isMongoId().withMessage('Valid goal ID is required'),
  body('title').trim().isLength({ min: 3, max: 100 }).withMessage('Title is required'),
  body('focusArea').trim().isLength({ min: 3, max: 100 }).withMessage('Focus area is required'),
  body('sessionType').optional().isIn(['theory', 'practice', 'qna', 'review', 'planning']).withMessage('Invalid session type')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { goalId, title, description, focusArea, sessionType, learningObjectives, difficulty } = req.body;

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

  const session = new TutorSession({
    user: req.user._id,
    goal: goalId,
    title,
    description,
    focusArea,
    sessionType: sessionType || 'theory',
    learningObjectives: learningObjectives || [],
    difficulty: difficulty || 'beginner'
  });

  await session.save();

  res.status(201).json({
    success: true,
    message: 'Session created successfully',
    data: { session }
  });
}));

// @route   POST /api/tutor/sessions/:id/messages
// @desc    Add message to session
// @access  Private
router.post('/sessions/:id/messages', [
  body('role').isIn(['user', 'assistant']).withMessage('Valid role is required'),
  body('content').trim().isLength({ min: 1, max: 2000 }).withMessage('Message content is required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const session = await TutorSession.findOne({
    _id: req.params.id,
    user: req.user._id
  });

  if (!session) {
    return res.status(404).json({
      success: false,
      message: 'Session not found'
    });
  }

  const { role, content, messageType, context } = req.body;

  const messageData = {
    role,
    content,
    metadata: {
      messageType: messageType || 'text',
      context: context || {}
    }
  };

  await session.addMessage(messageData);

  // If this is a user message, generate AI response
  if (role === 'user') {
    const aiResponse = await generateAIResponse(content, session, context);
    
    if (aiResponse) {
      await session.addMessage({
        role: 'assistant',
        content: aiResponse.content,
        metadata: {
          messageType: aiResponse.type,
          context: aiResponse.context
        }
      });
    }
  }

  res.json({
    success: true,
    message: 'Message added successfully',
    data: { session }
  });
}));

// @route   PUT /api/tutor/sessions/:id/end
// @desc    End tutor session
// @access  Private
router.put('/sessions/:id/end', asyncHandler(async (req, res) => {
  const session = await TutorSession.findOne({
    _id: req.params.id,
    user: req.user._id
  });

  if (!session) {
    return res.status(404).json({
      success: false,
      message: 'Session not found'
    });
  }

  if (session.status === 'completed') {
    return res.status(400).json({
      success: false,
      message: 'Session already completed'
    });
  }

  await session.endSession();
  
  // Generate summary
  await session.generateSummary();

  res.json({
    success: true,
    message: 'Session ended successfully',
    data: { session }
  });
}));

// @route   POST /api/tutor/sessions/:id/feedback
// @desc    Add feedback to session
// @access  Private
router.post('/sessions/:id/feedback', [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comments').optional().trim().isLength({ max: 500 }).withMessage('Comments cannot exceed 500 characters')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const session = await TutorSession.findOne({
    _id: req.params.id,
    user: req.user._id
  });

  if (!session) {
    return res.status(404).json({
      success: false,
      message: 'Session not found'
    });
  }

  const { rating, comments } = req.body;

  await session.addFeedback(rating, comments);

  res.json({
    success: true,
    message: 'Feedback added successfully',
    data: { session }
  });
}));

// @route   GET /api/tutor/stats
// @desc    Get tutor session statistics
// @access  Private
router.get('/stats', asyncHandler(async (req, res) => {
  const stats = await TutorSession.getUserStats(req.user._id);

  res.json({
    success: true,
    data: { stats }
  });
}));

// @route   POST /api/tutor/chat
// @desc    Quick chat with AI tutor
// @access  Private
router.post('/chat', [
  body('message').trim().isLength({ min: 1, max: 1000 }).withMessage('Message is required'),
  body('goalId').optional().isMongoId().withMessage('Valid goal ID is required'),
  body('context').optional().isObject().withMessage('Context must be an object')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { message, goalId, context } = req.body;

  // Get goal context if provided
  let goal = null;
  if (goalId) {
    goal = await Goal.findOne({
      _id: goalId,
      user: req.user._id
    });
  }

  // Generate AI response
  const aiResponse = await generateAIResponse(message, { goal, user: req.user }, context);

  res.json({
    success: true,
    data: {
      response: aiResponse.content,
      type: aiResponse.type,
      context: aiResponse.context
    }
  });
}));

// Helper function to generate AI response (OpenAI with fallback)
async function generateAIResponse(userMessage, session, context) {
  // 1) Try Ollama first if configured
  if (process.env.OLLAMA_BASE_URL && process.env.OLLAMA_MODEL) {
    try {
      const base = process.env.OLLAMA_BASE_URL.replace(/\/$/, '')
      const model = process.env.OLLAMA_MODEL
      const systemPrompt = [
        'You are an expert, supportive AI learning tutor.',
        'Provide clear, accurate, concise answers in 3-8 sentences by default.',
        'When users ask conceptual questions, explain with a short example.',
        'When appropriate, end with one follow-up question to keep the conversation going.',
        session?.goal ? `User goal: ${session.goal.title || ''} — ${session.goal.description || ''}` : '',
      ].filter(Boolean).join('\n')

      const resp = await fetch(`${base}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
          stream: false,
        }),
      })
      if (resp.ok) {
        const data = await resp.json()
        const content = data?.message?.content || data?.choices?.[0]?.message?.content || ''
        if (content) return { content, type: 'explanation', context: { provider: 'ollama' } }
      } else {
        console.warn('Ollama chat error:', resp.status, await resp.text())
      }
    } catch (e) {
      console.warn('Ollama chat failed, falling back:', e?.message)
    }
  }

  // 2) Try OpenAI if available
  if (openai) {
    try {
      const goal = session?.goal;
      const user = session?.user;
      const systemPrompt = [
        'You are an expert, supportive AI learning tutor.',
        'Provide clear, accurate, concise answers in 3-8 sentences by default.',
        'When users ask conceptual questions, explain with a short example.',
        'When appropriate, end with one follow-up question to keep the conversation going.',
        goal ? `User goal: ${goal.title || ''} — ${goal.description || ''}` : '',
      ].filter(Boolean).join('\n');

      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ];

      const resp = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        temperature: 0.4,
        messages,
      });

      const content = resp.choices?.[0]?.message?.content?.trim() || '';
      if (content) {
        return { content, type: 'explanation', context: { goalId: goal?._id || null } };
      }
    } catch (e) {
      console.warn('OpenAI tutor chat failed, falling back:', e?.message);
    }
  }

  // Fallback simple keyword-based responses
  const responses = {
    'hello': {
      content: 'Hello! I\'m your AI tutor. I\'m here to help you learn and achieve your goals. What would you like to work on today?',
      type: 'text',
      context: {}
    },
    'help': {
      content: 'I can help you with:\n- Explaining concepts and theories\n- Answering questions about your learning goals\n- Providing practice problems\n- Giving feedback on your progress\n- Suggesting next steps\n\nWhat specific topic would you like help with?',
      type: 'explanation',
      context: {}
    },
    'progress': {
      content: 'Let me help you track your progress. Based on your current goals, I can see you\'re making good progress. Would you like me to:\n- Review your recent achievements\n- Suggest areas for improvement\n- Plan your next learning steps\n\nWhat would be most helpful right now?',
      type: 'feedback',
      context: {}
    }
  };

  const lowerMessage = userMessage.toLowerCase();
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) return responses.hello;
  if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) return responses.help;
  if (lowerMessage.includes('progress') || lowerMessage.includes('how am i doing')) return responses.progress;
  return {
    content: `That's a great question about "${userMessage}". Let me help you understand this better. Could you provide more context about what specific aspect you'd like to explore?`,
    type: 'question',
    context: { topic: userMessage }
  };
}

// @route   GET /api/tutor/sessions/:id/summary
// @desc    Get session summary
// @access  Private
router.get('/sessions/:id/summary', asyncHandler(async (req, res) => {
  const session = await TutorSession.findOne({
    _id: req.params.id,
    user: req.user._id
  }).populate('goal', 'title description');

  if (!session) {
    return res.status(404).json({
      success: false,
      message: 'Session not found'
    });
  }

  // Generate summary if it doesn't exist
  if (!session.summary || !session.summary.generatedAt) {
    await session.generateSummary();
  }

  res.json({
    success: true,
    data: {
      session: {
        id: session._id,
        title: session.title,
        focusArea: session.focusArea,
        duration: session.duration,
        status: session.status
      },
      summary: session.summary
    }
  });
}));

// @route   POST /api/tutor/sessions/:id/regenerate-summary
// @desc    Regenerate session summary
// @access  Private
router.post('/sessions/:id/regenerate-summary', asyncHandler(async (req, res) => {
  const session = await TutorSession.findOne({
    _id: req.params.id,
    user: req.user._id
  });

  if (!session) {
    return res.status(404).json({
      success: false,
      message: 'Session not found'
    });
  }

  // Regenerate summary
  await session.generateSummary();

  res.json({
    success: true,
    message: 'Summary regenerated successfully',
    data: { summary: session.summary }
  });
}));

// @route   GET /api/tutor/sessions/summaries
// @desc    Get all session summaries for user
// @access  Private
router.get('/sessions/summaries', asyncHandler(async (req, res) => {
  const { limit = 10, page = 1 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const sessions = await TutorSession.find({
    user: req.user._id,
    status: 'completed',
    'summary.generatedAt': { $exists: true }
  })
  .populate('goal', 'title description')
  .select('title focusArea duration summary status createdAt')
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(parseInt(limit));

  const total = await TutorSession.countDocuments({
    user: req.user._id,
    status: 'completed',
    'summary.generatedAt': { $exists: true }
  });

  res.json({
    success: true,
    data: {
      sessions,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        count: sessions.length,
        totalCount: total
      }
    }
  });
}));

module.exports = router;
