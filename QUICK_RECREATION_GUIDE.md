# TourGuideHub - Quick Recreation Summary

> **Quick Start Guide**: This is a condensed version of AI_RECREATION_PROMPT.md for rapid reference. For complete details, see the full prompt document.

---

## 🎯 What to Build

**TourGuideHub** = Airbnb for Tour Guides

A two-sided marketplace connecting tourists with local tour guides, featuring:
- Real-time booking management
- Dual role system (Tourist/Guide)
- Review and rating system
- Payment tracking
- Live notifications
- Multi-location tour itineraries

---

## 🛠️ Tech Stack - EXACT versions

### Frontend
```json
{
  "react": "18.2.0",
  "typescript": "5.0.2",
  "@chakra-ui/react": "2.10.9",
  "react-router-dom": "6.18.0",
  "vite": "4.4.5",
  "framer-motion": "12.23.12",
  "@supabase/supabase-js": "2.38.4"
}
```

### Backend
- **Supabase** (PostgreSQL + Auth + Real-time)
- **7 database tables**
- **22 SQL migration files**
- **Row Level Security (RLS)** on all tables

### Build & Deploy
- **Vite** for building
- **GitHub Pages** for hosting
- **GitHub Actions** for CI/CD

---

## 📊 Database Schema (7 Tables)

### 1. profiles
```sql
- id (UUID, FK to auth.users)
- full_name, phone, avatar_url
- role: 'guide' | 'tourist'
- bio, interests[], languages[], experience_years
```

### 2. tours
```sql
- id, title, description
- location (string), locations (JSONB array)
- duration, price, capacity
- languages[], days_available[7]
- creator_id, is_active
```

### 3. bookings
```sql
- id, tour_id, tourist_id, guide_id
- status: requested | offered | accepted | declined | paid | completed | cancelled
- date, guests, total_price, payment_status
```

### 4. reviews
```sql
- id, reviewer_id, target_id
- target_type: 'guide' | 'tour'
- rating (1-5), comment
- Unique constraint: (reviewer_id, target_id, target_type)
```

### 5. notifications
```sql
- id, recipient_id, actor_id
- type, title, message, action_url
- is_read, created_at
```

### 6. languages
```sql
- id, code (en, es, fr, etc.)
- name, native_name, is_active
- ⚠️ REQUIRED: App fails without this
```

### 7. tour_templates
```sql
- id, name, description
- template_data (JSONB - complete tour config)
- is_system_template, creator_id, usage_count
```

---

## 🎨 UI Design

### Theme
- **Primary Color**: Blue (#2195eb)
- **Component Library**: Chakra UI
- **Mobile-First**: All designs responsive
- **Typography**: System fonts, 16px base

### Key Breakpoints
- Mobile: 0-767px
- Tablet: 768-991px
- Desktop: 992px+

### Color Usage
- Buttons: `primary.500`
- Links: `primary.600`
- Backgrounds: White/Gray
- Badges: `primary.50`

---

## 📱 Core Pages (5)

### 1. Explore (`/explore`)
- **Public**
- Browse tours and guides
- Filters: language, location, price, rating, days
- Tabs: Tours | Guides
- Search functionality

### 2. Tour Details (`/tours/:id`)
- **Public**
- Tour information display
- Multi-location itinerary
- Booking form (logged in tourists)
- Reviews section
- Guide profile preview

### 3. Dashboard (`/dashboard`)
- **Protected**
- **Tourist**: My Bookings, My Reviews, Profile
- **Guide**: My Tours, Bookings, Earnings, Reviews, Profile
- Role-specific tabs and features

### 4. Guide Profile (`/profile/:id`)
- **Public**
- Guide information
- Their tours list
- Reviews and ratings
- Contact option

### 5. Home (`/`)
- Redirects to `/explore`

---

## 🔧 Core Features (10)

### 1. Authentication
- Supabase Auth
- Role selection on signup: **Guide or Tourist**
- Protected routes
- AuthModal component

### 2. Tour Discovery
- Browse all active tours
- Multi-filter system
- Search by keyword
- Sort options
- Pagination

### 3. Tour Management (Guides)
- Create tours from scratch or template
- Multi-location itinerary manager
- Edit/deactivate tours
- Save as template
- View bookings per tour

### 4. Booking System
- **Tourist → Guide**: Request booking
- **Guide → Tourist**: Create custom offer
- Accept/decline flows
- Status tracking
- Payment status

### 5. Review System
- Rate tours and guides (1-5 stars)
- Written comments
- Aggregate ratings
- Distribution chart
- One review per reviewer/target

### 6. Real-time Notifications
- Supabase subscriptions
- Bell icon with badge
- Dropdown panel
- Types: booking_request, booking_accepted, review_received, etc.

### 7. Payment Tracking
- Guide: Total earnings, pending, paid
- Tourist: Total spent, payment history
- No actual payment processing (manual)

### 8. Template System
- System templates (pre-built)
- User templates (save own tours)
- Quick tour creation

### 9. Multi-location Tours
- Ordered itinerary
- Add/remove/reorder locations
- Notes per location
- Visual display

### 10. Profile Management
- Edit personal info
- Avatar upload (Supabase Storage)
- Role-specific fields
- Languages and experience (guides)

---

## 🧩 Key Components (Top 10)

1. **NavBar** - Top navigation with auth/profile
2. **TourCard** - Tour display in grid
3. **GuideCard** - Guide profile card
4. **BookingForm** - Create booking request
5. **TourForm** - Create/edit tours
6. **ReviewForm** - Submit review
7. **ReviewsList** - Display reviews
8. **ReviewsSummary** - Aggregate ratings
9. **BookingItem** - Single booking display
10. **ProfileEditor** - Edit user profile

---

## 🔌 State Management (8 Contexts)

1. **AuthProvider** - User auth & profile
2. **ModalProvider** - Modal state
3. **ToursContext** - Tour CRUD
4. **BookingContext** - Booking management
5. **ReviewsProvider** - Reviews & ratings
6. **NotificationContext** - Real-time notifications
7. **TourTemplateContext** - Template management
8. **PaymentStatsContext** - Payment analytics

---

## 🔒 Security (RLS Policies)

### Pattern Examples

**Public Read:**
```sql
CREATE POLICY "public_read" ON tours
  FOR SELECT USING (is_active = true);
```

**Owner Write:**
```sql
CREATE POLICY "owner_update" ON tours
  FOR UPDATE USING (creator_id = auth.uid());
```

**Role-Based:**
```sql
CREATE POLICY "guides_create" ON tours
  FOR INSERT WITH CHECK (
    creator_id = auth.uid() AND
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'guide'
  );
```

**Complex (Bookings):**
- Tourist can create requests
- Guide can accept requests
- Tourist can accept offers
- Both can cancel
- See migration files 012, 018, 019

---

## 🚀 Setup & Build

### Installation
```bash
# Clone repo
git clone <repo>
cd Guides

# Install dependencies (427 packages)
npm install

# Setup environment
cp .env.example .env.local
# Edit: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY

# Database setup
# Execute src/db/migrations/*.sql in order (001-022)
# CRITICAL: Run 011_create_languages_table.sql

# Start dev server
npm run dev  # localhost:5173

# Build for production
npm run build  # Output: /dist

# Deploy
npm run deploy  # GitHub Pages
```

### Recommended Migration Order
```
001-009  # Core tables
011      # Languages (REQUIRED)
018      # Booking policies (skip 010, 012)
015, 017 # Review functions (skip 013, 014, 016)
020      # Review constraint
021      # Review summaries
```

---

## 📋 Booking Status Flow

```
Tourist Initiated:
  requested → (guide accepts) → accepted → paid → completed

Guide Initiated:
  offered → (tourist accepts) → accepted → paid → completed

Rejections:
  requested → declined
  offered → declined

Cancellations:
  accepted → cancelled
```

---

## 🎭 User Role Differences

### Tourist Can:
- Browse tours and guides
- Create booking requests
- Accept guide offers
- Leave reviews after completion
- Track payments

### Guide Can:
- Create and manage tours
- Accept/decline booking requests
- Create custom offers
- Track earnings
- View aggregated ratings
- Use templates

---

## 📊 Database Functions

### get_review_summary(target_id, target_type)
**Returns:**
```typescript
{
  average_rating: number,
  total_reviews: number,
  rating_counts: {
    '1': number,
    '2': number,
    '3': number,
    '4': number,
    '5': number
  }
}
```

**For Guides**: Aggregates direct guide reviews + all tour reviews
**For Tours**: Direct tour reviews only

**Latest Version**: Migration 017

---

## 🎨 Component Props Quick Reference

### TourCard
```typescript
props: {
  tour: Tour;
  onClick?: () => void;
}
```

### BookingForm
```typescript
props: {
  tour: Tour;
  onSuccess: () => void;
}
```

### ReviewForm
```typescript
props: {
  targetId: string;
  targetType: 'tour' | 'guide';
  onSuccess: () => void;
}
```

### ReviewsSummary
```typescript
props: {
  summary: {
    average_rating: number;
    total_reviews: number;
    rating_counts: Record<string, number>;
  };
}
```

---

## ⚠️ Critical Notes

### Must-Do's:
1. **Enable RLS** on ALL tables
2. **Run migration 011** (languages table) - app fails without it
3. **Use migration 017** for review functions (latest version)
4. **Test with both roles** (guide and tourist)
5. **Set up real-time subscriptions** for notifications

### Common Pitfalls:
1. Skipping migrations or running out of order
2. Forgetting to enable RLS policies
3. Not testing booking flows with both roles
4. Missing environment variables
5. Using wrong base path for routing (`/Guides/`)

### Known Issues:
1. Bundle size: 1MB (needs code splitting)
2. No actual payment processing (manual tracking)
3. No image upload (placeholders only)
4. Limited test coverage
5. 52 ESLint warnings

---

## 🎯 Success Checklist

- [ ] Database: All 22 migrations execute successfully
- [ ] Auth: Can sign up as guide/tourist, log in/out
- [ ] Tours: Browse, filter, view details
- [ ] Bookings: Tourist request, guide accept, status tracking
- [ ] Reviews: Submit, view, aggregate ratings
- [ ] Notifications: Real-time updates work
- [ ] Dashboard: Role-specific content displays
- [ ] Mobile: Responsive on all breakpoints
- [ ] Build: Completes without errors
- [ ] Deploy: Works on GitHub Pages

---

## 📦 Project Metrics

- **Total Lines of Code**: ~15,000-20,000
- **SQL Lines**: ~1,500 (22 files)
- **Components**: 29
- **Pages**: 5
- **Contexts**: 8
- **Database Tables**: 7
- **Build Size**: ~1MB
- **Build Time**: ~6.5 seconds
- **Dependencies**: 427 packages
- **Estimated Development**: 6-8 weeks (1 dev)

---

## 🔗 Related Documents

- **AI_RECREATION_PROMPT.md** - Complete detailed specification (49KB)
- **README.md** - Project overview and agent guide
- **SQL_REFERENCE.md** - Database migration guide
- **CONTRIBUTING.md** - Development guidelines
- **DEVELOPMENT_GUIDE.md** - Quick reference commands

---

## 🏁 Quick Start for AI

1. **Read full prompt**: AI_RECREATION_PROMPT.md
2. **Setup Supabase**: Create project, get credentials
3. **Run migrations**: Execute SQL files 001-022 in order
4. **Create React app**: Vite + TypeScript + Chakra UI
5. **Implement auth**: AuthProvider + AuthModal
6. **Build pages**: Explore → Details → Dashboard
7. **Add features**: Bookings → Reviews → Notifications
8. **Test thoroughly**: Both user roles, all flows
9. **Deploy**: GitHub Pages with Actions

---

**Total Recreation Time**: 6-8 weeks for experienced developer

**Most Complex Parts**:
1. Booking system with dual flows
2. RLS policies for bookings
3. Review aggregation for guides
4. Real-time notification system
5. Multi-location tour management

**Easiest Parts**:
1. Basic authentication
2. Tour browsing
3. Profile editing
4. Static components
5. Basic CRUD operations

---

For complete implementation details, code samples, and comprehensive specifications, refer to **AI_RECREATION_PROMPT.md**.
