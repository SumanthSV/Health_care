# HealthShift - Healthcare Staff Management System

A modern, production-ready healthcare staff management application with location-based clock-in/out, real-time tracking, and comprehensive analytics.

## 🚀 Features

### Core Functionality
- **Smart Clock In/Out**: Location-based clock-in system with geofencing
- **Real-time Tracking**: Monitor staff activity and shift status in real-time
- **Location Management**: Set custom work perimeters with Google Maps integration
- **Comprehensive Analytics**: Detailed reporting and insights
- **Role-based Access**: Separate dashboards for managers and care workers

### Technical Features
- **Modern UI/UX**: Beautiful, animated interface with healthcare-focused design
- **PWA Support**: Works offline with service worker caching
- **Mobile Responsive**: Optimized for all device sizes
- **Real-time Updates**: GraphQL subscriptions for live data
- **Secure Authentication**: Auth0 integration with role-based access
- **Database**: PostgreSQL with Prisma ORM
- **Type Safety**: Full TypeScript implementation

## 🛠 Tech Stack

- **Frontend**: Next.js 13, React 18, TypeScript
- **UI Framework**: Ant Design + Tailwind CSS
- **Authentication**: Auth0
- **Database**: PostgreSQL + Prisma
- **API**: GraphQL with Apollo
- **Maps**: Google Maps API
- **Deployment**: Vercel/Netlify ready
- **PWA**: Next-PWA for offline support

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Auth0 account
- Google Maps API key

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd healthshift
npm install
```

### 2. Environment Setup

Copy `.env.local.example` to `.env.local` and configure:

```env
# Auth0 Configuration
AUTH0_SECRET='your-32-byte-secret'
AUTH0_BASE_URL='http://localhost:3000'
AUTH0_ISSUER_BASE_URL='https://your-domain.auth0.com'
AUTH0_CLIENT_ID='your-auth0-client-id'
AUTH0_CLIENT_SECRET='your-auth0-client-secret'

# Database
DATABASE_URL="postgresql://username:password@localhost:5432/healthshift"

# Google Maps API Key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your-google-maps-api-key"
```

### 3. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed with sample data
npm run db:seed
```

### 4. Auth0 Configuration

1. Create an Auth0 application
2. Set callback URLs:
   - `http://localhost:3000/api/auth/callback`
   - `https://yourdomain.com/api/auth/callback`
3. Set logout URLs:
   - `http://localhost:3000`
   - `https://yourdomain.com`
4. Enable email/password authentication

### 5. Google Maps Setup

1. Enable Google Maps JavaScript API
2. Create API key with appropriate restrictions
3. Add to environment variables

### 6. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3001` to see the application.

### Docker

```dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files first for caching
COPY package*.json ./

# Install dependencies ignoring peer dependency conflicts
RUN npm ci --only=production --legacy-peer-deps

# Copy the rest of the app
COPY . .

# Build the app
RUN npm run build

# Expose port and run the app
EXPOSE 3000
CMD ["npm", "start"]

```