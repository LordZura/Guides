# TourGuideHub - A Complete Tour Guide Marketplace Platform

TourGuideHub is a full-featured web application that connects tourists with local tour guides. Built with React, TypeScript, and Supabase, it provides a comprehensive platform for tour discovery, booking, and management.

## 🌟 Key Features

### For Tourists
- **Tour Discovery**: Browse and search tours by location, language, price, and ratings
- **Advanced Filtering**: Filter by guide rating, language, availability, and tour type
- **Booking System**: Request tours or accept guide offers with integrated payment tracking
- **Review System**: Rate and review completed tours and guides
- **Profile Management**: Create and manage tourist profiles with interests and preferences
- **Real-time Notifications**: Get notified about booking updates and messages

### For Tour Guides  
- **Tour Creation**: Create detailed tours with descriptions, pricing, and availability
- **Tour Templates**: Save and reuse tour templates for efficiency
- **Booking Management**: Accept/decline tour requests and make offers to tourists
- **Profile Showcase**: Build comprehensive guide profiles with experience and specialties
- **Payment Tracking**: Monitor earnings and payment status
- **Dashboard Analytics**: View bookings, reviews, and performance metrics

### Platform Features
- **Dual User Roles**: Separate interfaces and features for guides and tourists
- **Real-time Chat**: Communication system between guides and tourists
- **Multi-language Support**: Tours and guides can specify multiple languages
- **Rating & Review System**: Comprehensive 5-star rating system with detailed reviews
- **Notification System**: Real-time updates for bookings, messages, and platform events
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Supabase account and project

### Environment Setup
1. Copy the environment template:
```bash
cp .env.example .env.local
```

2. Configure your environment variables in `.env.local`:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Database Setup
This application requires specific database tables and functions. Execute the following SQL migration files in your Supabase SQL Editor **in order**:

#### Core Tables (Execute First)
1. `001_create_profiles.sql` - User profiles table
2. `002_create_tours_table.sql` - Tours table
3. `003_create_bookings_table.sql` - Bookings table
4. `004_create_reviews_table.sql` - Reviews table
5. `005_update_profiles_add_fields.sql` - Profile field updates
6. `006_create_notifications_table.sql` - Notifications table
7. `007_add_tour_locations_array.sql` - Tour locations array
8. `008_create_tour_templates_table.sql` - Tour templates table
9. `009_update_profiles_rls_for_notifications.sql` - Profile RLS updates
10. `010_add_offered_status_to_bookings.sql` - Booking status updates

#### Critical Missing Tables (Execute Next)
11. `011_create_languages_table.sql` - **REQUIRED**: Languages table for filtering
12. `012_fix_bookings_update_policy.sql` - **REQUIRED**: Fixes payment update policies

#### Review System Functions (Execute Last)
13. `013_create_get_review_summary_function.sql` - Review summary function
14. `014_create_get_guide_rating_from_tours_function.sql` - Guide rating function
15. `015_safe_review_fixes_migration.sql` - Review system fixes
16. `016_add_rating_counts_to_summary.sql` - Rating counts for summaries

#### Verification
After running migrations, verify setup with these queries:
```sql
-- Check essential tables exist
SELECT * FROM public.languages LIMIT 5;
SELECT * FROM public.tour_templates LIMIT 5;
SELECT * FROM public.profiles LIMIT 5;

-- Verify table structures
\d public.languages
\d public.tour_templates
```

**⚠️ Important**: All migrations must be executed for the application to function properly. Missing migrations will cause table not found errors and broken functionality.

### Installation & Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173/Guides/`

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Deploy to GitHub Pages (if configured)
npm run deploy
```

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── AuthModal.tsx    # Authentication modal
│   ├── BookingForm.tsx  # Tour booking forms
│   ├── GuideCard.tsx    # Guide profile cards
│   ├── TourCard.tsx     # Tour display cards
│   ├── ReviewForm.tsx   # Review submission
│   └── ...
├── contexts/            # React Context providers
│   ├── AuthProvider.tsx # Authentication state
│   ├── BookingContext.tsx # Booking management
│   ├── ToursContext.tsx  # Tours data
│   └── ...
├── pages/              # Main application pages
│   ├── Dashboard.tsx   # User dashboard
│   ├── Explore.tsx     # Tour/guide discovery
│   ├── TourDetails.tsx # Individual tour pages
│   └── Profile/        # User profile pages
├── hooks/              # Custom React hooks
├── lib/                # Utilities and configuration
│   └── supabaseClient.ts # Supabase client setup
└── db/                 # Database migrations
    └── migrations/     # SQL migration files
```

## 🔧 Core Technologies

- **Frontend**: React 18, TypeScript, Chakra UI
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Build Tool**: Vite
- **Routing**: React Router v6
- **State Management**: React Context + Hooks
- **Styling**: Chakra UI + Emotion
- **Icons**: React Icons, Chakra UI Icons

## 🎯 User Flows

### Tourist Journey
1. Register/Login as Tourist
2. Browse tours on Explore page
3. Filter by preferences (location, language, price)
4. View tour details and guide profiles
5. Request booking or accept guide offer
6. Complete payment
7. Attend tour and leave review

### Guide Journey  
1. Register/Login as Guide
2. Set up comprehensive profile
3. Create tours with details and pricing
4. Manage bookings and availability
5. Communicate with tourists
6. Track payments and earnings
7. Build reputation through reviews

## 🔐 Authentication & Authorization

- Row Level Security (RLS) policies in Supabase
- Role-based access control (Guide vs Tourist)
- Protected routes for authenticated users
- Secure profile and booking data access

## 📱 Pages & Routes

- `/explore` - Main tour and guide discovery (public)
- `/dashboard` - User dashboard (protected)
- `/profile/:id` - User profile pages (public)
- `/tours/:id` - Individual tour details (public)
- `/about` - About page (public)

## 🛠️ Development Notes

- **TypeScript**: Strict type checking enabled
- **Error Boundaries**: Comprehensive error handling
- **Testing**: Unit tests with Vitest and React Testing Library  
- **Linting**: ESLint with TypeScript rules
- **Performance**: Code splitting and optimization
- **Security**: Environment variable protection and RLS policies

## 🚨 Important Setup Requirements

1. **Database Migrations**: Must run all migration files in order
2. **Environment Variables**: Supabase URL and keys are required
3. **RLS Policies**: Database security policies must be properly configured
4. **Language Data**: Seed the languages table for proper filtering
5. **File Uploads**: Configure Supabase storage for profile pictures

## 🌐 Deployment

### GitHub Pages (Recommended)
The application is configured for automatic GitHub Pages deployment:

1. **Configure GitHub Pages**:
   - Go to Repository Settings → Pages
   - Set Source to "GitHub Actions" (not "Deploy from a branch")

2. **Automatic Deployment**:
   - GitHub Actions automatically builds and deploys on every push to main
   - Production builds are optimized and served from `dist/` folder
   - Available at: `https://yourusername.github.io/Guides/`

3. **Manual Deployment** (Alternative):
   ```bash
   npm run deploy
   ```

### Development vs Production
- **Development**: `npm run dev` serves source files at `http://localhost:5173/Guides/`
- **Production**: GitHub Actions builds optimized bundles and deploys to GitHub Pages

### Troubleshooting Deployment
- Ensure GitHub Pages source is set to "GitHub Actions"
- Check Actions tab for deployment status and errors
- Clear browser cache if seeing old version
- Wait a few minutes for CDN updates after deployment

## 📞 Support

For development issues:
1. Check browser console for errors
2. Verify Supabase connection and RLS policies
3. Ensure all database migrations are applied
4. Check environment variable configuration
