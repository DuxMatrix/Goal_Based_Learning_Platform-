const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  metadata: {
    messageType: {
      type: String,
      enum: ['text', 'question', 'explanation', 'example', 'exercise', 'feedback'],
      default: 'text'
    },
    context: {
      goalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Goal'
      },
      milestoneId: {
        type: mongoose.Schema.Types.ObjectId
      },
      topic: String,
      difficulty: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced']
      }
    }
  }
});

const tutorSessionSchema = new mongoose.Schema({
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
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'paused'],
    default: 'active'
  },
  messages: [messageSchema],
  sessionType: {
    type: String,
    enum: ['theory', 'practice', 'qna', 'review', 'planning'],
    default: 'theory'
  },
  focusArea: {
    type: String,
    required: true
  },
  learningObjectives: [String],
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  duration: {
    startTime: {
      type: Date,
      default: Date.now
    },
    endTime: {
      type: Date
    },
    totalMinutes: {
      type: Number,
      default: 0
    }
  },
  feedback: {
    userRating: {
      type: Number,
      min: 1,
      max: 5
    },
    userComments: String,
    aiAssessment: {
      engagement: {
        type: Number,
        min: 1,
        max: 10
      },
      comprehension: {
        type: Number,
        min: 1,
        max: 10
      },
      progress: {
        type: Number,
        min: 1,
        max: 10
      },
      suggestions: [String]
    }
  },
  summary: {
    keyTopics: [String],
    mainQuestions: [String],
    nextSteps: [String],
    resources: [String],
    learningPoints: [String],
    actionItems: [String],
    conceptsLearned: [String],
    areasForImprovement: [String],
    confidenceLevel: {
      type: Number,
      min: 1,
      max: 10
    },
    sessionRating: {
      type: Number,
      min: 1,
      max: 5
    },
    generatedAt: {
      type: Date
    }
  },
  tags: [String],
  isArchived: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for message count
tutorSessionSchema.virtual('messageCount').get(function() {
  return this.messages.length;
});

// Virtual for user message count
tutorSessionSchema.virtual('userMessageCount').get(function() {
  return this.messages.filter(msg => msg.role === 'user').length;
});

// Virtual for assistant message count
tutorSessionSchema.virtual('assistantMessageCount').get(function() {
  return this.messages.filter(msg => msg.role === 'assistant').length;
});

// Virtual for session duration in minutes
tutorSessionSchema.virtual('sessionDurationMinutes').get(function() {
  if (this.duration.endTime) {
    return Math.round((this.duration.endTime - this.duration.startTime) / (1000 * 60));
  }
  return Math.round((new Date() - this.duration.startTime) / (1000 * 60));
});

// Method to add message
tutorSessionSchema.methods.addMessage = function(messageData) {
  const message = {
    ...messageData,
    timestamp: new Date()
  };
  
  this.messages.push(message);
  
  // Update session duration
  this.duration.totalMinutes = this.sessionDurationMinutes;
  
  return this.save();
};

// Method to end session
tutorSessionSchema.methods.endSession = function() {
  this.status = 'completed';
  this.duration.endTime = new Date();
  this.duration.totalMinutes = this.sessionDurationMinutes;
  return this.save();
};

// Method to generate AI-powered summary
tutorSessionSchema.methods.generateSummary = async function() {
  try {
    const userMessages = this.messages.filter(msg => msg.role === 'user');
    const assistantMessages = this.messages.filter(msg => msg.role === 'assistant');
    
    // Prepare conversation context for AI analysis
    const conversationText = this.messages.map(msg => 
      `${msg.role === 'user' ? 'Student' : 'Tutor'}: ${msg.content}`
    ).join('\n\n');
    
    // Generate AI summary using the same AI service as tutor responses
    const aiSummary = await this.generateAISummary(conversationText, userMessages, assistantMessages);
    
    this.summary = {
      keyTopics: aiSummary.keyTopics || [...new Set(userMessages.map(msg => msg.metadata?.context?.topic).filter(Boolean))],
      mainQuestions: aiSummary.mainQuestions || userMessages.filter(msg => msg.metadata?.messageType === 'question').map(msg => msg.content),
      nextSteps: aiSummary.nextSteps || [],
      resources: aiSummary.resources || [],
      learningPoints: aiSummary.learningPoints || [],
      actionItems: aiSummary.actionItems || [],
      conceptsLearned: aiSummary.conceptsLearned || [],
      areasForImprovement: aiSummary.areasForImprovement || [],
      confidenceLevel: aiSummary.confidenceLevel || 5,
      sessionRating: aiSummary.sessionRating || 3,
      generatedAt: new Date()
    };
    
    return this.save();
  } catch (error) {
    console.error('Error generating AI summary:', error);
    
    // Fallback to basic summary if AI fails
    const userMessages = this.messages.filter(msg => msg.role === 'user');
    const assistantMessages = this.messages.filter(msg => msg.role === 'assistant');
    
    this.summary = {
      keyTopics: [...new Set(userMessages.map(msg => msg.metadata?.context?.topic).filter(Boolean))],
      mainQuestions: userMessages.filter(msg => msg.metadata?.messageType === 'question').map(msg => msg.content),
      nextSteps: ['Review session notes', 'Practice concepts discussed'],
      resources: ['Session recording', 'Related materials'],
      learningPoints: ['Key concepts covered in session'],
      actionItems: ['Complete any assigned exercises', 'Review difficult topics'],
      conceptsLearned: ['Topics discussed during session'],
      areasForImprovement: ['Continue practicing', 'Ask questions when unclear'],
      confidenceLevel: 5,
      sessionRating: 3,
      generatedAt: new Date()
    };
    
    return this.save();
  }
};

// Helper method to generate AI summary
tutorSessionSchema.methods.generateAISummary = async function(conversationText, userMessages, assistantMessages) {
  const systemPrompt = `You are an AI learning analytics assistant. Analyze this tutoring session conversation and generate a comprehensive summary.

CONVERSATION:
${conversationText}

Please provide a JSON response with the following structure:
{
  "keyTopics": ["topic1", "topic2", "topic3"],
  "mainQuestions": ["question1", "question2"],
  "nextSteps": ["step1", "step2", "step3"],
  "resources": ["resource1", "resource2"],
  "learningPoints": ["key learning point 1", "key learning point 2"],
  "actionItems": ["action item 1", "action item 2"],
  "conceptsLearned": ["concept1", "concept2"],
  "areasForImprovement": ["area1", "area2"],
  "confidenceLevel": 7,
  "sessionRating": 4
}

Guidelines:
- Extract 3-5 most important topics discussed
- Identify 2-4 key questions the student asked
- Suggest 3-5 concrete next steps for continued learning
- Recommend 2-4 relevant resources (books, videos, exercises)
- Highlight 3-5 key learning points from the session
- Create 2-4 actionable items for the student
- List 3-5 concepts that were learned or reinforced
- Identify 2-3 areas where the student can improve
- Rate confidence level (1-10) based on student's understanding
- Rate session quality (1-5) based on engagement and learning

Return ONLY valid JSON, no additional text.`;

  // Try Ollama first
  if (process.env.OLLAMA_BASE_URL && process.env.OLLAMA_MODEL) {
    try {
      const base = process.env.OLLAMA_BASE_URL.replace(/\/$/, '');
      const model = process.env.OLLAMA_MODEL;
      
      const response = await fetch(`${base}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: 'Please analyze this tutoring session and provide the summary.' }
          ],
          stream: false,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        const content = data?.message?.content || data?.choices?.[0]?.message?.content || '';
        
        if (content) {
          try {
            return JSON.parse(content);
          } catch (parseError) {
            console.warn('Failed to parse Ollama summary response:', parseError);
          }
        }
      }
    } catch (error) {
      console.warn('Ollama summary generation failed:', error.message);
    }
  }

  // Try OpenAI if available
  if (process.env.OPENAI_API_KEY) {
    try {
      const OpenAI = require('openai');
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Please analyze this tutoring session and provide the summary.' }
        ],
        temperature: 0.3,
        max_tokens: 1000,
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        try {
          return JSON.parse(content);
        } catch (parseError) {
          console.warn('Failed to parse OpenAI summary response:', parseError);
        }
      }
    } catch (error) {
      console.warn('OpenAI summary generation failed:', error.message);
    }
  }

  // Fallback: return null to trigger basic summary
  return null;
};

// Method to add feedback
tutorSessionSchema.methods.addFeedback = function(rating, comments) {
  this.feedback = {
    userRating: rating,
    userComments: comments
  };
  return this.save();
};

// Static method to get session statistics
tutorSessionSchema.statics.getUserStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { user: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalSessions: { $sum: 1 },
        totalMessages: { $sum: { $size: '$messages' } },
        totalDuration: { $sum: '$duration.totalMinutes' },
        averageRating: { $avg: '$feedback.userRating' },
        completedSessions: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        }
      }
    }
  ]);
  
  return stats[0] || {
    totalSessions: 0,
    totalMessages: 0,
    totalDuration: 0,
    averageRating: 0,
    completedSessions: 0
  };
};

module.exports = mongoose.model('TutorSession', tutorSessionSchema);
