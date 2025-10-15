# Complete AI Prompt for Recreating TourGuideHub from Scratch

## Executive Summary

Create a modern, production-ready **Tour Guide Marketplace Platform** that connects tourists with local tour guides. The application is a full-stack web platform featuring real-time booking management, payment tracking, review systems, and role-based authentication.

---

## 🎯 Core Business Concept

**TourGuideHub** is a two-sided marketplace platform similar to Airbnb, but for tour guides and experiences:

- **For Tourists**: Browse and book local tour guides, discover unique experiences, read reviews, track bookings and payments
- **For Guides**: Create and manage tours, accept booking requests, create custom offers, track earnings, build reputation through reviews

**Key Differentiators**:
1. Dual booking flow (tourist requests + guide offers)
2. Real-time notifications for all booking events
3. Template system for guides to quickly create tours
4. Multi-location tour support with ordered itineraries
5. Comprehensive review system (both tour and guide reviews)
6. Payment tracking dashboard for guides

---

## 🏗️ Technical Architecture

### Technology Stack

**Frontend**:
- **React 18.2.0** with TypeScript 5.0.2
- **Chakra UI 2.10.9** for component library and theming
- **React Router DOM 6.18.0** for client-side routing
- **Vite 4.4.5** for build tooling and dev server
- **Framer Motion 12.23.12** for animations (required by Chakra UI)

**Backend/Database**:
- **Supabase** (PostgreSQL + Auth + Real-time + Storage)
  - Supabase JS Client 2.38.4
  - Row Level Security (RLS) policies
  - PostgreSQL functions for complex queries
  - Real-time subscriptions for notifications

**Development Tools**:
- **Vitest 0.34.6** for testing
- **ESLint 9.34.0** with TypeScript ESLint
- **PostCSS + Tailwind CSS** for utility styles (minimal usage)

**Deployment**:
- GitHub Pages with GitHub Actions CI/CD
- Base path: `/Guides/`

### Architecture Pattern

```
┌─────────────────────────────────────────────────────────────┐
│                     React Frontend (SPA)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Pages (5)  │  │ Components   │  │  Contexts    │     │
│  │              │  │    (29)      │  │    (8)       │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         │                  │                  │             │
│         └──────────────────┴──────────────────┘             │
│                           │                                 │
└───────────────────────────┼─────────────────────────────────┘
                            │
                            ▼
            ┌───────────────────────────────┐
            │      Supabase Client API      │
            └───────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ PostgreSQL   │    │   Auth       │    │  Real-time   │
│ Database     │    │   System     │    │  Subscriptions│
│ - RLS        │    │              │    │              │
│ - Functions  │    │              │    │              │
│ - Triggers   │    │              │    │              │
└──────────────┘    └──────────────┘    └──────────────┘
```

---

## 📊 Complete Database Schema

### Core Tables (7 Tables)

#### 1. `profiles` (extends auth.users)
```sql
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('guide', 'tourist')) DEFAULT 'tourist',
  avatar_url TEXT,
  bio TEXT,                    -- Added in migration 005
  interests TEXT[],            -- Added in migration 005
  languages TEXT[],            -- Added in migration 005
  experience_years INTEGER,    -- Added in migration 005 (guides only)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**RLS Policies**:
- Users can view their own profile
- Users can update their own profile
- Anyone can view guide profiles (for public browsing)
- Profile creation allowed during signup

#### 2. `tours`
```sql
CREATE TABLE public.tours (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL,      -- Primary location (legacy)
  locations JSONB,              -- Array of ordered locations (migration 007)
  duration INTEGER NOT NULL,    -- In hours
  price DECIMAL(10,2) NOT NULL,
  capacity INTEGER NOT NULL,
  languages TEXT[] NOT NULL,
  days_available BOOLEAN[7],    -- Monday=0, Sunday=6
  is_private BOOLEAN DEFAULT false,
  creator_id UUID REFERENCES profiles(id) NOT NULL,
  creator_role TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for location queries
CREATE INDEX idx_tours_locations ON tours USING GIN (locations);
```

**Location Structure** (JSONB):
```typescript
{
  id: string;
  name: string;
  notes?: string;
  order: number;  // Sequential order for itinerary
}[]
```

**RLS Policies**:
- Anyone can view active tours
- Guides can create tours
- Creators can update their own tours
- Creators can delete their own tours

#### 3. `bookings`
```sql
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tour_id UUID REFERENCES tours(id) NOT NULL,
  tourist_id UUID REFERENCES profiles(id) NOT NULL,
  guide_id UUID REFERENCES profiles(id) NOT NULL,
  status TEXT NOT NULL CHECK (status IN (
    'requested',   -- Tourist requests a tour
    'offered',     -- Guide creates custom offer (migration 010)
    'accepted',    -- Either party accepts
    'declined',    -- Either party declines
    'paid',        -- Payment confirmed
    'completed',   -- Tour finished
    'cancelled'    -- Cancelled after acceptance
  )),
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  guests INTEGER NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  payment_status TEXT DEFAULT 'pending',
  special_requests TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Status Flow**:
1. Tourist → `requested` → Guide accepts → `accepted`
2. Guide → `offered` → Tourist accepts → `accepted`
3. `accepted` → Payment → `paid` → Tour happens → `completed`

**RLS Policies** (complex - see migrations 012, 018, 019):
- Tourists can view their own bookings
- Guides can view bookings for their tours
- Tourists can create bookings (requests)
- Guides can create bookings (offers)
- Both parties can update booking status appropriately
- Special rules for tourist acceptance of offered bookings

#### 4. `reviews`
```sql
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reviewer_id UUID REFERENCES profiles(id) NOT NULL,
  target_id UUID NOT NULL,          -- Can be tour_id OR guide_id
  target_type TEXT NOT NULL CHECK (target_type IN ('guide', 'tour')),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate reviews (migration 020)
  UNIQUE(reviewer_id, target_id, target_type)
);
```

**Review Logic**:
- Tours can be reviewed directly
- Guides accumulate ratings from all their tours' reviews
- Complex aggregation functions for average ratings and distributions

**RLS Policies**:
- Anyone can view reviews
- Only authenticated users who completed bookings can create reviews
- Reviewers can update their own reviews
- Reviewers can delete their own reviews

#### 5. `notifications`
```sql
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_id UUID REFERENCES profiles(id) NOT NULL,
  actor_id UUID REFERENCES profiles(id),  -- Who triggered the notification
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,  -- Link for notification action
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Notification Types**:
- `booking_request` - New booking request
- `booking_accepted` - Booking accepted
- `booking_declined` - Booking declined
- `booking_offered` - New offer from guide
- `review_received` - New review
- `payment_received` - Payment confirmed

**RLS Policies**:
- Recipients can view their own notifications
- Recipients can update their own notifications (mark as read)
- System can insert notifications

#### 6. `languages`
```sql
CREATE TABLE public.languages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,    -- ISO 639-1 code (en, fr, es, etc.)
  name TEXT NOT NULL,
  native_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Pre-populated Languages**:
- English (en), Spanish (es), French (fr), German (de), Italian (it)
- Japanese (ja), Chinese (zh), Korean (ko), Arabic (ar), Russian (ru)
- Portuguese (pt), Hindi (hi), Georgian (ka)

**⚠️ CRITICAL**: This table MUST exist or the app fails to load.

#### 7. `tour_templates`
```sql
CREATE TABLE public.tour_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  template_data JSONB NOT NULL,  -- Complete tour configuration
  is_system_template BOOLEAN DEFAULT false,
  creator_id UUID REFERENCES profiles(id),
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Template Data Structure** (JSONB):
```typescript
{
  title: string;
  description: string;
  duration: number;
  price: number;
  capacity: number;
  languages: string[];
  days_available: boolean[7];
  is_private: boolean;
  locations: TourLocation[];
}
```

**Pre-populated System Template**: "Svaneti Mountain Adventure" (5-day tour in Georgia)

---

### Database Functions

#### 1. `get_review_summary(target_id UUID, target_type TEXT)`

**Latest Version**: Migration 017 (fixes empty result bugs)

```sql
CREATE OR REPLACE FUNCTION get_review_summary(target_id UUID, target_type TEXT)
RETURNS TABLE (
  average_rating NUMERIC,
  total_reviews INTEGER,
  rating_counts JSONB
) AS $$
BEGIN
  IF target_type = 'guide' THEN
    -- Aggregate from guide's tours + direct guide reviews
    RETURN QUERY
    WITH guide_reviews AS (
      SELECT rating FROM reviews WHERE target_id = $1 AND target_type = 'guide'
      UNION ALL
      SELECT r.rating FROM reviews r
      JOIN tours t ON r.target_id = t.id
      WHERE t.creator_id = $1 AND r.target_type = 'tour'
    )
    SELECT 
      COALESCE(AVG(rating), 0)::NUMERIC(3,2),
      COUNT(*)::INTEGER,
      jsonb_build_object(
        '1', COUNT(*) FILTER (WHERE rating = 1),
        '2', COUNT(*) FILTER (WHERE rating = 2),
        '3', COUNT(*) FILTER (WHERE rating = 3),
        '4', COUNT(*) FILTER (WHERE rating = 4),
        '5', COUNT(*) FILTER (WHERE rating = 5)
      )
    FROM guide_reviews;
  ELSE
    -- Direct tour reviews
    RETURN QUERY
    SELECT 
      COALESCE(AVG(rating), 0)::NUMERIC(3,2),
      COUNT(*)::INTEGER,
      jsonb_build_object(
        '1', COUNT(*) FILTER (WHERE rating = 1),
        '2', COUNT(*) FILTER (WHERE rating = 2),
        '3', COUNT(*) FILTER (WHERE rating = 3),
        '4', COUNT(*) FILTER (WHERE rating = 4),
        '5', COUNT(*) FILTER (WHERE rating = 5)
      )
    FROM reviews
    WHERE target_id = $1 AND target_type = $2;
  END IF;
END;
$$ LANGUAGE plpgsql;
```

**Usage**: Called from frontend to display ratings on tour cards and guide profiles.

---

## 🎨 UI/UX Design System

### Color Palette (Chakra UI Theme)

**Primary Colors** (Blue):
- `primary.50`: #e6f6ff (lightest)
- `primary.500`: #2195eb (main brand color)
- `primary.700`: #0d5aa4 (dark accent)
- `primary.900`: #01254d (darkest)

**Usage**:
- Primary buttons: `primary.500`
- Links and accents: `primary.600`
- Hover states: `primary.700`
- Badges and highlights: `primary.50`/`primary.100`

### Typography

**Font Sizes** (Mobile-first):
- Headings: `2xl` (1.5rem) to `4xl` (2.25rem)
- Body text: `md` (1rem)
- Small text: `sm` (0.875rem)
- Captions: `xs` (0.75rem)

**Font Weights**:
- Regular: 400 (body text)
- Semibold: 600 (buttons, labels)
- Bold: 700 (headings)

### Responsive Breakpoints

```javascript
breakpoints: {
  base: "0px",      // Mobile
  sm: "480px",      // Large mobile
  md: "768px",      // Tablet
  lg: "992px",      // Desktop
  xl: "1280px",     // Large desktop
  "2xl": "1536px"   // Extra large
}
```

**Mobile-First Approach**: All designs start mobile and scale up.

### Component Design Patterns

#### Buttons
- **Height**: 44-48px (mobile-friendly tap targets)
- **Border radius**: `lg` (8px)
- **States**: Default, hover, active, disabled, loading
- **Variants**: 
  - Solid (primary actions)
  - Outline (secondary actions)
  - Ghost (tertiary actions)

#### Cards
- **Background**: White (light mode) / Gray 700 (dark mode)
- **Border radius**: `lg` (8px)
- **Shadow**: `md` (medium shadow)
- **Padding**: 4-6 spacing units
- **Hover**: Subtle shadow increase

#### Form Inputs
- **Height**: 44-48px (mobile-optimized)
- **Border**: 1px solid gray
- **Focus**: Blue outline (primary color)
- **Error**: Red border + error message below

#### Navigation
- **Height**: 80px (desktop) / 64px (mobile)
- **Position**: Fixed top
- **Background**: White with shadow
- **Logo**: Left side
- **Actions**: Right side (Login/Profile)
- **Mobile**: Hamburger menu for navigation

---

## 🔧 Feature Specifications

### 1. Authentication System

**Implementation**: Supabase Auth with custom role selection

**Registration Flow**:
1. User enters email, password, full name
2. **Role Selection**: Guide or Tourist (critical decision)
3. Supabase creates auth.users entry
4. Trigger creates profiles entry with selected role
5. User logged in automatically

**Login Flow**:
1. Email/password authentication
2. Fetch profile data from profiles table
3. Store in React Context (AuthProvider)
4. Redirect to Dashboard or Explore

**Role Implications**:
- **Guides**: Can create tours, accept bookings, view earnings
- **Tourists**: Can browse tours, request bookings, write reviews

**UI Component**: `AuthModal.tsx` (modal overlay)

### 2. Tour Discovery & Search

**Page**: `Explore.tsx`

**Features**:
- **Tabs**: Toggle between Tours and Guides
- **Filters**:
  - Language (dropdown)
  - Location (dropdown)
  - Price range (slider)
  - Rating (star filter)
  - Availability (day of week checkboxes)
- **Search**: Text search in title/description
- **Sort**: Price, rating, newest, popular

**Tour Card Display**:
- Title and location
- Price per person
- Duration
- Languages available
- Star rating + review count
- Guide profile link
- "View Details" button

**Guide Card Display**:
- Profile photo
- Name and bio
- Languages spoken
- Average rating
- Number of tours
- "View Profile" button

### 3. Tour Details & Booking

**Page**: `TourDetails.tsx`

**Tour Information**:
- Hero section with title and rating
- Full description
- **Multi-location itinerary** (ordered list)
- Price breakdown
- Duration and capacity
- Languages available
- Days available (calendar view)
- Guide profile section

**Booking Form** (Tourist):
1. Select date (datepicker)
2. Number of guests (max: tour capacity)
3. Special requests (textarea)
4. Calculate total price
5. Submit booking request

**Status Indicators**:
- Available spots remaining
- Next available date
- Popular tour badge
- Recently booked indicator

**Reviews Section**:
- Overall rating breakdown
- Individual reviews with:
  - Reviewer name/photo
  - Star rating
  - Written comment
  - Date posted
- Pagination (10 per page)

### 4. Dashboard (Role-Based)

**Page**: `Dashboard.tsx`

#### Tourist Dashboard

**Tabs**:
1. **My Bookings**
   - Upcoming bookings
   - Past bookings
   - Status tracking (requested/accepted/paid/completed)
   - Payment status
   - Cancel option (if applicable)

2. **My Reviews**
   - Tours reviewed
   - Pending reviews (completed tours not yet reviewed)
   - Edit/delete own reviews

3. **Profile**
   - Edit personal information
   - Change avatar
   - Update preferences

#### Guide Dashboard

**Tabs**:
1. **My Tours**
   - Active tours list
   - Create new tour button
   - Edit/deactivate tours
   - View bookings per tour
   - Quick stats (views, bookings)

2. **Bookings**
   - **Incoming Requests**: Accept/decline
   - **Accepted Bookings**: Mark as paid/completed
   - **Completed Tours**: View reviews
   - Create custom offers

3. **Earnings**
   - Total earnings
   - Pending payments
   - Paid bookings
   - Earnings by tour
   - Date range filter

4. **Reviews**
   - Overall rating
   - Rating distribution (1-5 stars)
   - Recent reviews
   - Reviews by tour

5. **Profile**
   - Edit guide profile
   - Bio and experience
   - Specialties
   - Languages
   - Avatar

### 5. Tour Creation & Management

**Component**: `TourForm.tsx`

**Creation Methods**:
1. **From Template**: Select pre-built template, customize
2. **From Scratch**: Blank form

**Form Fields**:
- Title (text)
- Description (textarea, rich)
- **Locations** (multi-location manager):
  - Add/remove locations
  - Reorder with drag-drop
  - Add notes per location
- Duration (number, hours)
- Price (number, currency)
- Capacity (number, guests)
- Languages (multi-select)
- Days available (weekday checkboxes)
- Private tour toggle

**Save Options**:
- Save as draft (inactive)
- Publish (active)
- Save as template (for reuse)

**Validation**:
- All required fields must be filled
- Price > 0
- Capacity >= 1
- At least one language
- At least one day available

### 6. Booking Management

**Context**: `BookingContext.tsx`

**Booking States**:
```typescript
enum BookingStatus {
  REQUESTED = 'requested',  // Tourist initiated
  OFFERED = 'offered',      // Guide initiated
  ACCEPTED = 'accepted',    // Confirmed by both
  DECLINED = 'declined',    // Rejected
  PAID = 'paid',           // Payment confirmed
  COMPLETED = 'completed',  // Tour finished
  CANCELLED = 'cancelled'   // Cancelled post-acceptance
}
```

**Tourist Actions**:
- Request booking (create with `requested` status)
- Accept guide offer (change `offered` → `accepted`)
- Decline guide offer
- Cancel accepted booking (before date)
- Mark as paid (after payment)
- Leave review (after `completed`)

**Guide Actions**:
- Accept booking request (`requested` → `accepted`)
- Decline booking request
- Create custom offer (create with `offered` status)
- Mark as paid
- Mark as completed
- View reviews

**Real-time Updates**:
- Notifications sent on status changes
- Dashboard auto-refreshes on booking updates

### 7. Review System

**Components**: `ReviewForm.tsx`, `ReviewsList.tsx`, `ReviewsSummary.tsx`

**Review Creation**:
- **Eligibility**: Only after booking status = `completed`
- **Fields**:
  - Rating (1-5 stars)
  - Comment (required, min 20 chars)
- **Target**: Can review tour OR guide (or both)
- **Constraint**: One review per reviewer/target combination

**Review Display**:
- **Summary Card**:
  - Average rating (large)
  - Total reviews count
  - Star distribution chart (1-5 stars)
- **Individual Reviews**:
  - Reviewer name and avatar
  - Rating stars
  - Comment text
  - Date posted (relative time)
  - Tour name (for guide reviews)

**Guide Ratings**:
- Aggregated from all their tours' reviews
- Plus direct guide reviews
- Calculated via `get_review_summary()` function

### 8. Real-time Notifications

**Context**: `NotificationContext.tsx`

**Implementation**:
- Supabase real-time subscriptions
- Listen to notifications table for recipient_id
- Badge count on navbar
- Dropdown panel with notifications list

**Notification Structure**:
```typescript
{
  id: string;
  recipient_id: string;
  actor_id: string;  // Who did the action
  type: NotificationType;
  title: string;
  message: string;
  action_url: string;  // Link to relevant page
  is_read: boolean;
  created_at: string;
}
```

**Notification Types & Templates**:
1. **Booking Request**:
   - Title: "New Booking Request"
   - Message: "{actor_name} requested to book {tour_name}"
   - Action: Link to booking details

2. **Booking Accepted**:
   - Title: "Booking Accepted"
   - Message: "{actor_name} accepted your booking"
   - Action: Link to booking details

3. **Booking Offered**:
   - Title: "New Tour Offer"
   - Message: "{actor_name} created a custom tour offer"
   - Action: Link to offer details

4. **Review Received**:
   - Title: "New Review"
   - Message: "{actor_name} left a {rating}-star review"
   - Action: Link to review

**UI**:
- Bell icon with badge count
- Click to open dropdown
- Mark as read (individual or all)
- Click notification to navigate to action

### 9. Payment Tracking

**Component**: `PaymentTracker.tsx`

**Guide Features**:
- Total earnings (lifetime)
- Pending payments (accepted bookings)
- Paid bookings (payment confirmed)
- Earnings by tour
- Earnings by date range
- Export to CSV (future)

**Tourist Features**:
- Total spent
- Pending payments
- Payment history
- Bookings requiring payment

**Payment Status**:
- `pending`: Booking accepted, not paid
- `paid`: Payment confirmed
- `refunded`: Payment returned (cancellations)

**Note**: No actual payment processing (Stripe/PayPal) - manual tracking only.

### 10. Template System

**Context**: `TourTemplateContext.tsx`

**System Templates**:
- Pre-built by admin
- Cannot be edited by users
- Available to all guides
- Example: "Svaneti Mountain Adventure"

**User Templates**:
- Guides can save tours as templates
- Private to creator
- Reusable for similar tours
- Includes all tour fields

**Template Picker** (`TourTemplatePicker.tsx`):
- Browse system templates
- Browse user's own templates
- Preview template data
- "Use This Template" button
- Pre-fills tour form with template data

---

## 📱 Pages & Routing

### Route Structure

```typescript
<BrowserRouter basename="/Guides">
  <Routes>
    {/* Public Routes */}
    <Route path="/" element={<Navigate to="/explore" />} />
    <Route path="/explore" element={<Explore />} />
    <Route path="/tours/:id" element={<TourDetails />} />
    <Route path="/profile/:id" element={<ProfilePage />} />
    
    {/* Protected Routes */}
    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
    
    {/* Fallback */}
    <Route path="*" element={<Navigate to="/explore" />} />
  </Routes>
</BrowserRouter>
```

### Page Details

#### 1. Explore (`/explore`)
- **Public**: Yes
- **Components**: Filters, TourCard, GuideCard, Tabs
- **Features**: Search, filter, sort, pagination

#### 2. Tour Details (`/tours/:id`)
- **Public**: Yes
- **Components**: Tour info, BookingForm, ReviewsList
- **Features**: View tour, book (if logged in), read reviews

#### 3. Guide Profile (`/profile/:id`)
- **Public**: Yes
- **Components**: Profile card, ToursList, ReviewsList
- **Features**: View guide info, their tours, reviews

#### 4. Dashboard (`/dashboard`)
- **Protected**: Yes
- **Components**: Role-based tabs, various lists
- **Features**: Manage tours/bookings, view stats, edit profile

---

## 🔌 API Integration (Supabase)

### Client Configuration

**File**: `src/lib/supabaseClient.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const DEFAULT_AVATAR_URL = 'https://...';  // Placeholder image

export interface Profile {
  id: string;
  full_name: string;
  phone: string | null;
  role: 'guide' | 'tourist';
  avatar_url: string | null;
  bio: string | null;
  interests: string[] | null;
  languages: string[] | null;
  experience_years: number | null;
  created_at: string;
  updated_at: string;
}
```

### Common API Patterns

#### Fetching Data
```typescript
// Get all active tours
const { data, error } = await supabase
  .from('tours')
  .select('*')
  .eq('is_active', true)
  .order('created_at', { ascending: false });

// Get tour with guide profile
const { data, error } = await supabase
  .from('tours')
  .select('*, guide:profiles!creator_id(*)')
  .eq('id', tourId)
  .single();

// Get reviews with reviewer info
const { data, error } = await supabase
  .from('reviews')
  .select(`
    *,
    reviewer:profiles!reviewer_id(full_name, avatar_url)
  `)
  .eq('target_id', tourId)
  .eq('target_type', 'tour')
  .order('created_at', { ascending: false });
```

#### Creating Data
```typescript
// Create booking request
const { data, error } = await supabase
  .from('bookings')
  .insert({
    tour_id: tourId,
    tourist_id: user.id,
    guide_id: tour.creator_id,
    status: 'requested',
    date: selectedDate,
    guests: numberOfGuests,
    total_price: calculatedPrice,
    special_requests: requests
  });
```

#### Updating Data
```typescript
// Accept booking
const { data, error } = await supabase
  .from('bookings')
  .update({ status: 'accepted' })
  .eq('id', bookingId);
```

#### Real-time Subscriptions
```typescript
// Listen to notifications
const channel = supabase
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
      // Handle new notification
      setNotifications(prev => [payload.new, ...prev]);
    }
  )
  .subscribe();

// Cleanup
return () => {
  channel.unsubscribe();
};
```

#### Calling Functions
```typescript
// Get review summary
const { data, error } = await supabase
  .rpc('get_review_summary', {
    target_id: guideId,
    target_type: 'guide'
  });

// Returns: { average_rating, total_reviews, rating_counts }
```

---

## 🎭 State Management

### Context Providers (8)

#### 1. AuthProvider
**Purpose**: User authentication and profile management

**State**:
- `user`: Supabase auth user
- `profile`: User profile from profiles table
- `isLoading`: Auth loading state

**Methods**:
- `signIn(email, password)`
- `signUp(email, password, fullName, role)`
- `signOut()`
- `updateProfile(data)`

#### 2. ModalProvider
**Purpose**: Global modal state (auth modal)

**State**:
- `isAuthModalOpen`: Boolean

**Methods**:
- `openAuthModal()`
- `closeAuthModal()`

#### 3. ToursContext
**Purpose**: Tour data management

**State**:
- `tours`: Array of tours
- `isLoading`: Loading state
- `error`: Error message

**Methods**:
- `fetchTours(filters?)`
- `createTour(tourData)`
- `updateTour(id, tourData)`
- `deleteTour(id)`
- `getTourById(id)`

#### 4. BookingContext
**Purpose**: Booking management

**State**:
- `bookings`: Array of bookings
- `isLoading`: Loading state

**Methods**:
- `fetchBookings(role)`
- `createBooking(bookingData)`
- `updateBookingStatus(id, status)`
- `createOffer(offerData)`
- `acceptOffer(id)`

#### 5. ReviewsProvider
**Purpose**: Review data and summary

**State**:
- `reviews`: Array of reviews
- `reviewSummary`: Aggregated ratings

**Methods**:
- `fetchReviews(targetId, targetType)`
- `createReview(reviewData)`
- `updateReview(id, reviewData)`
- `deleteReview(id)`
- `getReviewSummary(targetId, targetType)`

#### 6. NotificationContext
**Purpose**: Real-time notifications

**State**:
- `notifications`: Array of notifications
- `unreadCount`: Count of unread

**Methods**:
- `fetchNotifications()`
- `markAsRead(id)`
- `markAllAsRead()`
- Real-time subscription setup

#### 7. TourTemplateContext
**Purpose**: Template management

**State**:
- `templates`: Array of templates

**Methods**:
- `fetchTemplates()`
- `createTemplate(templateData)`
- `useTemplate(id)`

#### 8. PaymentStatsContext
**Purpose**: Payment analytics

**State**:
- `totalEarnings`: Total amount
- `pendingPayments`: Unpaid bookings
- `paidBookings`: Paid bookings

**Methods**:
- `fetchPaymentStats(guideId)`
- `updatePaymentStatus(bookingId, status)`

---

## 🧩 Component Library

### Key Components (Top 15)

#### 1. NavBar
**Purpose**: Main navigation bar

**Features**:
- Logo (left)
- Navigation links (center)
- Auth buttons / User menu (right)
- Notification badge
- Mobile responsive (hamburger menu)

**States**: Logged in vs. logged out

#### 2. TourCard
**Purpose**: Display tour in grid/list

**Props**:
- `tour`: Tour object
- `onClick`: Handler for view details

**Display**:
- Image placeholder or tour photo
- Title, location, price
- Duration, capacity
- Rating stars + review count
- "View Details" button

#### 3. GuideCard
**Purpose**: Display guide profile in grid

**Props**:
- `guide`: Guide profile object

**Display**:
- Avatar
- Name, bio (truncated)
- Languages
- Rating + review count
- Number of tours
- "View Profile" button

#### 4. BookingForm
**Purpose**: Create booking request

**Props**:
- `tour`: Tour object
- `onSuccess`: Callback after booking

**Form**:
- Date picker
- Guest count
- Special requests
- Price calculation
- Submit button

**Validation**:
- Date must be available (days_available)
- Guests must be <= capacity
- User must be logged in as tourist

#### 5. TourForm
**Purpose**: Create/edit tours

**Props**:
- `initialData?`: For editing
- `onSuccess`: Callback after save

**Features**:
- Template picker button
- All tour fields
- Multi-location manager
- Save/publish options
- Preview mode

**Validation**: Comprehensive field validation

#### 6. ReviewForm
**Purpose**: Submit review

**Props**:
- `targetId`: Tour or guide ID
- `targetType`: 'tour' or 'guide'
- `onSuccess`: Callback after submit

**Form**:
- Star rating (interactive)
- Comment textarea
- Submit button

**Validation**:
- Rating required
- Comment min 20 characters

#### 7. ReviewsList
**Purpose**: Display reviews

**Props**:
- `reviews`: Array of reviews
- `isLoading`: Loading state

**Display**:
- Review items (ReviewItem component)
- Pagination
- Empty state (no reviews)

#### 8. ReviewsSummary
**Purpose**: Aggregate rating display

**Props**:
- `summary`: { average_rating, total_reviews, rating_counts }

**Display**:
- Large average rating
- Star visual
- Total reviews count
- Distribution chart (1-5 stars)

#### 9. BookingItem
**Purpose**: Single booking card

**Props**:
- `booking`: Booking object
- `userRole`: 'guide' or 'tourist'
- `onStatusChange`: Handler

**Display**:
- Tour name, date
- Tourist/guide info
- Status badge
- Action buttons (accept/decline/cancel)
- Payment status

#### 10. BookingsList
**Purpose**: List of bookings

**Props**:
- `bookings`: Array
- `role`: User role

**Features**:
- Filters by status
- Sorted by date
- Empty states
- Loading states

#### 11. ProfileEditor
**Purpose**: Edit user profile

**Props**:
- `profile`: Current profile
- `onSave`: Callback

**Form**:
- Full name
- Phone
- Bio (guide only)
- Languages (multi-select)
- Experience (guide only)
- Avatar upload
- Save button

#### 12. TourLocationManager
**Purpose**: Manage tour locations

**Props**:
- `locations`: Array of locations
- `onChange`: Update handler

**Features**:
- Add new location
- Remove location
- Reorder (drag/drop)
- Edit location notes
- Visual itinerary preview

#### 13. PaymentTracker
**Purpose**: Display payment stats (guide)

**Props**:
- `guideId`: Guide ID

**Display**:
- Total earnings (large card)
- Pending payments
- Recent paid bookings
- Charts (optional)

#### 14. NotificationBadge
**Purpose**: Notification icon with count

**Props**:
- `count`: Unread count
- `onClick`: Open notifications

**Display**:
- Bell icon
- Badge with count (if > 0)
- Dropdown with notifications

#### 15. Filters
**Purpose**: Search and filter controls

**Props**:
- `filters`: Current filter state
- `onChange`: Update filters

**Controls**:
- Language dropdown
- Location dropdown
- Price range slider
- Rating filter
- Day availability checkboxes
- Reset button

---

## 🔒 Security & Permissions

### Row Level Security (RLS)

**Critical**: All tables MUST have RLS enabled with appropriate policies.

#### Common Policy Patterns

**Public Read**:
```sql
CREATE POLICY "public_read" ON table_name
  FOR SELECT USING (true);  -- Anyone can read
```

**Owner Write**:
```sql
CREATE POLICY "owner_update" ON table_name
  FOR UPDATE USING (auth.uid() = owner_id);
```

**Role-Based Access**:
```sql
CREATE POLICY "guides_create_tours" ON tours
  FOR INSERT WITH CHECK (
    auth.uid() = creator_id AND 
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'guide'
  );
```

**Complex Booking Policies**:
```sql
-- Tourist can accept offered bookings
CREATE POLICY "tourist_accept_offer" ON bookings
  FOR UPDATE USING (
    tourist_id = auth.uid() AND
    status = 'offered'
  )
  WITH CHECK (
    status = 'accepted'
  );

-- Guide can accept requested bookings
CREATE POLICY "guide_accept_request" ON bookings
  FOR UPDATE USING (
    guide_id = auth.uid() AND
    status = 'requested'
  )
  WITH CHECK (
    status IN ('accepted', 'declined')
  );
```

### Authentication Flow

1. **Sign Up**:
   - Supabase creates auth.users entry
   - Database trigger creates profiles entry
   - User logged in with session

2. **Sign In**:
   - Supabase validates credentials
   - Returns session token
   - Frontend fetches profile data

3. **Session Management**:
   - Tokens stored in localStorage
   - Auto-refresh on expiration
   - Logout clears session

4. **Protected Routes**:
   - Check `user` in AuthContext
   - Redirect to /explore if not authenticated

### Data Validation

**Frontend** (before API calls):
- Required fields not empty
- Numeric fields within ranges
- Email format validation
- Date validation

**Backend** (PostgreSQL constraints):
- CHECK constraints on enums
- Foreign key constraints
- NOT NULL constraints
- Unique constraints

---

## 🚀 Development Workflow

### Setup Instructions

1. **Prerequisites**:
   ```bash
   node >= 16
   npm >= 8
   ```

2. **Clone & Install**:
   ```bash
   git clone <repo>
   cd Guides
   npm install
   ```

3. **Environment Setup**:
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local`:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

4. **Database Setup**:
   - Create Supabase project
   - Execute SQL migrations in order (001-021)
   - Verify all tables and functions exist

5. **Run Development Server**:
   ```bash
   npm run dev
   # Opens http://localhost:5173
   ```

6. **Build for Production**:
   ```bash
   npm run build
   # Output in /dist
   ```

### File Structure

```
Guides/
├── public/
│   ├── 404.html          # GitHub Pages 404 handling
│   └── vite.svg          # Favicon
├── src/
│   ├── components/       # 29 React components
│   │   ├── AuthModal.tsx
│   │   ├── TourCard.tsx
│   │   ├── BookingForm.tsx
│   │   └── ...
│   ├── pages/           # 5 main pages
│   │   ├── Explore.tsx
│   │   ├── Dashboard.tsx
│   │   ├── TourDetails.tsx
│   │   ├── Profile/[id].tsx
│   │   └── Guides.tsx
│   ├── contexts/        # 8 React contexts
│   │   ├── AuthProvider.tsx
│   │   ├── ToursContext.tsx
│   │   ├── BookingContext.tsx
│   │   └── ...
│   ├── lib/            # Core utilities
│   │   ├── supabaseClient.ts
│   │   ├── types.ts
│   │   └── api.ts
│   ├── db/
│   │   └── migrations/  # 22 SQL files
│   ├── hooks/          # Custom React hooks
│   ├── utils/          # Helper functions
│   ├── App.tsx         # Main app component
│   ├── main.tsx        # Entry point
│   └── index.css       # Global styles
├── .github/
│   └── workflows/
│       └── deploy.yml  # CI/CD pipeline
├── index.html          # HTML template
├── package.json        # Dependencies
├── vite.config.ts      # Vite configuration
├── tsconfig.json       # TypeScript config
├── tailwind.config.js  # Tailwind config
├── README.md           # Project documentation
└── .env.example        # Environment template
```

### Development Commands

```bash
# Development
npm run dev              # Start dev server (hot reload)

# Building
npm run build            # TypeScript compile + Vite build
npm run preview          # Preview production build

# Testing
npm run test             # Run Vitest tests
npm run test:run         # Run tests once (CI mode)

# Linting
npm run lint             # ESLint check
npm run lint --fix       # Auto-fix linting issues

# Deployment
npm run deploy           # Build + deploy to GitHub Pages
```

### Testing Strategy

**Unit Tests** (Vitest + React Testing Library):
- Component rendering tests
- User interaction tests
- Context provider tests
- Utility function tests

**Integration Tests**:
- Full booking flow
- Review submission flow
- Authentication flow

**Manual Testing Required**:
- Database RLS policies
- Real-time subscriptions
- Payment tracking
- Multi-user scenarios

**Test Files**: `*.test.tsx` or `*.test.ts`

Example:
```typescript
import { render, screen } from '@testing-library/react';
import { TourCard } from './TourCard';

describe('TourCard', () => {
  it('renders tour information', () => {
    const tour = { title: 'Test Tour', price: 100, ... };
    render(<TourCard tour={tour} />);
    expect(screen.getByText('Test Tour')).toBeInTheDocument();
  });
});
```

---

## 📦 Deployment

### GitHub Pages Deployment

**Configuration** (`vite.config.ts`):
```typescript
export default defineConfig({
  base: '/Guides/',  // Repository name
  plugins: [react()],
});
```

**GitHub Actions** (`.github/workflows/deploy.yml`):
- Trigger: Push to main branch
- Steps:
  1. Checkout code
  2. Setup Node.js 18
  3. Install dependencies
  4. Build project
  5. Deploy to GitHub Pages

**Manual Deployment**:
```bash
npm run deploy
# Builds and pushes to gh-pages branch
```

**URL**: `https://lordzura.github.io/Guides/`

### Environment Variables

**Required**:
- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous key (public)

**Security Note**: Anon key is safe for client-side use. RLS policies protect data.

### Production Considerations

1. **Bundle Size**: ~1MB (large)
   - Consider code splitting
   - Lazy load routes
   - Optimize images

2. **Performance**:
   - Enable Vite build optimizations
   - Use CDN for assets
   - Implement caching strategies

3. **SEO**:
   - Add meta tags
   - Implement Open Graph tags
   - Consider SSR for better indexing

4. **Monitoring**:
   - Error tracking (Sentry)
   - Analytics (Google Analytics)
   - Performance monitoring

---

## 🐛 Known Issues & Limitations

### Current Issues

1. **Bundle Size**: 1MB+ bundle
   - **Impact**: Slow initial load
   - **Solution**: Code splitting, lazy loading

2. **ESLint Warnings**: 52 warnings
   - **Impact**: Code quality
   - **Solution**: Clean up console.log, fix TypeScript any types

3. **SQL Migration Conflicts**:
   - **Impact**: Confusion during setup
   - **Files**: 013-017 (review functions), 012/018/019 (booking policies)
   - **Solution**: Use recommended sequence (015, 017, 018, 020)

4. **No Actual Payment Processing**:
   - **Impact**: Manual payment tracking only
   - **Solution**: Integrate Stripe or PayPal

5. **Limited Test Coverage**:
   - **Impact**: Potential undetected bugs
   - **Solution**: Add more unit and integration tests

### Limitations

1. **No Image Upload**: Tours use placeholder images
2. **No Chat System**: No direct messaging between users
3. **No Map Integration**: Locations are text-only
4. **No Email Notifications**: Only in-app notifications
5. **No Calendar Integration**: Dates don't sync with calendars
6. **No Currency Conversion**: Single currency only
7. **No Multi-language Support**: UI in English only

### Future Enhancements

1. **Image Management**:
   - Supabase Storage for tour photos
   - Multiple images per tour
   - Image optimization

2. **Messaging System**:
   - Real-time chat between tourists and guides
   - Message history
   - Notifications for new messages

3. **Map Integration**:
   - Google Maps or Mapbox
   - Visual tour routes
   - Distance calculations

4. **Email Notifications**:
   - Transactional emails
   - Booking confirmations
   - Reminders

5. **Payment Integration**:
   - Stripe Connect for payments
   - Escrow system
   - Automated payouts

6. **Advanced Search**:
   - Full-text search
   - Faceted search
   - Recommendations

7. **Mobile App**:
   - React Native app
   - Push notifications
   - Offline support

---

## 🎓 Implementation Guidelines

### For AI Assistants Building This

1. **Start with Database**:
   - Set up Supabase project first
   - Execute all SQL migrations in order
   - Verify RLS policies are active
   - Test database functions

2. **Build Frontend Foundation**:
   - Set up Vite + React + TypeScript
   - Install Chakra UI
   - Configure React Router
   - Create theme configuration

3. **Implement Authentication**:
   - Supabase Auth integration
   - AuthProvider context
   - Protected routes
   - AuthModal component

4. **Core Features Order**:
   a. Tour browsing (Explore page)
   b. Tour details view
   c. User dashboard (basic)
   d. Tour creation (guides)
   e. Booking system (tourists)
   f. Review system
   g. Notifications
   h. Advanced features (templates, payment tracking)

5. **Component Development**:
   - Start with presentational components
   - Add interactivity
   - Connect to contexts
   - Test with real data

6. **Testing Strategy**:
   - Write tests alongside features
   - Test critical paths first
   - Manual test booking flows
   - Test with different user roles

7. **Optimization**:
   - Code splitting last
   - Optimize after core features work
   - Profile performance
   - Fix ESLint warnings

### Code Quality Standards

1. **TypeScript**: Use strict mode, avoid `any`
2. **Components**: Functional components with hooks
3. **State**: Context API for global state, local state for component-specific
4. **Styling**: Chakra UI components, minimal custom CSS
5. **API Calls**: Centralize in context providers or custom hooks
6. **Error Handling**: Try-catch blocks, user-friendly error messages
7. **Loading States**: Show spinners/skeletons during data fetching
8. **Empty States**: Friendly messages when no data

### Accessibility

1. **Semantic HTML**: Use proper HTML5 elements
2. **ARIA Labels**: Add for screen readers
3. **Keyboard Navigation**: All interactive elements accessible
4. **Color Contrast**: WCAG AA compliance
5. **Focus Indicators**: Visible focus states
6. **Alt Text**: For images (when implemented)

### Mobile Responsiveness

1. **Mobile-First**: Design for mobile, scale up
2. **Touch Targets**: Minimum 44x44px
3. **Responsive Grids**: Use Chakra UI responsive props
4. **Breakpoints**: Test at base, md, lg
5. **Navigation**: Hamburger menu on mobile
6. **Forms**: Large input fields for mobile

---

## 📚 Reference Documentation

### Key Files to Reference

1. **README.md**: Overall project documentation
2. **SQL_REFERENCE.md**: Complete database guide
3. **CONTRIBUTING.md**: Development guidelines
4. **DEVELOPMENT_GUIDE.md**: Quick reference
5. **package.json**: Dependencies and scripts
6. **vite.config.ts**: Build configuration
7. **.env.example**: Environment variables

### External Documentation

1. **React**: https://react.dev/
2. **TypeScript**: https://www.typescriptlang.org/docs/
3. **Chakra UI**: https://chakra-ui.com/docs/
4. **Supabase**: https://supabase.com/docs
5. **Vite**: https://vitejs.dev/guide/
6. **React Router**: https://reactrouter.com/
7. **Vitest**: https://vitest.dev/

### Sample Data

**Sample Tour**:
```json
{
  "title": "Tbilisi Old Town Walking Tour",
  "description": "Explore the historic streets of Tbilisi's Old Town, including Narikala Fortress, sulfur baths, and local wine tasting.",
  "location": "Tbilisi, Georgia",
  "locations": [
    { "id": "1", "name": "Freedom Square", "order": 0 },
    { "id": "2", "name": "Narikala Fortress", "order": 1 },
    { "id": "3", "name": "Sulfur Baths", "order": 2 },
    { "id": "4", "name": "Wine Tasting", "order": 3 }
  ],
  "duration": 4,
  "price": 45,
  "capacity": 8,
  "languages": ["en", "ka", "ru"],
  "days_available": [true, true, true, true, true, false, false],
  "is_private": false
}
```

**Sample Booking**:
```json
{
  "tour_id": "uuid",
  "tourist_id": "uuid",
  "guide_id": "uuid",
  "status": "requested",
  "date": "2025-11-01T10:00:00Z",
  "guests": 2,
  "total_price": 90,
  "special_requests": "Vegetarian lunch options please"
}
```

**Sample Review**:
```json
{
  "reviewer_id": "uuid",
  "target_id": "uuid",
  "target_type": "tour",
  "rating": 5,
  "comment": "Incredible experience! Our guide was knowledgeable and friendly. The wine tasting was a highlight. Highly recommend!"
}
```

---

## ✅ Success Criteria

### Functional Requirements

- [ ] Users can register as guide or tourist
- [ ] Users can log in and log out
- [ ] Tourists can browse and search tours
- [ ] Tourists can view tour details
- [ ] Tourists can create booking requests
- [ ] Guides can create and edit tours
- [ ] Guides can accept/decline booking requests
- [ ] Guides can create custom offers
- [ ] Both roles can leave reviews
- [ ] Real-time notifications work
- [ ] Dashboard shows role-appropriate content
- [ ] Payment tracking displays correctly

### Technical Requirements

- [ ] TypeScript with no errors
- [ ] ESLint passes with <50 warnings
- [ ] Build completes successfully
- [ ] All database migrations execute in order
- [ ] RLS policies protect data correctly
- [ ] Responsive on mobile, tablet, desktop
- [ ] Chakra UI theme consistent
- [ ] React Router navigation works
- [ ] Supabase integration functional

### User Experience

- [ ] Intuitive navigation
- [ ] Clear call-to-action buttons
- [ ] Loading states for async operations
- [ ] Error messages are helpful
- [ ] Forms validate input
- [ ] Empty states guide user actions
- [ ] Notifications are timely
- [ ] Mobile experience is smooth

### Performance

- [ ] Initial load < 3 seconds
- [ ] Page transitions smooth
- [ ] No layout shifts
- [ ] Images optimized (when added)
- [ ] Database queries efficient

---

## 🎬 Final Notes

This document provides a complete specification for recreating **TourGuideHub** from scratch. It includes:

✅ **Complete technical architecture** with all tech stack details  
✅ **Full database schema** with 7 tables, RLS policies, and functions  
✅ **Detailed feature specifications** for all 10 major features  
✅ **UI/UX design system** with colors, typography, and components  
✅ **Complete API integration guide** with Supabase patterns  
✅ **State management** with 8 context providers  
✅ **29 component specifications** with props and behavior  
✅ **Routing and page structure** for 5 main pages  
✅ **Security and permissions** with RLS policy examples  
✅ **Development workflow** and deployment instructions  
✅ **Known issues and limitations** for realistic expectations  
✅ **Implementation guidelines** for AI assistants  

### Recommended Build Order

1. **Phase 1** (Foundation - Week 1):
   - Database setup (all migrations)
   - React + Vite + TypeScript setup
   - Chakra UI theme
   - Authentication system
   - Basic routing

2. **Phase 2** (Core Features - Week 2-3):
   - Tour browsing (Explore page)
   - Tour details page
   - Dashboard (basic structure)
   - Tour creation (guides)

3. **Phase 3** (Booking System - Week 4):
   - Booking request flow
   - Booking management
   - Guide acceptance
   - Status tracking

4. **Phase 4** (Reviews & Notifications - Week 5):
   - Review system
   - Rating aggregation
   - Real-time notifications
   - Notification UI

5. **Phase 5** (Advanced Features - Week 6):
   - Template system
   - Payment tracking
   - Profile editing
   - Multi-location tours

6. **Phase 6** (Polish - Week 7):
   - Bug fixes
   - Performance optimization
   - Testing
   - Documentation

### Estimated Effort

- **Total Development Time**: 6-8 weeks for 1 experienced developer
- **Lines of Code**: ~15,000-20,000 (excluding node_modules)
- **Database Schema**: 22 migration files, ~1,500 lines SQL
- **React Components**: 29 components
- **Pages**: 5 main pages
- **Contexts**: 8 context providers

### Critical Success Factors

1. **Database First**: Get all migrations running correctly before frontend work
2. **RLS Policies**: Test thoroughly - security is critical
3. **Role-Based Logic**: Always check user role before operations
4. **Real-time**: Supabase subscriptions must be set up early
5. **Mobile**: Test on mobile devices throughout development
6. **Error Handling**: Never leave async operations without error handling

---

**Good luck building TourGuideHub!** 🚀

This specification should provide everything needed to recreate this application from scratch. If you have questions about any specific feature or technical detail, refer back to the relevant section or the original codebase documentation.
