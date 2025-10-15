# TourGuideHub - Complete Rebuild Prompt for AI Development

## Project Overview

You are tasked with building **TourGuideHub**, a production-ready full-stack web application that connects tourists with local tour guides. This is a complete marketplace platform featuring tour discovery, booking management, reviews, payments, and real-time notifications.

## Core Concept & Business Logic

TourGuideHub is a two-sided marketplace where:
- **Tourists** can browse tours, book experiences, leave reviews, and track payments
- **Guides** can create tours (from templates or scratch), manage bookings, track earnings, and build their reputation
- The platform facilitates the entire journey from tour discovery to completion with integrated booking workflows and review systems

## Technology Stack Requirements

### Frontend Stack
- **React 18.2.0** with TypeScript 5.0.2 (strict mode enabled)
- **Chakra UI 2.10.9** for component library and theming
- **Vite 4.4.5** as build tool and dev server
- **React Router DOM 6.18.0** for client-side routing
- **Framer Motion** for animations (required by Chakra UI)
- **React Icons 5.5.0** for icon library
- **React Select 5.10.2** for enhanced select components

### Backend & Database
- **Supabase** (Backend-as-a-Service)
  - PostgreSQL database with Row Level Security (RLS)
  - Built-in authentication with email/password
  - Real-time subscriptions for live notifications
  - Storage for user avatars and media
  - Edge functions (if needed)
- **@supabase/supabase-js 2.38.4** as the client library

### Development Tools
- **TypeScript** with strict type checking
- **ESLint 9.34.0** for code quality
- **Vitest 0.34.6** for testing
- **@testing-library/react** for component testing
- **PostCSS & Autoprefixer** for CSS processing
- **Tailwind CSS** (optional, currently minimal usage)

### Deployment
- **GitHub Pages** deployment via GitHub Actions
- Base path: `/Guides/`
- Static site hosting with SPA routing support

## Application Architecture

### High-Level Architecture
```
┌─────────────────────┐
│   React Frontend    │
│   • TypeScript      │◄────┐
│   • Chakra UI       │     │
│   • Context API     │     │
└─────────────────────┘     │
          ▲                 │
          │                 │
          ▼                 │
┌─────────────────────┐     │
│   Supabase BaaS     │     │
│   • Auth            │     │
│   • Real-time       │     │
│   • Storage         │     │
└─────────────────────┘     │
          ▲                 │
          │                 │
          ▼                 │
┌─────────────────────┐     │
│   PostgreSQL DB     │     │
│   • RLS Policies    │     │
│   • Functions       │     │
│   • Triggers        │─────┘
└─────────────────────┘
```

### Frontend Structure

#### Pages (5 main routes)
1. **Explore** (`/explore`) - Public tour discovery and guide browsing
   - Two tabs: Tours and Guides
   - Advanced filtering (location, language, price, rating, availability)
   - Mobile-responsive grid layout
   - Real-time search and filters

2. **Dashboard** (`/dashboard`) - Role-specific dashboards (protected)
   - **Guide Dashboard**: Manage tours, view bookings, track earnings, analytics
   - **Tourist Dashboard**: View bookings, payment tracking, booking history
   - Different UI based on user role

3. **Tour Details** (`/tours/:id`) - Individual tour page
   - Complete tour information with multiple locations
   - Booking form for tourists
   - Review system with ratings
   - Guide profile preview
   - Image gallery (if implemented)

4. **Profile** (`/profile/:id`) - User profile pages
   - **Guide Profile**: Bio, experience, specialties, languages, all tours, aggregated reviews
   - **Tourist Profile**: Basic info, preferences, review history
   - Public and private views

5. **About** (`/about`) - Static informational page

#### Component Structure (29+ components)

**Authentication & User Management**
- `AuthModal.tsx` - Modal for sign in/sign up with role selection (guide/tourist)
- `ProfileEditor.tsx` - Edit user profile with role-specific fields
- `NavBar.tsx` - Navigation with auth status, notifications, role-based links

**Tour Management**
- `TourCard.tsx` - Display tour with image, rating, price, quick booking
- `TourForm.tsx` - Create/edit tour with validation
- `ToursList.tsx` - Grid of tour cards with loading states
- `TourLocationManager.tsx` - Manage multiple ordered locations per tour
- `TourTemplatePicker.tsx` - Choose from pre-built tour templates
- `SaveAsTemplate.tsx` - Save custom tours as reusable templates

**Booking System**
- `BookingForm.tsx` - Create booking request with date/time/guest selection
- `BookingItem.tsx` - Display individual booking with status
- `BookingsList.tsx` - List all bookings with filters
- `TouristTourRequestForm.tsx` - Tourist-specific booking request form
- `PaymentTracker.tsx` - Track payment status and amounts
- `PaymentModal.tsx` - Handle payment processing (UI only, integration needed)

**Review System**
- `ReviewForm.tsx` - Submit reviews with star rating and comment
- `ReviewItem.tsx` - Display single review with user info
- `ReviewsList.tsx` - List all reviews with pagination
- `ReviewsSummary.tsx` - Aggregate statistics (avg rating, distribution)
- `StarRating.tsx` - Reusable star rating component

**Filters & Search**
- `Filters.tsx` - Comprehensive filter panel for tours/guides
- `RatingFilter.tsx` - Star-based rating filter
- `SearchableLanguageSelector.tsx` - Multi-select language picker with search

**Notifications**
- `NotificationBadge.tsx` - Badge showing unread count
- `NotificationsList.tsx` - Dropdown list of notifications with actions
- Real-time updates via Supabase subscriptions

**Other Components**
- `GuideCard.tsx` - Display guide profile card with rating
- `ErrorBoundary.tsx` - Global error handling
- `ResponsiveTestPage.tsx` - Mobile responsiveness testing (dev only)
- `NotificationTestPanel.tsx` - Test notification system (dev only)

#### State Management (8 React Contexts)

1. **AuthProvider** (`contexts/AuthProvider.tsx`)
   - User authentication state
   - Current user profile
   - Role information (guide/tourist)
   - Sign in, sign up, sign out functions
   - Session persistence

2. **ModalContext** (`contexts/ModalContext.tsx`)
   - Auth modal state
   - Global modal management
   - Open/close handlers

3. **ToursContext** (`contexts/ToursContext.tsx`)
   - Tour data management
   - CRUD operations for tours
   - Tour templates
   - Active tour filtering

4. **BookingContext** (`contexts/BookingContext.tsx`)
   - Booking state management
   - Create/update/cancel bookings
   - Status transitions (requested → offered → accepted → paid → completed)
   - Guide and tourist specific logic

5. **ReviewsContext** (`contexts/ReviewsContext.tsx`)
   - Review submission
   - Review fetching with aggregation
   - Rating calculations
   - Review validation (one review per user per tour/guide)

6. **NotificationContext** (`contexts/NotificationContext.tsx`)
   - Real-time notification subscriptions
   - Notification CRUD
   - Read/unread status
   - Badge count

7. **TourTemplateContext** (`contexts/TourTemplateContext.tsx`)
   - Tour template management
   - System templates (predefined)
   - User templates (saved by guides)
   - Template usage tracking

8. **PaymentStatsContext** (`contexts/PaymentStatsContext.tsx`)
   - Payment tracking
   - Earnings calculations for guides
   - Spending tracking for tourists
   - Financial analytics

### Database Schema (PostgreSQL with Supabase)

#### Core Tables

**1. profiles** (extends Supabase auth.users)
```sql
- id: UUID (references auth.users.id)
- full_name: TEXT NOT NULL
- phone: TEXT
- role: TEXT (CHECK: 'guide' OR 'tourist')
- avatar_url: TEXT
- bio: TEXT
- interests: TEXT
- location: TEXT
- languages: TEXT[] (array of language codes)
- years_experience: INTEGER (guides only)
- specialties: TEXT (guides only)
- created_at: TIMESTAMP WITH TIME ZONE DEFAULT NOW()
- updated_at: TIMESTAMP WITH TIME ZONE DEFAULT NOW()

RLS Policies:
- SELECT: Public can view profiles
- INSERT: Users can insert their own profile on signup
- UPDATE: Users can update their own profile
- Special policy for notification actors
```

**2. tours**
```sql
- id: UUID PRIMARY KEY DEFAULT uuid_generate_v4()
- title: TEXT NOT NULL
- description: TEXT NOT NULL
- location: TEXT (legacy, kept for compatibility)
- locations: JSONB (array of {id, name, notes, order})
- duration: INTEGER (hours)
- price: NUMERIC(10,2)
- capacity: INTEGER
- languages: TEXT[] (supported languages)
- days_available: BOOLEAN[7] (Mon-Sun availability)
- is_private: BOOLEAN DEFAULT FALSE
- is_active: BOOLEAN DEFAULT TRUE
- creator_id: UUID REFERENCES profiles(id)
- creator_role: TEXT
- created_at: TIMESTAMP WITH TIME ZONE DEFAULT NOW()
- updated_at: TIMESTAMP WITH TIME ZONE DEFAULT NOW()

Indexes:
- GIN index on locations JSONB for performance
- creator_id for quick lookup

RLS Policies:
- SELECT: Public can view active tours
- INSERT: Guides can create tours
- UPDATE: Guides can update their own tours
- DELETE: Guides can delete their own tours

Triggers:
- update_updated_at_column() on UPDATE
```

**3. bookings**
```sql
- id: UUID PRIMARY KEY DEFAULT uuid_generate_v4()
- tour_id: UUID REFERENCES tours(id)
- tourist_id: UUID REFERENCES profiles(id)
- guide_id: UUID REFERENCES profiles(id)
- status: TEXT CHECK IN ('requested', 'offered', 'accepted', 'declined', 'paid', 'completed', 'cancelled')
- booking_date: DATE NOT NULL
- booking_time: TIME
- number_of_guests: INTEGER DEFAULT 1
- total_price: NUMERIC(10,2)
- payment_status: TEXT DEFAULT 'pending'
- payment_method: TEXT
- notes: TEXT
- created_at: TIMESTAMP WITH TIME ZONE DEFAULT NOW()
- updated_at: TIMESTAMP WITH TIME ZONE DEFAULT NOW()

Status Flow:
- Tourist creates: 'requested'
- Guide creates offer: 'offered'
- Tourist accepts: 'accepted'
- Payment made: 'paid'
- Tour completed: 'completed'
- Either cancels: 'cancelled'

RLS Policies:
- SELECT: Tourists/guides can view their own bookings
- INSERT: Tourists can request, guides can offer
- UPDATE: 
  - Guides can update their bookings
  - Tourists can accept offered bookings
  - Both can cancel
- DELETE: Only users can delete their own bookings

Triggers:
- update_updated_at_column() on UPDATE
```

**4. reviews**
```sql
- id: UUID PRIMARY KEY DEFAULT uuid_generate_v4()
- reviewer_id: UUID REFERENCES profiles(id)
- target_id: UUID (can be tour_id or guide profile_id)
- target_type: TEXT CHECK IN ('tour', 'guide')
- rating: INTEGER CHECK (rating >= 1 AND rating <= 5)
- comment: TEXT NOT NULL
- tour_id: UUID REFERENCES tours(id) (for context)
- created_at: TIMESTAMP WITH TIME ZONE DEFAULT NOW()
- updated_at: TIMESTAMP WITH TIME ZONE DEFAULT NOW()

Constraints:
- UNIQUE(reviewer_id, target_id, target_type) - one review per user per target

RLS Policies:
- SELECT: Public can view reviews
- INSERT: Authenticated users can create reviews (after completed booking)
- UPDATE: Users can update their own reviews
- DELETE: Users can delete their own reviews
```

**5. notifications**
```sql
- id: UUID PRIMARY KEY DEFAULT uuid_generate_v4()
- recipient_id: UUID REFERENCES profiles(id)
- actor_id: UUID REFERENCES profiles(id)
- type: TEXT NOT NULL (e.g., 'booking_request', 'booking_accepted', 'new_review')
- message: TEXT NOT NULL
- action_url: TEXT
- is_read: BOOLEAN DEFAULT FALSE
- created_at: TIMESTAMP WITH TIME ZONE DEFAULT NOW()

Notification Types:
- booking_request: New booking request
- booking_offered: Guide offers booking
- booking_accepted: Tourist accepts offer
- booking_cancelled: Either party cancels
- new_review: New review received
- payment_received: Payment completed

RLS Policies:
- SELECT: Users can view their own notifications
- INSERT: System/authenticated users can create
- UPDATE: Users can mark their notifications as read
- DELETE: Users can delete their own notifications

Real-time: Subscribed by users for live updates
```

**6. languages**
```sql
- id: UUID PRIMARY KEY DEFAULT uuid_generate_v4()
- code: TEXT UNIQUE NOT NULL (ISO 639-1 code)
- name: TEXT NOT NULL
- native_name: TEXT

Pre-populated with common languages:
- en: English
- es: Spanish
- fr: French
- de: German
- it: Italian
- ja: Japanese
- zh: Chinese
- ru: Russian
- ar: Arabic
- ka: Georgian (for Svaneti tours)

RLS: Public read access
```

**7. tour_templates**
```sql
- id: UUID PRIMARY KEY DEFAULT uuid_generate_v4()
- name: TEXT NOT NULL
- description: TEXT
- template_data: JSONB (complete tour configuration)
- is_system_template: BOOLEAN DEFAULT FALSE
- creator_id: UUID REFERENCES profiles(id) (NULL for system templates)
- category: TEXT
- is_active: BOOLEAN DEFAULT TRUE
- usage_count: INTEGER DEFAULT 0
- created_at: TIMESTAMP WITH TIME ZONE DEFAULT NOW()
- updated_at: TIMESTAMP WITH TIME ZONE DEFAULT NOW()

System Templates Include:
- "Svaneti Mountain Adventure" (3-day mountain tour)
- "City Walking Tour" (basic city tour)
- "Food & Culture Tour" (culinary experience)

template_data structure:
{
  title, description, duration, price, capacity,
  languages: [], days_available: [],
  is_private: false, locations: []
}

RLS Policies:
- SELECT: Public can view active templates
- INSERT: Guides can create custom templates
- UPDATE: Creators can update their templates
- DELETE: Creators can delete their templates
```

#### Database Functions

**1. get_review_summary(target_id UUID, target_type TEXT)**
```sql
Returns: (average_rating NUMERIC, total_reviews INTEGER, rating_counts JSONB)

Purpose: Aggregates reviews for tours OR guides
- For tours: Direct aggregation from reviews table
- For guides: Combines direct guide reviews + all tour reviews
- Returns rating distribution: {1: count, 2: count, ..., 5: count}
- Handles empty result sets gracefully

Used by: Tour cards, guide cards, detail pages
```

**2. get_guide_rating_from_tours(guide_id UUID)**
```sql
Returns: (average_rating NUMERIC, total_reviews INTEGER)

Purpose: Guide-specific rating from their tour reviews only
- Aggregates reviews from all tours created by the guide
- Excludes direct guide reviews
- Used for guide dashboard analytics

Used by: Guide analytics, profile pages
```

**3. update_updated_at_column()**
```sql
Trigger function: Sets updated_at = NOW() on row updates

Applied to tables: profiles, tours, bookings, reviews
```

#### Migration Execution Order

**CRITICAL: Execute in this exact order**

1. **Core Infrastructure (001-010)**
   - 001: Create profiles table
   - 002: Create tours table
   - 003: Create bookings table
   - 004: Create reviews table
   - 005: Add profile fields
   - 006: Create notifications table
   - 007: Add tour locations array
   - 008: Create tour templates table
   - 009: Update profiles RLS for notifications
   - 010: Add 'offered' status to bookings

2. **Critical Tables (011-012)**
   - 011: Create languages table (**REQUIRED** - app will fail without this)
   - 012: Fix bookings update policy

3. **Review Functions (013-017)**
   - Use only 015 and 017:
   - 015: Safe review fixes migration (recommended)
   - 017: Fix empty tour reviews (latest, most complete)
   - Skip: 013, 014, 016 (superseded)

4. **Recent Fixes (018-022)**
   - 018: Fix offered booking updates
   - 020: Add unique review constraint
   - 021: Create review summaries table (optional optimization)
   - 022: Add optimized fetch functions OR fix storage RLS (choose one)
   - Skip: 019 (debug only)

### User Flows & Features

#### Tourist User Flow
1. **Discovery**
   - Land on /explore
   - Browse tours and guides
   - Apply filters (location, language, price, rating, dates)
   - View tour details with reviews

2. **Booking**
   - Select a tour
   - Choose date, time, number of guests
   - Submit booking request (status: 'requested')
   - OR accept guide's offer (status: 'offered' → 'accepted')
   - Wait for guide confirmation

3. **Payment**
   - After acceptance, payment required
   - Update status to 'paid'
   - Track payment in dashboard

4. **Experience**
   - Tour completed
   - Status updated to 'completed'

5. **Review**
   - Submit review with rating (1-5 stars) and comment
   - Review both tour and guide
   - View review on profile

#### Guide User Flow
1. **Profile Setup**
   - Complete guide profile (bio, experience, specialties, languages)
   - Upload avatar

2. **Tour Creation**
   - Choose template or start from scratch
   - Add multiple locations with order
   - Set pricing, capacity, duration
   - Select available days and languages
   - Publish tour

3. **Booking Management**
   - View incoming requests in dashboard
   - Create counter-offers for tourists
   - Accept/decline requests
   - Confirm payments

4. **Tour Completion**
   - Mark tour as completed
   - Track earnings
   - View analytics

5. **Reputation**
   - Receive reviews
   - Monitor aggregate rating
   - Display rating on profile and tours

#### Booking Status Transitions

```
Tourist Actions:
  [NONE] --create request--> [REQUESTED]
  [OFFERED] --accept--> [ACCEPTED]
  [REQUESTED/OFFERED/ACCEPTED] --cancel--> [CANCELLED]

Guide Actions:
  [NONE] --create offer--> [OFFERED]
  [REQUESTED] --accept--> [ACCEPTED]
  [REQUESTED] --decline--> [DECLINED]
  [REQUESTED/OFFERED/ACCEPTED] --cancel--> [CANCELLED]

Payment Processing:
  [ACCEPTED] --payment received--> [PAID]

System/Guide:
  [PAID] --tour completed--> [COMPLETED]
```

### Key Features Implementation Details

#### 1. Authentication System
- Email/password authentication via Supabase
- Role selection during signup (guide or tourist)
- Profile creation automatic on first auth
- Session persistence in localStorage
- Protected routes with role checking
- Auth modal with sign in/sign up tabs

#### 2. Real-time Notifications
- WebSocket connection via Supabase
- Subscribe to notifications table changes
- Filter by recipient_id
- Show badge count of unread
- Dropdown menu with notification list
- Mark as read functionality
- Action URLs for quick navigation

#### 3. Review & Rating System
- Star rating (1-5)
- Text comment (required)
- Target type: tour OR guide
- Aggregation functions for display
- Rating distribution (how many 1-star, 2-star, etc.)
- One review per user per target (unique constraint)
- Review submission only after completed booking

#### 4. Tour Template System
- System templates (pre-built, common tours)
- User templates (guides save their own)
- Template includes all tour fields
- One-click tour creation from template
- Track usage count
- Category-based organization

#### 5. Multiple Locations Per Tour
- JSONB array: `[{id, name, notes, order}]`
- Drag-and-drop reordering (if UI implemented)
- Display as ordered list
- Each location can have notes
- Backward compatible with single location field

#### 6. Payment Tracking
- Payment status on bookings
- Total price calculation (price × guests)
- Payment method tracking
- Dashboard analytics:
  - Guides: Total earnings, by status
  - Tourists: Total spent, upcoming payments

#### 7. Advanced Filtering
- Location (text search)
- Language (multi-select dropdown)
- Price range (min/max sliders)
- Rating (star filter)
- Availability (day of week checkboxes)
- Private/group toggle
- Real-time filter application

#### 8. Responsive Design
- Mobile-first approach
- Chakra UI breakpoints: base, sm, md, lg, xl, 2xl
- Responsive grid layouts
- Mobile-optimized forms
- Touch-friendly UI elements
- Drawer navigation on mobile

### UI/UX Design Guidelines

#### Color Palette
```css
Primary Colors (Blues):
  50:  #e6f6ff (lightest)
  100: #bae3ff
  200: #8dcfff
  300: #5fbcff
  400: #38a9ff
  500: #2195eb (main brand color)
  600: #1677c7
  700: #0d5aa4
  800: #043c80
  900: #01254d (darkest)
```

#### Typography
- Font family: System fonts (Chakra UI default)
- Font sizes: xs (0.75rem) to 6xl (3.75rem)
- Line heights: Chakra UI defaults
- Font weights: normal, medium, semibold, bold

#### Spacing
- Base unit: 0.25rem
- Common spacing: 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32

#### Components Style
- Border radius: lg (0.5rem) for buttons, xl (0.75rem) for cards
- Shadows: Chakra UI shadow scales (sm, md, lg, xl)
- Button heights: sm (40px), md (44px), lg (48px)
- Input heights: match button sizes

#### Layout Patterns
- Container max-width: container.xl (1280px)
- Content padding: 4-8 (1-2rem)
- Grid gaps: 4-6 (1-1.5rem)
- Card padding: 4-6
- Modal padding: 6-8

### Testing Strategy

#### Unit Tests
- Component tests with @testing-library/react
- Context tests with mock providers
- Utility function tests
- Type checking with TypeScript

#### Integration Tests
- Multi-component workflows
- API interactions with Supabase
- State management flows
- Real-time subscription handling

#### Manual Testing Requirements
- Authentication flows (sign up, sign in, sign out)
- Booking system (request, offer, accept, cancel)
- Payment tracking
- Review submission
- Notification real-time updates
- Mobile responsiveness
- Cross-browser compatibility

### Performance Considerations

#### Optimization Strategies
1. **Code Splitting**
   - Lazy load routes
   - Dynamic imports for large components
   - Separate vendor bundles

2. **Database Optimization**
   - GIN indexes on JSONB fields (locations)
   - Indexed foreign keys
   - Materialized views for review aggregations (optional)
   - Efficient RLS policies

3. **Caching**
   - Supabase client caching
   - React Query or SWR (not currently used, but recommended)
   - Browser caching for static assets

4. **Bundle Size**
   - Current: 1MB+ (needs optimization)
   - Target: <500KB main bundle
   - Tree shaking for unused code
   - Optimize Chakra UI imports

### Security Requirements

#### Authentication & Authorization
- Supabase Auth with JWT tokens
- Row Level Security (RLS) on all tables
- Role-based access control (guide/tourist)
- Protected API endpoints

#### RLS Policy Patterns
```sql
-- Public read
CREATE POLICY "anyone_select" ON table_name
  FOR SELECT USING (true);

-- Own records only
CREATE POLICY "users_crud_own" ON table_name
  FOR ALL USING (auth.uid() = user_id);

-- Role-based
CREATE POLICY "guides_insert" ON tours
  FOR INSERT WITH CHECK (
    auth.uid() = creator_id AND 
    creator_role = 'guide'
  );
```

#### Input Validation
- Frontend: Form validation with Chakra UI
- Backend: Database constraints
- XSS prevention: Chakra UI escapes by default
- SQL injection: Supabase parameterized queries

#### Security Headers
```html
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
```

### Development Setup

#### Prerequisites
- Node.js v16+ (recommended: v18)
- npm v8+
- Supabase account
- Git

#### Installation Steps
```bash
# Clone repository
git clone <repository-url>
cd Guides

# Install dependencies
npm install

# Environment setup
cp .env.example .env.local
# Edit .env.local with Supabase credentials:
# VITE_SUPABASE_URL=https://your-project.supabase.co
# VITE_SUPABASE_ANON_KEY=your-anon-key

# Database setup
# In Supabase SQL Editor, execute migrations in order:
# src/db/migrations/001_*.sql through 022_*.sql

# Start development server
npm run dev
```

#### Development Commands
```bash
npm run dev        # Start dev server (localhost:5173)
npm run build      # Production build
npm run preview    # Preview production build
npm run test       # Run tests
npm run test:run   # Run tests once (CI)
npm run lint       # Check code quality
```

#### Project Structure
```
/
├── public/              # Static assets
│   ├── 404.html        # GitHub Pages 404 handler
│   └── vite.svg        # Favicon
├── src/
│   ├── components/     # React components (29+)
│   ├── pages/          # Route pages (5)
│   ├── contexts/       # React contexts (8)
│   ├── hooks/          # Custom hooks
│   ├── lib/            # Core utilities
│   │   ├── supabaseClient.ts
│   │   ├── types.ts
│   │   └── api.ts
│   ├── db/
│   │   └── migrations/ # SQL migration files (22)
│   ├── utils/          # Helper functions
│   ├── test-helpers/   # Test utilities
│   ├── App.tsx         # Main app component
│   ├── main.tsx        # Entry point
│   └── index.css       # Global styles
├── .github/
│   └── workflows/
│       └── deploy.yml  # GitHub Pages deployment
├── index.html          # HTML entry point
├── vite.config.ts      # Vite configuration
├── tsconfig.json       # TypeScript config
├── eslint.config.js    # ESLint config
├── tailwind.config.js  # Tailwind config (minimal)
├── package.json        # Dependencies
└── README.md           # Documentation
```

### Deployment

#### GitHub Pages Setup
1. Enable GitHub Pages in repository settings
2. Set source to GitHub Actions
3. Push to main branch triggers deployment
4. Base path: `/Guides/`

#### Build Process
```yaml
# .github/workflows/deploy.yml
- Install dependencies (npm ci)
- Build project (npm run build)
- Upload artifact (./dist)
- Deploy to GitHub Pages
```

#### Environment Variables
- Development: `.env.local`
- Production: Set in Supabase or CI/CD
- Required:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

### Known Issues & Solutions

#### Current Issues (as of documentation)
1. **ESLint Warnings: 52**
   - Remaining: console.log in test helpers, some 'any' types
   - Solution: Clean up test files, add proper types

2. **Bundle Size: 1MB+**
   - Solution: Code splitting, lazy loading, optimize Chakra UI imports

3. **SQL Migration Conflicts**
   - Issue: Multiple versions of review functions
   - Solution: Use migrations 015 and 017 only

4. **npm Audit: 2 moderate vulnerabilities**
   - Solution: Update dependencies (check breaking changes)

#### Common Errors
1. **"Table not found" - languages table**
   - Cause: Migration 011 not executed
   - Fix: Run 011_create_languages_table.sql

2. **"Tourist not allowed" - booking update**
   - Cause: RLS policy issue
   - Fix: Execute migration 018 (fix offered booking updates)

3. **Function signature errors - reviews**
   - Cause: Multiple function versions
   - Fix: Drop old functions, use migration 017

4. **Build failures - TypeScript**
   - Cause: Type errors, 'any' usage
   - Fix: Add proper types from src/lib/types.ts

### Additional Features to Consider

#### Phase 2 Enhancements
1. **Image Upload**
   - Tour images (multiple per tour)
   - Guide portfolio images
   - Supabase Storage integration

2. **Chat System**
   - Real-time messaging between guide and tourist
   - Message history
   - Notification integration

3. **Calendar Integration**
   - Google Calendar sync
   - iCal export
   - Availability calendar

4. **Payment Integration**
   - Stripe or PayPal integration
   - Automatic payment processing
   - Refund handling

5. **Advanced Analytics**
   - Guide performance metrics
   - Tourist behavior analytics
   - Revenue forecasting
   - Popular tours/locations

6. **Map Integration**
   - Google Maps or Mapbox
   - Tour location visualization
   - Route planning

7. **Multi-language Support**
   - i18n implementation
   - Translated content
   - Language detection

8. **Push Notifications**
   - Browser push notifications
   - Email notifications
   - SMS notifications (via Twilio)

9. **Social Features**
   - Share tours on social media
   - Invite friends
   - Referral system

10. **Admin Panel**
    - User management
    - Content moderation
    - Analytics dashboard
    - System configuration

### API Reference

#### Supabase Client Usage

**Authentication**
```typescript
// Sign Up
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123',
});

// Sign In
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123',
});

// Sign Out
await supabase.auth.signOut();

// Get Session
const { data: { session } } = await supabase.auth.getSession();
```

**Database Queries**
```typescript
// Select
const { data, error } = await supabase
  .from('tours')
  .select('*')
  .eq('is_active', true);

// Insert
const { data, error } = await supabase
  .from('tours')
  .insert({ title: 'New Tour', ... });

// Update
const { data, error } = await supabase
  .from('tours')
  .update({ title: 'Updated' })
  .eq('id', tourId);

// Delete
const { data, error } = await supabase
  .from('tours')
  .delete()
  .eq('id', tourId);

// RPC (Call Function)
const { data, error } = await supabase
  .rpc('get_review_summary', {
    target_id: tourId,
    target_type: 'tour'
  });
```

**Real-time Subscriptions**
```typescript
const subscription = supabase
  .channel('notifications')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
      filter: `recipient_id=eq.${userId}`
    },
    (payload) => {
      console.log('New notification:', payload);
    }
  )
  .subscribe();

// Cleanup
subscription.unsubscribe();
```

**Storage**
```typescript
// Upload
const { data, error } = await supabase.storage
  .from('avatars')
  .upload(`${userId}/avatar.png`, file);

// Get public URL
const { data } = supabase.storage
  .from('avatars')
  .getPublicUrl(`${userId}/avatar.png`);
```

### Type Definitions

#### Core Types
```typescript
// User Roles
type UserRole = 'guide' | 'tourist';

// Booking Status
type BookingStatus = 
  | 'requested' 
  | 'offered' 
  | 'accepted' 
  | 'declined' 
  | 'paid' 
  | 'completed' 
  | 'cancelled';

// Review Target
type ReviewTarget = 'tour' | 'guide';

// Notification Type
type NotificationType = 
  | 'booking_request'
  | 'booking_offered'
  | 'booking_accepted'
  | 'booking_cancelled'
  | 'new_review'
  | 'payment_received';

// Tour Location
interface TourLocation {
  id: string;
  name: string;
  notes?: string;
  order: number;
}

// Profile
interface Profile {
  id: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  avatar_url: string | null;
  bio?: string;
  interests?: string;
  location?: string;
  languages?: string[];
  years_experience?: number;
  specialties?: string;
  created_at: string;
  updated_at: string;
}

// Tour
interface Tour {
  id: string;
  title: string;
  description: string;
  location: string;
  locations?: TourLocation[];
  duration: number;
  price: number;
  capacity: number;
  languages: string[];
  days_available: boolean[];
  is_private: boolean;
  is_active: boolean;
  creator_id: string;
  creator_role: string;
  created_at: string;
  updated_at: string;
}

// Booking
interface Booking {
  id: string;
  tour_id: string;
  tourist_id: string;
  guide_id: string;
  status: BookingStatus;
  booking_date: string;
  booking_time?: string;
  number_of_guests: number;
  total_price: number;
  payment_status: string;
  payment_method?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Review
interface Review {
  id: string;
  reviewer_id: string;
  reviewer_name: string;
  reviewer_avatar?: string;
  target_id: string;
  target_type: ReviewTarget;
  rating: number;
  comment: string;
  tour_id?: string;
  tour_name?: string;
  created_at: string;
}

// Notification
interface Notification {
  id: string;
  recipient_id: string;
  actor_id: string;
  type: NotificationType;
  message: string;
  action_url?: string;
  is_read: boolean;
  created_at: string;
}
```

### Testing Examples

#### Component Test Pattern
```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { ChakraProvider } from '@chakra-ui/react';
import { BrowserRouter } from 'react-router-dom';
import TourCard from './TourCard';

const mockTour = {
  id: '1',
  title: 'Test Tour',
  description: 'Description',
  price: 100,
  // ... other fields
};

describe('TourCard', () => {
  it('renders tour information', () => {
    render(
      <ChakraProvider>
        <BrowserRouter>
          <TourCard tour={mockTour} />
        </BrowserRouter>
      </ChakraProvider>
    );
    
    expect(screen.getByText('Test Tour')).toBeInTheDocument();
    expect(screen.getByText('$100')).toBeInTheDocument();
  });
});
```

#### Context Test Pattern
```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthProvider';

describe('AuthProvider', () => {
  it('provides auth state', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );
    
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });
});
```

### Documentation Files to Create

1. **README.md** - Main project overview
2. **CONTRIBUTING.md** - Development guidelines
3. **DEVELOPMENT_GUIDE.md** - Quick reference
4. **SQL_REFERENCE.md** - Database documentation
5. **API_DOCUMENTATION.md** - API reference
6. **DEPLOYMENT.md** - Deployment guide
7. **TROUBLESHOOTING.md** - Common issues and solutions

### Success Criteria

The application is considered complete when:

1. ✅ All core features are implemented and working
2. ✅ Database schema is fully implemented with RLS
3. ✅ Authentication works for both roles
4. ✅ Booking flow is complete (request → offer → accept → pay → complete)
5. ✅ Review system functions correctly
6. ✅ Real-time notifications work
7. ✅ Mobile responsive on all pages
8. ✅ All migrations execute without errors
9. ✅ Application builds without errors
10. ✅ ESLint warnings are minimized (<10)
11. ✅ Tests cover critical paths
12. ✅ Deployment to GitHub Pages succeeds
13. ✅ Documentation is complete and accurate

### Final Notes

This is a production-ready application with real-world complexity. Pay special attention to:

- **Database Integrity**: RLS policies are critical for security
- **User Experience**: Both roles must have seamless workflows
- **Performance**: Optimize queries and bundle size
- **Error Handling**: Graceful error states throughout
- **Mobile First**: Most users will be on mobile devices
- **Real-time**: Notifications must be instant
- **Testing**: Manual testing is essential for booking flows

The application is designed to be extensible. The architecture supports adding features like payments, chat, maps, and more without major refactoring.

Good luck building TourGuideHub! 🚀
