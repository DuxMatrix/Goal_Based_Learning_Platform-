# Deployment Guide - Goal Achievement Platform

This guide covers deploying the Goal Achievement Platform to production environments.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- MongoDB database (Atlas recommended)
- OpenAI API key
- Git repository access

### 1. Backend Deployment

#### Option A: Railway (Recommended)
1. Connect your GitHub repository to Railway
2. Set environment variables:
   ```env
   NODE_ENV=production
   MONGODB_URI=your-mongodb-atlas-uri
   JWT_SECRET=your-super-secret-jwt-key
   OPENAI_API_KEY=your-openai-api-key
   CLIENT_URL=https://your-frontend-domain.com
   PORT=5000
   ```
3. Railway will automatically deploy and provide a backend URL

#### Option B: Heroku
1. Create a new Heroku app
2. Add MongoDB Atlas addon or configure connection string
3. Set environment variables in Heroku dashboard
4. Deploy using Git or GitHub integration

#### Option C: DigitalOcean App Platform
1. Create a new app in DigitalOcean
2. Connect your repository
3. Configure environment variables
4. Deploy

### 2. Frontend Deployment

#### Option A: Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set environment variables:
   ```env
   NEXT_PUBLIC_API_URL=https://your-backend-url.com/api
   ```
3. Deploy automatically on every push

#### Option B: Netlify
1. Connect your repository to Netlify
2. Build command: `npm run build`
3. Publish directory: `.next`
4. Set environment variables in site settings

### 3. Database Setup

#### MongoDB Atlas (Recommended)
1. Create a MongoDB Atlas account
2. Create a new cluster
3. Create a database user
4. Whitelist your server IP addresses
5. Get your connection string

#### Local MongoDB (Development Only)
```bash
# Install MongoDB locally
brew install mongodb-community  # macOS
sudo apt install mongodb        # Ubuntu

# Start MongoDB
brew services start mongodb-community  # macOS
sudo systemctl start mongod            # Ubuntu
```

## 🔧 Environment Configuration

### Backend Environment Variables
```env
# Server Configuration
PORT=5000
NODE_ENV=production

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/goal-achievement-platform

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
JWT_EXPIRE=7d

# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-api-key

# Email Configuration (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Frontend URL
CLIENT_URL=https://your-frontend-domain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Frontend Environment Variables
```env
# API Configuration
NEXT_PUBLIC_API_URL=https://your-backend-domain.com/api

# Analytics (Optional)
NEXT_PUBLIC_GA_ID=your-google-analytics-id
```

## 📊 Production Checklist

### Security
- [ ] Use strong JWT secret (minimum 32 characters)
- [ ] Enable HTTPS for both frontend and backend
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Use environment variables for all secrets
- [ ] Enable MongoDB authentication
- [ ] Set up proper error handling (no stack traces in production)

### Performance
- [ ] Enable gzip compression
- [ ] Set up CDN for static assets
- [ ] Configure proper caching headers
- [ ] Optimize images and assets
- [ ] Set up monitoring and logging

### Monitoring
- [ ] Set up error tracking (Sentry, LogRocket)
- [ ] Configure uptime monitoring
- [ ] Set up performance monitoring
- [ ] Configure log aggregation
- [ ] Set up database monitoring

## 🐳 Docker Deployment (Optional)

### Backend Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 5000

CMD ["npm", "start"]
```

### Frontend Dockerfile
```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

### Docker Compose
```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/goal-achievement-platform
      - JWT_SECRET=your-jwt-secret
    depends_on:
      - mongo

  frontend:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:5000/api

  mongo:
    image: mongo:6
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:
```

## 🔍 Testing in Production

### Health Checks
- Backend: `GET /api/health`
- Frontend: Check if the page loads without errors

### API Testing
```bash
# Test authentication
curl -X POST https://your-api.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Test goal creation
curl -X POST https://your-api.com/api/goals \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Learn React","description":"Master React development","category":"programming"}'
```

## 📈 Scaling Considerations

### Database
- Use MongoDB Atlas for automatic scaling
- Set up database indexes for better performance
- Monitor database performance and optimize queries

### Backend
- Use PM2 for process management
- Set up load balancing for multiple instances
- Implement caching (Redis) for frequently accessed data

### Frontend
- Use CDN for static assets
- Implement service worker for offline functionality
- Optimize bundle size and loading performance

## 🚨 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure CLIENT_URL is set correctly in backend
   - Check if frontend URL matches the configured CORS origin

2. **Database Connection Issues**
   - Verify MongoDB URI format
   - Check network connectivity and firewall rules
   - Ensure database user has proper permissions

3. **JWT Token Issues**
   - Verify JWT_SECRET is set and consistent
   - Check token expiration settings
   - Ensure proper token format in requests

4. **Build Failures**
   - Check Node.js version compatibility
   - Verify all environment variables are set
   - Check for TypeScript errors

### Logs and Debugging
```bash
# Backend logs
heroku logs --tail                    # Heroku
railway logs                          # Railway
docker logs container-name            # Docker

# Frontend logs
vercel logs                           # Vercel
netlify logs                          # Netlify
```

## 📞 Support

For deployment issues:
1. Check the logs for error messages
2. Verify environment variables
3. Test API endpoints individually
4. Check database connectivity
5. Review security configurations

## 🎯 Next Steps

After successful deployment:
1. Set up monitoring and alerting
2. Configure backup strategies
3. Implement CI/CD pipelines
4. Set up staging environment
5. Plan for scaling and optimization

---

**Happy Deploying! 🚀**
