// API configuration and utility functions
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Types
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  preferences: {
    checkinFrequency: 'daily' | 'weekly' | 'bi-weekly' | 'monthly';
    timezone: string;
    notifications: {
      email: boolean;
      push: boolean;
    };
    learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
  };
  isEmailVerified: boolean;
  lastLogin: string;
  createdAt: string;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  estimatedDuration: {
    value: number;
    unit: 'weeks' | 'months';
  };
  status: 'planning' | 'active' | 'paused' | 'completed' | 'cancelled';
  progress: number;
  milestones: Milestone[];
  aiBreakdown?: {
    suggestedTimeline: string;
    learningPath: string;
    keySkills: string[];
    prerequisites: string[];
    successMetrics: string[];
  };
  checkinSchedule: {
    frequency: string;
    nextCheckin: string;
    lastCheckin?: string;
  };
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  type: 'theory' | 'practice' | 'project' | 'assessment';
  estimatedDuration: number;
  order: number;
  isCompleted: boolean;
  completedAt?: string;
  learningObjectives: string[];
  assessmentCriteria: string[];
}

export interface Checkin {
  id: string;
  type: 'scheduled' | 'manual' | 'reminder';
  status: 'pending' | 'completed' | 'missed';
  responses?: {
    progressRating: number;
    timeSpent: number;
    challenges: string[];
    achievements: string[];
    nextSteps: string[];
    notes?: string;
    mood: 'excited' | 'motivated' | 'neutral' | 'frustrated' | 'overwhelmed';
  };
  scheduledFor: string;
  completedAt?: string;
  goal: {
    id: string;
    title: string;
    description: string;
  };
}

export interface TutorSession {
  id: string;
  title: string;
  description?: string;
  status: 'active' | 'completed' | 'paused';
  messages: Message[];
  sessionType: 'theory' | 'practice' | 'qna' | 'review' | 'planning';
  focusArea: string;
  learningObjectives: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: {
    startTime: string;
    endTime?: string;
    totalMinutes: number;
  };
  feedback?: {
    userRating?: number;
    userComments?: string;
  };
  goal: {
    id: string;
    title: string;
    description: string;
  };
  createdAt: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata: {
    messageType: 'text' | 'question' | 'explanation' | 'example' | 'exercise' | 'feedback';
    context?: any;
  };
}

export interface Progress {
  id: string;
  entries: ProgressEntry[];
  metrics: {
    totalStudyTime: number;
    averageSessionDuration: number;
    consistencyScore: number;
    learningVelocity: number;
    streak: {
      current: number;
      longest: number;
      lastActivity?: string;
    };
  };
  weeklyGoals: WeeklyGoal[];
  insights: Insight[];
  goal: {
    id: string;
    title: string;
    description: string;
  };
}

export interface ProgressEntry {
  id: string;
  date: string;
  type: 'study' | 'practice' | 'checkin' | 'tutor' | 'milestone';
  value: number;
  unit: 'minutes' | 'hours' | 'percent' | 'count';
  description?: string;
}

export interface WeeklyGoal {
  week: string;
  targetHours: number;
  actualHours: number;
  completed: boolean;
}

export interface Insight {
  id: string;
  type: 'achievement' | 'warning' | 'suggestion' | 'milestone';
  title: string;
  description: string;
  data?: any;
  createdAt: string;
}

// API Response types
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: any[];
}

// Auth token management
class AuthManager {
  private static TOKEN_KEY = 'auth_token';
  private static USER_KEY = 'user_data';

  static setToken(token: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.TOKEN_KEY, token);
    }
  }

  static getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(this.TOKEN_KEY);
    }
    return null;
  }

  static removeToken() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
    }
  }

  static setUser(user: User) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    }
  }

  static getUser(): User | null {
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem(this.USER_KEY);
      return userData ? JSON.parse(userData) : null;
    }
    return null;
  }
}

// API client class
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = AuthManager.getToken();
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth endpoints
  async register(userData: {
    name: string;
    email: string;
    password: string;
    preferences?: any;
  }) {
    const response = await this.request<{ user: User; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    if (response.success && response.data) {
      AuthManager.setToken(response.data.token);
      AuthManager.setUser(response.data.user);
    }

    return response;
  }

  async login(credentials: { email: string; password: string }) {
    const response = await this.request<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.success && response.data) {
      AuthManager.setToken(response.data.token);
      AuthManager.setUser(response.data.user);
    }

    return response;
  }

  async logout() {
    const response = await this.request('/auth/logout', {
      method: 'POST',
    });

    AuthManager.removeToken();
    return response;
  }

  async getCurrentUser() {
    return this.request<{ user: User }>('/auth/me');
  }

  // Goal endpoints
  async getGoals(params?: {
    status?: string;
    category?: string;
    page?: number;
    limit?: number;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const queryString = searchParams.toString();
    return this.request<{ goals: Goal[]; pagination: any }>(`/goals${queryString ? `?${queryString}` : ''}`);
  }

  async getGoal(id: string) {
    return this.request<{ goal: Goal }>(`/goals/${id}`);
  }

  async createGoal(goalData: {
    title: string;
    description: string;
    category: string;
    estimatedDuration: { value: number; unit: 'weeks' | 'months' };
    checkinFrequency?: string;
    tags?: string[];
  }) {
    return this.request<{ goal: Goal }>('/goals', {
      method: 'POST',
      body: JSON.stringify(goalData),
    });
  }

  async updateGoal(id: string, updates: Partial<Goal>) {
    return this.request<{ goal: Goal }>(`/goals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteGoal(id: string) {
    return this.request(`/goals/${id}`, {
      method: 'DELETE',
    });
  }

  async addMilestone(goalId: string, milestoneData: {
    title: string;
    description: string;
    estimatedDuration: number;
    type?: string;
    learningObjectives?: string[];
    dependencies?: string[];
  }) {
    return this.request<{ goal: Goal }>(`/goals/${goalId}/milestones`, {
      method: 'POST',
      body: JSON.stringify(milestoneData),
    });
  }

  async updateMilestoneDependencies(goalId: string, milestoneId: string, dependencies: string[]) {
    return this.request<{ milestone: any }>(`/goals/${goalId}/milestones/${milestoneId}/dependencies`, {
      method: 'PUT',
      body: JSON.stringify({ dependencies }),
    });
  }

  async completeMilestone(goalId: string, milestoneId: string) {
    return this.request<{ goal: Goal }>(`/goals/${goalId}/milestones/${milestoneId}`, {
      method: 'PUT',
    });
  }

  // Check-in endpoints
  async getCheckins(params?: {
    status?: string;
    goalId?: string;
    page?: number;
    limit?: number;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const queryString = searchParams.toString();
    return this.request<{ checkins: Checkin[]; pagination: any }>(`/checkins${queryString ? `?${queryString}` : ''}`);
  }


  async completeCheckin(id: string, responses: {
    progressRating: number;
    timeSpent: number;
    mood: string;
    challenges?: string[];
    achievements?: string[];
    nextSteps?: string[];
    notes?: string;
  }) {
    return this.request<{ checkin: Checkin }>(`/checkins/${id}/complete`, {
      method: 'PUT',
      body: JSON.stringify(responses),
    });
  }

  async getUpcomingCheckins() {
    return this.request<{ upcomingCheckins: Checkin[] }>('/checkins/upcoming');
  }

  // Tutor endpoints
  async getTutorSessions(params?: {
    goalId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const queryString = searchParams.toString();
    return this.request<{ sessions: TutorSession[]; pagination: any }>(`/tutor/sessions${queryString ? `?${queryString}` : ''}`);
  }

  async createTutorSession(sessionData: {
    goalId: string;
    title: string;
    focusArea: string;
    sessionType?: string;
    learningObjectives?: string[];
    difficulty?: string;
  }) {
    return this.request<{ session: TutorSession }>('/tutor/sessions', {
      method: 'POST',
      body: JSON.stringify(sessionData),
    });
  }

  async sendMessage(sessionId: string, message: {
    role: 'user' | 'assistant';
    content: string;
    messageType?: string;
    context?: any;
  }) {
    return this.request<{ session: TutorSession }>(`/tutor/sessions/${sessionId}/messages`, {
      method: 'POST',
      body: JSON.stringify(message),
    });
  }

  async endTutorSession(sessionId: string) {
    return this.request<{ session: TutorSession }>(`/tutor/sessions/${sessionId}/end`, {
      method: 'PUT',
    });
  }

  async chatWithTutor(message: {
    message: string;
    goalId?: string;
    context?: any;
  }) {
    return this.request<{ response: string; type: string; context: any }>('/tutor/chat', {
      method: 'POST',
      body: JSON.stringify(message),
    });
  }

  // Progress endpoints
  async getProgress(goalId?: string) {
    const queryString = goalId ? `?goalId=${goalId}` : '';
    return this.request<{ progressData: Progress[] }>(`/progress${queryString}`);
  }

  async getProgressOverview() {
    return this.request<{
      overall: any;
      recentEntries: any[];
      monthlyProgress: any[];
    }>('/progress/overview');
  }

  async addProgressEntry(entryData: {
    goalId: string;
    type: string;
    value: number;
    unit: string;
    description?: string;
    metadata?: any;
  }) {
    return this.request<{ progress: Progress }>('/progress/entries', {
      method: 'POST',
      body: JSON.stringify(entryData),
    });
  }

  async getProgressAnalytics(params?: {
    goalId?: string;
    period?: 'week' | 'month' | 'quarter' | 'year';
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const queryString = searchParams.toString();
    return this.request<any>(`/progress/analytics${queryString ? `?${queryString}` : ''}`);
  }

  async getLearningStreak() {
    return this.request<{
      currentStreak: number;
      longestStreak: number;
      streakHistory: any[];
    }>('/progress/streak');
  }

  // Session Summary endpoints
  async getSessionSummary(sessionId: string) {
    return this.request<{
      session: {
        id: string;
        title: string;
        focusArea: string;
        duration: any;
        status: string;
      };
      summary: {
        keyTopics: string[];
        mainQuestions: string[];
        nextSteps: string[];
        resources: string[];
        learningPoints: string[];
        actionItems: string[];
        conceptsLearned: string[];
        areasForImprovement: string[];
        confidenceLevel: number;
        sessionRating: number;
        generatedAt: string;
      };
    }>(`/tutor/sessions/${sessionId}/summary`);
  }

  async regenerateSessionSummary(sessionId: string) {
    return this.request<{
      summary: any;
    }>(`/tutor/sessions/${sessionId}/regenerate-summary`, {
      method: 'POST',
    });
  }

  async getSessionSummaries(params?: {
    limit?: number;
    page?: number;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const queryString = searchParams.toString();
    return this.request<{
      sessions: any[];
      pagination: {
        current: number;
        total: number;
        count: number;
        totalCount: number;
      };
    }>(`/tutor/sessions/summaries${queryString ? `?${queryString}` : ''}`);
  }

  async createTutorSession(sessionData: {
    title: string;
    focusArea: string;
    goalId: string;
    messages: any[];
  }) {
    return this.request<{ session: any }>('/tutor/sessions', {
      method: 'POST',
      body: JSON.stringify(sessionData),
    });
  }

  // Notification methods
  async sendCheckinReminder(checkinId: string): Promise<ApiResponse<any>> {
    return this.request(`/checkins/${checkinId}/send-reminder`, {
      method: 'POST',
    });
  }

  async testNotificationService(): Promise<ApiResponse<any>> {
    return this.request('/checkins/notifications/test');
  }

  async getSchedulerStatus(): Promise<ApiResponse<any>> {
    return this.request('/checkins/scheduler/status');
  }

  async restartScheduler(): Promise<ApiResponse<any>> {
    return this.request('/checkins/scheduler/restart', {
      method: 'POST',
    });
  }
}

// Create and export API client instance
export const api = new ApiClient(API_BASE_URL);

// Export auth manager for direct access
export { AuthManager };

// Export types
export type {
  User,
  Goal,
  Milestone,
  Checkin,
  TutorSession,
  Message,
  Progress,
  ProgressEntry,
  WeeklyGoal,
  Insight,
  ApiResponse,
};
