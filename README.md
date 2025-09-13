# LearnAI - AI-Powered Learning Platform

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/your-repo/learnai)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)

A comprehensive goal achievement platform that helps users break down large objectives into manageable learning journeys with AI-powered tutoring support.

> **Latest Version**: v2.0.0 - Now with theme system, settings page, and enhanced user experience!

## 🚀 Features

### Core Features
- **Authentication System**: Complete user registration/login with JWT tokens
- **Goal Management**: AI-powered goal breakdown into 6-week to 6-month journeys
- **Check-in System**: Flexible progress tracking with customizable frequencies
- **AI Avatar Tutor**: Conversational interface with context-aware responses
- **Progress Tracking**: Comprehensive analytics and learning insights
- **Real-time Features**: WebSocket integration for live tutoring sessions
- **Settings & Customization**: Light/dark mode, notifications, privacy controls
- **Data Management**: Export/import functionality and data backup

### Technical Highlights
- **Frontend**: Next.js 14 with TypeScript and Tailwind CSS
- **Backend**: Node.js with Express and MongoDB
- **Authentication**: JWT-based with bcrypt password hashing
- **Real-time**: Socket.io for live communication
- **AI Integration**: OpenAI API for intelligent tutoring
- **Security**: Helmet, CORS, rate limiting, and input validation
- **Theme System**: Light/dark mode with system preference detection
- **Local Storage**: Client-side data persistence with export capabilities

## 📋 Requirements

### Frontend Requirements
- Node.js 18+ 
- Next.js 14
- TypeScript
- Tailwind CSS
- React Hook Form with Zod validation
- next-themes for theme management
- Lucide React for icons

### Backend Requirements
- Node.js 18+
- MongoDB 6+
- Express.js
- JWT for authentication
- Socket.io for real-time features

## 🛠️ Installation

### Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Configuration**:
   ```bash
   cp env.example .env
   ```
   
   Update `.env` with your configuration:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   
   # Database
   MONGODB_URI=mongodb://localhost:27017/goal-achievement-platform
   
   # JWT Secret
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_EXPIRE=7d
   
   # OpenAI Configuration
   OPENAI_API_KEY=your-openai-api-key-here
   
   # Frontend URL
   CLIENT_URL=http://localhost:3000
   ```

4. **Start MongoDB** (if running locally):
   ```bash
   mongod
   ```

5. **Start the backend server**:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Navigate to project root**:
   ```bash
   cd ..
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Configuration**:
   Create `.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

## 🏗️ Project Structure

```
goal-achievement-platform/
├── backend/
│   ├── src/
│   │   ├── models/          # MongoDB models
│   │   ├── routes/          # API routes
│   │   ├── middleware/      # Custom middleware
│   │   └── server.js        # Main server file
│   ├── package.json
│   └── env.example
├── app/                     # Next.js app directory
│   ├── auth/               # Authentication pages
│   ├── dashboard/          # Dashboard and features
│   │   ├── goals/          # Goal management pages
│   │   ├── schedule/       # Check-in scheduling
│   │   ├── tutor/          # AI tutoring interface
│   │   ├── progress/       # Progress tracking
│   │   ├── sessions/       # Session management
│   │   └── settings/       # User settings
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/                 # Reusable UI components
│   │   ├── advanced-avatar.tsx  # AI avatar with animations
│   │   ├── ai-avatar.tsx        # AI personality system
│   │   ├── calendar-view.tsx    # Calendar component
│   │   └── ...                 # Other UI components
│   ├── auth-guard.tsx      # Authentication guard
│   └── theme-provider.tsx  # Theme management
├── contexts/
│   └── AuthContext.tsx     # Authentication context
├── lib/
│   ├── api.ts              # API client
│   └── utils.ts            # Utility functions
├── hooks/                  # Custom React hooks
├── styles/                 # Additional styles
└── README.md
```

## 📚 API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Goal Management Endpoints

- `GET /api/goals` - Get user's goals
- `POST /api/goals` - Create new goal
- `GET /api/goals/:id` - Get single goal
- `PUT /api/goals/:id` - Update goal
- `DELETE /api/goals/:id` - Delete goal
- `POST /api/goals/:id/milestones` - Add milestone
- `PUT /api/goals/:id/milestones/:milestoneId` - Complete milestone

### Check-in Endpoints

- `GET /api/checkins` - Get user's check-ins
- `POST /api/checkins` - Create manual check-in
- `PUT /api/checkins/:id/complete` - Complete scheduled check-in
- `GET /api/checkins/upcoming` - Get upcoming check-ins
- `GET /api/checkins/overdue` - Get overdue check-ins

### Tutor Endpoints

- `GET /api/tutor/sessions` - Get tutor sessions
- `POST /api/tutor/sessions` - Create new session
- `POST /api/tutor/sessions/:id/messages` - Send message
- `PUT /api/tutor/sessions/:id/end` - End session
- `POST /api/tutor/chat` - Quick chat with AI

### Progress Endpoints

- `GET /api/progress` - Get progress data
- `POST /api/progress/entries` - Add progress entry
- `GET /api/progress/analytics` - Get detailed analytics
- `GET /api/progress/streak` - Get learning streak

## 🆕 Latest Updates (v2.0)

### New Features Added
- **🎨 Theme System**: Complete light/dark mode implementation with system preference detection
- **⚙️ Settings Page**: Comprehensive settings with appearance, notifications, privacy, and data management
- **💾 Data Export**: Backup functionality to export all goals, schedules, and progress data
- **🔧 Enhanced UI**: Improved avatar system with personality-based interactions
- **📱 Responsive Design**: Better mobile and tablet experience
- **🛡️ Privacy Controls**: Granular privacy settings and data sharing preferences

### Technical Improvements
- **Theme Provider**: Integrated next-themes for seamless theme switching
- **Local Storage**: Enhanced data persistence with export/import capabilities
- **Component Architecture**: Modular UI components with better reusability
- **Error Handling**: Improved error handling and user feedback
- **Performance**: Optimized rendering and state management

## 🎯 Sample User Journey

1. **Registration**: New user signs up with email/password
2. **Goal Setting**: "I want to become a data scientist"
3. **AI Breakdown**: System suggests 4-month journey with weekly milestones
4. **Learning Path**: Breaks into modules (Python → Statistics → ML → Projects)
5. **AI Interaction**: User chats with avatar about linear regression theory
6. **Application**: Avatar helps apply concepts to user's specific dataset
7. **Progress Tracking**: System records learning, provides summary and next steps
8. **Customization**: User adjusts theme, notifications, and privacy settings
9. **Data Management**: User exports progress data for backup

## 🔧 Development

### Running Tests
```bash
# Backend tests
cd backend
npm test

# Frontend tests (when implemented)
npm test
```

### Code Quality
- ESLint for code linting
- Prettier for code formatting
- TypeScript for type safety
- Husky for git hooks

### Database Seeding
```bash
cd backend
npm run seed  # (if implemented)
```

## 🚀 Deployment

### Backend Deployment
1. Set up MongoDB Atlas or your preferred MongoDB hosting
2. Configure environment variables in production
3. Deploy to your preferred platform (Heroku, Railway, DigitalOcean, etc.)

### Frontend Deployment
1. Build the application: `npm run build`
2. Deploy to Vercel, Netlify, or your preferred platform
3. Configure environment variables

### Environment Variables for Production
```env
NODE_ENV=production
MONGODB_URI=your-production-mongodb-uri
JWT_SECRET=your-production-jwt-secret
OPENAI_API_KEY=your-openai-api-key
CLIENT_URL=https://your-frontend-domain.com
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenAI for AI capabilities
- Next.js team for the amazing framework
- MongoDB for the database
- Tailwind CSS for styling
- All the open-source contributors

## 📞 Support

For support, email support@example.com or create an issue in the repository.

## 🗺️ Roadmap

### Completed ✅
- [x] Light/dark theme system
- [x] Settings page with comprehensive controls
- [x] Data export/backup functionality
- [x] Enhanced AI avatar system
- [x] Improved UI/UX design
- [x] Local storage optimization

### In Progress 🚧
- [ ] Email verification system
- [ ] Push notifications
- [ ] Advanced analytics dashboard

### Planned 📋
- [ ] Mobile app (React Native)
- [ ] Social learning features
- [ ] Integration with learning platforms
- [ ] Gamification elements
- [ ] Multi-language support
- [ ] Real-time collaboration features
- [ ] Advanced AI tutoring capabilities

---

**Built with ❤️ for the future of education**
