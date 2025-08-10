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

Visit `http://localhost:3000` to see the application.

## 🏗 Project Structure

```
healthshift/
├── app/                    # Next.js 13 app directory
│   ├── dashboard/         # Dashboard pages
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx          # Home page
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── AnalyticsDashboard.tsx
│   ├── LocationSetter.tsx
│   ├── ManagerDashboard.tsx
│   ├── StaffStatusTable.tsx
│   └── WorkerDashboard.tsx
├── lib/                   # Utilities and configurations
│   ├── graphql/          # GraphQL schema and resolvers
│   ├── apollo-client.ts  # Apollo client setup
│   ├── prisma.ts         # Prisma client
│   └── utils.ts          # Utility functions
├── pages/api/            # API routes
│   └── graphql.ts        # GraphQL endpoint
├── prisma/               # Database schema and migrations
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Database seeding
└── public/               # Static assets
    ├── icons/            # PWA icons
    ├── manifest.json     # PWA manifest
    └── sw.js            # Service worker
```

## 🎨 Design System

### Color Palette
- **Primary**: Blue (#0ea5e9) - Trust, reliability
- **Secondary**: Green (#10b981) - Health, growth
- **Accent**: Amber (#f59e0b) - Attention, warnings
- **Success**: Green (#10b981) - Positive actions
- **Error**: Red (#ef4444) - Errors, alerts

### Typography
- **Font**: Inter (Google Fonts)
- **Weights**: 300, 400, 500, 600, 700, 800
- **Scale**: Responsive typography with proper line heights

### Animations
- **Fade In**: Smooth content loading
- **Slide In**: Directional content entrance
- **Scale In**: Interactive element feedback
- **Hover Effects**: Subtle lift and shadow changes
- **Loading States**: Skeleton screens and spinners

## 🔐 Security Features

- **Authentication**: Secure Auth0 integration
- **Authorization**: Role-based access control
- **Location Verification**: GPS-based clock-in validation
- **Data Protection**: HIPAA-compliant data handling
- **API Security**: GraphQL with authentication middleware

## 📱 PWA Features

- **Offline Support**: Service worker caching
- **Install Prompt**: Add to home screen
- **Push Notifications**: Location-based reminders
- **Background Sync**: Offline clock-in/out sync
- **Responsive Design**: Mobile-first approach

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Netlify

1. Build command: `npm run build`
2. Publish directory: `.next`
3. Add environment variables
4. Enable form handling for contact forms

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 📊 Monitoring

- **Analytics**: Built-in shift analytics and reporting
- **Error Tracking**: Integrated error boundaries
- **Performance**: Web Vitals monitoring
- **Uptime**: Health check endpoints

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- **Documentation**: Check the `/docs` folder
- **Issues**: Create GitHub issues for bugs
- **Discussions**: Use GitHub discussions for questions
- **Email**: support@healthshift.com

## 🔄 Changelog

### v1.0.0 (Current)
- Initial release with core features
- Modern UI with animations
- PWA support
- Auth0 integration
- Google Maps integration
- Real-time analytics

---

Built with ❤️ for healthcare professionals worldwide.